import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrganizationMember } from './organization-member.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  password_hash!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @OneToMany(() => OrganizationMember, member => member.user)
  organizationMemberships!: OrganizationMember[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks!: Task[];

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks!: Task[];

  @OneToMany(() => Comment, comment => comment.user)
  comments!: Comment[];
}
