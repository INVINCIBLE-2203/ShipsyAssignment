import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { CustomPropertyValue } from './custom-property-value.entity';

export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  USER = 'user',
}

export enum EntityType {
    TASK = 'task',
    PROJECT = 'project',
}

@Entity('custom_properties')
export class CustomProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organization_id: string;

  @Column({
      type: 'enum',
      enum: EntityType
  })
  entity_type: EntityType

  @Column()
  property_name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  property_type: PropertyType;

  @Column('jsonb', { nullable: true })
  options: any; // For select or multi_select

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Organization, org => org.customProperties)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => CustomPropertyValue, value => value.customProperty)
  values: CustomPropertyValue[];
}
