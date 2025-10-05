
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization } from '../../database/entities/organization.entity';
import { OrganizationMember, MemberRole } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AppError } from '../../common/AppError';
import { PaginationParams } from '../../utils/pagination.util';
import slugify from 'slugify';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createOrganization(userId: string, dto: CreateOrganizationDto): Promise<Organization> {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existingOrg = await this.organizationRepository.findOne({ where: { slug } });
    if (existingOrg) {
      throw new AppError(409, 'Organization with this name already exists.');
    }

    return this.dataSource.transaction(async manager => {
      const organization = manager.create(Organization, {
        name: dto.name,
        slug,
      });
      await manager.save(organization);

      const member = manager.create(OrganizationMember, {
        organization_id: organization.id,
        user_id: userId,
        role: MemberRole.OWNER,
      });
      await manager.save(member);

      return organization;
    });
  }

  async getUserOrganizations(userId: string, pagination: PaginationParams) {
    const qb = this.organizationMemberRepository.createQueryBuilder('member')
      .where('member.user_id = :userId', { userId })
      .leftJoinAndSelect('member.organization', 'organization')
      .select([
        'organization.id',
        'organization.name',
        'organization.slug',
        'member.role',
      ])
      .addSelect(subQuery => {
        return subQuery
          .select('COUNT(m.user_id)', 'memberCount')
          .from(OrganizationMember, 'm')
          .where('m.organization_id = organization.id');
      }, 'memberCount')
      .offset(((pagination.page || 1) - 1) * (pagination.limit || 10))
      .limit(pagination.limit || 10);

    const [memberships, total] = await qb.getManyAndCount();
    return {
      data: memberships.map(m => ({ ...m.organization, role: m.role, memberCount: (m as any).memberCount })),
      total,
    };
  }

  async getOrganizationById(orgId: string, userId: string): Promise<Organization> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You are not a member of this organization.');
    }

    const organization = await this.organizationRepository.createQueryBuilder('org')
      .where('org.id = :orgId', { orgId })
      .loadRelationCountAndMap('org.memberCount', 'org.members')
      .loadRelationCountAndMap('org.projectCount', 'org.projects')
      .getOne();

    if (!organization) {
      throw new AppError(404, 'Organization not found.');
    }
    return organization;
  }

  async updateOrganization(orgId: string, userId: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError(403, 'You do not have permission to update this organization.');
    }

    const organization = await this.organizationRepository.findOneBy({ id: orgId });
    if (!organization) {
      throw new AppError(404, 'Organization not found.');
    }

    Object.assign(organization, dto);
    if (dto.name) {
      organization.slug = slugify(dto.name, { lower: true, strict: true });
    }

    await this.organizationRepository.save(organization);
    return organization;
  }

  async deleteOrganization(orgId: string, userId: string): Promise<void> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member || member.role !== MemberRole.OWNER) {
      throw new AppError(403, 'You do not have permission to delete this organization.');
    }
    // TypeORM cascades should handle deletion of related entities if configured correctly.
    await this.organizationRepository.delete(orgId);
  }

  async inviteMember(orgId: string, inviterId: string, email: string, role: MemberRole): Promise<OrganizationMember> {
    const inviter = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: inviterId } });
    if (!inviter || ![MemberRole.OWNER, MemberRole.ADMIN].includes(inviter.role)) {
      throw new AppError(403, 'You do not have permission to invite members.');
    }

    const userToInvite = await this.userRepository.findOne({ where: { email } });
    if (!userToInvite) {
      throw new AppError(404, 'User with this email does not exist.');
    }

    const existingMember = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userToInvite.id } });
    if (existingMember) {
      throw new AppError(409, 'User is already a member of this organization.');
    }

    const newMember = this.organizationMemberRepository.create({
      organization_id: orgId,
      user_id: userToInvite.id,
      role,
    });

    await this.organizationMemberRepository.save(newMember);
    return newMember;
  }

  async updateMemberRole(orgId: string, adminId: string, memberId: string, newRole: MemberRole): Promise<void> {
    const admin = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: adminId } });
    if (!admin || ![MemberRole.OWNER, MemberRole.ADMIN].includes(admin.role)) {
      throw new AppError(403, 'You do not have permission to update roles.');
    }

    if (admin.role !== MemberRole.OWNER && newRole === MemberRole.OWNER) {
        throw new AppError(403, 'Only owners can assign the owner role.');
    }

    const memberToUpdate = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: memberId } });
    if (!memberToUpdate) {
      throw new AppError(404, 'Member not found in this organization.');
    }

    if (memberToUpdate.role === MemberRole.OWNER) {
      const ownerCount = await this.organizationMemberRepository.count({ where: { organization_id: orgId, role: MemberRole.OWNER } });
      if (ownerCount <= 1) {
        throw new AppError(400, 'Cannot demote the last owner.');
      }
    }

    memberToUpdate.role = newRole;
    await this.organizationMemberRepository.save(memberToUpdate);
  }

  async removeMember(orgId: string, adminId: string, memberId: string): Promise<void> {
    const admin = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: adminId } });
    if (!admin || ![MemberRole.OWNER, MemberRole.ADMIN].includes(admin.role)) {
      throw new AppError(403, 'You do not have permission to remove members.');
    }

    const memberToRemove = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: memberId } });
    if (!memberToRemove) {
      throw new AppError(404, 'Member not found in this organization.');
    }

    if (memberToRemove.role === MemberRole.OWNER) {
      const ownerCount = await this.organizationMemberRepository.count({ where: { organization_id: orgId, role: MemberRole.OWNER } });
      if (ownerCount <= 1) {
        throw new AppError(400, 'Cannot remove the last owner.');
      }
    }

    await this.organizationMemberRepository.remove(memberToRemove);
  }

  async getOrganizationMembers(orgId: string, userId: string, pagination: PaginationParams) {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You are not a member of this organization.');
    }

    const [members, total] = await this.organizationMemberRepository.findAndCount({
        where: { organization_id: orgId },
        relations: ['user'],
        take: pagination.limit || 10,
        skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
        select: {
            user: {
                id: true,
                username: true,
                email: true,
            },
            role: true,
            joined_at: true,
        }
    });

    return { data: members, total };
  }
}
