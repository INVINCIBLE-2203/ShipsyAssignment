import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomPropertiesController } from './custom-properties.controller';
import { CustomPropertiesService } from './custom-properties.service';
import { CustomProperty } from '../../database/entities/custom-property.entity';
import { CustomPropertyValue } from '../../database/entities/custom-property-value.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomProperty, CustomPropertyValue, OrganizationMember, User])],
  controllers: [CustomPropertiesController],
  providers: [CustomPropertiesService],
})
export class CustomPropertiesModule {}
