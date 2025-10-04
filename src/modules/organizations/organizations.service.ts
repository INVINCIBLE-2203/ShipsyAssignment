
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
      throw new AppError('Organization with this name already exists.', 409);
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
      .offset((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);

    const [memberships, total] = await qb.getManyAndCount();
    return {
      data: memberships.map(m => ({ ...m.organization, role: m.role, memberCount: (m as any).memberCount })),
      total,
    };
  }

  async getOrganizationById(orgId: string, userId: string): Promise<Organization> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError('You are not a member of this organization.', 403);
    }

    const organization = await this.organizationRepository.createQueryBuilder('org')
      .where('org.id = :orgId', { orgId })
      .loadRelationCountAndMap('org.memberCount', 'org.members')
      .loadRelationCountAndMap('org.projectCount', 'org.projects')
      .getOne();

    if (!organization) {
      throw new AppError('Organization not found.', 404);
    }
    return organization;
  }

  async updateOrganization(orgId: string, userId: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError('You do not have permission to update this organization.', 403);
    }

    const organization = await this.organizationRepository.findOneBy({ id: orgId });
    if (!organization) {
      throw new AppError('Organization not found.', 404);
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
      throw new AppError('You do not have permission to delete this organization.', 403);
    }
    // TypeORM cascades should handle deletion of related entities if configured correctly.
    await this.organizationRepository.delete(orgId);
  }

  async inviteMember(orgId: string, inviterId: string, email: string, role: MemberRole): Promise<OrganizationMember> {
    const inviter = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: inviterId } });
    if (!inviter || ![MemberRole.OWNER, MemberRole.ADMIN].includes(inviter.role)) {
      throw new AppError('You do not have permission to invite members.', 403);
    }

    const userToInvite = await this.userRepository.findOne({ where: { email } });
    if (!userToInvite) {
      throw new AppError('User with this email does not exist.', 404);
    }

    const existingMember = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userToInvite.id } });
    if (existingMember) {
      throw new AppError('User is already a member of this organization.', 409);
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
      throw new AppError('You do not have permission to update roles.', 403);
    }

    if (admin.role !== MemberRole.OWNER && newRole === MemberRole.OWNER) {
        throw new AppError('Only owners can assign the owner role.', 403);
    }

    const memberToUpdate = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: memberId } });
    if (!memberToUpdate) {
      throw new AppError('Member not found in this organization.', 404);
    }

    if (memberToUpdate.role === MemberRole.OWNER) {
      const ownerCount = await this.organizationMemberRepository.count({ where: { organization_id: orgId, role: MemberRole.OWNER } });
      if (ownerCount <= 1) {
        throw new AppError('Cannot demote the last owner.', 400);
      }
    }

    memberToUpdate.role = newRole;
    await this.organizationMemberRepository.save(memberToUpdate);
  }

  async removeMember(orgId: string, adminId: string, memberId: string): Promise<void> {
    const admin = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: adminId } });
    if (!admin || ![MemberRole.OWNER, MemberRole.ADMIN].includes(admin.role)) {
      throw new AppError('You do not have permission to remove members.', 403);
    }

    const memberToRemove = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: memberId } });
    if (!memberToRemove) {
      throw new AppError('Member not found in this organization.', 404);
    }

    if (memberToRemove.role === MemberRole.OWNER) {
      const ownerCount = await this.organizationMemberRepository.count({ where: { organization_id: orgId, role: MemberRole.OWNER } });
      if (ownerCount <= 1) {
        throw new AppError('Cannot remove the last owner.', 400);
      }
    }

    await this.organizationMemberRepository.remove(memberToRemove);
  }

  async getOrganizationMembers(orgId: string, userId: string, pagination: PaginationParams) {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError('You are not a member of this organization.', 403);
    }

    const [members, total] = await this.organizationMemberRepository.findAndCount({
        where: { organization_id: orgId },
        relations: ['user'],
        take: pagination.limit,
        skip: (pagination.page - 1) * pagination.limit,
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
