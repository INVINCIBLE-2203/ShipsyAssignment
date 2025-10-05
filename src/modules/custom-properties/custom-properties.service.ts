
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomProperty, PropertyType, EntityType } from '../../database/entities/custom-property.entity';
import { CustomPropertyValue } from '../../database/entities/custom-property-value.entity';
import { OrganizationMember, MemberRole } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';
import { CreateCustomPropertyDto } from './dto/create-custom-property.dto';
import { UpdateCustomPropertyDto } from './dto/update-custom-property.dto';
import { AppError } from '../../common/AppError';

@Injectable()
export class CustomPropertiesService {
  constructor(
    @InjectRepository(CustomProperty)
    private customPropertyRepository: Repository<CustomProperty>,
    @InjectRepository(CustomPropertyValue)
    private customPropertyValueRepository: Repository<CustomPropertyValue>,
    @InjectRepository(OrganizationMember)
    private organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async defineCustomProperty(orgId: string, userId: string, dto: CreateCustomPropertyDto): Promise<CustomProperty> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError(403, 'Only organization owners and admins can define custom properties.');
    }

    const prop = this.customPropertyRepository.create({
      organization_id: orgId,
      property_name: dto.name,
      property_type: dto.type as any,
      entity_type: dto.entityType as any,
      options: dto.options,
    });

    return this.customPropertyRepository.save(prop);
  }

  async getOrganizationProperties(orgId: string, entityType: 'task' | 'project'): Promise<CustomProperty[]> {
    return this.customPropertyRepository.find({ where: { organization_id: orgId, entity_type: entityType as any } });
  }

  async updatePropertyDefinition(propertyId: string, userId: string, dto: UpdateCustomPropertyDto): Promise<CustomProperty> {
    const prop = await this.customPropertyRepository.findOne({ where: { id: propertyId } });
    if (!prop) {
      throw new AppError(404, 'Custom property not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: prop.organization_id, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError(403, 'Only organization owners and admins can update custom properties.');
    }

    prop.property_name = dto.name || prop.property_name;
    prop.options = dto.options || prop.options;

    return this.customPropertyRepository.save(prop);
  }

  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    const prop = await this.customPropertyRepository.findOne({ where: { id: propertyId } });
    if (!prop) {
      throw new AppError(404, 'Custom property not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: prop.organization_id, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError(403, 'Only organization owners and admins can delete custom properties.');
    }

    await this.customPropertyRepository.delete(propertyId);
  }

  async setPropertyValue(entityId: string, propertyId: string, value: any, userId: string): Promise<CustomPropertyValue> {
    const prop = await this.customPropertyRepository.findOne({ where: { id: propertyId } });
    if (!prop) {
      throw new AppError(404, 'Custom property not found.');
    }

    // Validation logic here based on prop.property_type
    // For example, for USER type, check if user exists in the org
    if (prop.property_type === PropertyType.USER) {
        const user = await this.userRepository.findOne({ where: { id: value } });
        if (!user) {
            throw new AppError(404, 'User not found.');
        }
        const member = await this.organizationMemberRepository.findOne({ where: { organization_id: prop.organization_id, user_id: value } });
        if (!member) {
            throw new AppError(400, 'User is not a member of this organization.');
        }
    }

    let propertyValue = await this.customPropertyValueRepository.findOne({ where: { entity_id: entityId, custom_property_id: propertyId } });
    if (!propertyValue) {
      propertyValue = this.customPropertyValueRepository.create({
        entity_id: entityId,
        entity_type: prop.entity_type,
        custom_property_id: propertyId,
      });
    }

    propertyValue.value = value;
    return this.customPropertyValueRepository.save(propertyValue);
  }

  async getEntityPropertyValues(entityId: string, entityType: string): Promise<CustomPropertyValue[]> {
    return this.customPropertyValueRepository.find({
      where: { entity_id: entityId, entity_type: entityType as any },
      relations: ['customProperty'],
    });
  }
}
