import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrganizationMember } from './organization-member.entity';
import { Project } from './project.entity';
import { CustomProperty } from './custom-property.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @OneToMany(() => OrganizationMember, member => member.organization)
  members!: OrganizationMember[];

  @OneToMany(() => Project, project => project.organization)
  projects!: Project[];

  @OneToMany(() => CustomProperty, prop => prop.organization)
  customProperties!: CustomProperty[];
}
