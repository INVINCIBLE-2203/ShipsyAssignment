import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryColumn('uuid')
  user_id!: string;

  @PrimaryColumn('uuid')
  organization_id!: string;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role!: MemberRole;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  joined_at!: Date;

  @ManyToOne(() => User, user => user.organizationMemberships)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Organization, organization => organization.members)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;
}
