import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { CustomPropertyValue } from './custom-property-value.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  project_id!: string;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column('uuid', { nullable: true })
  assignee_id!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  due_date!: Date;

  @Column('uuid')
  created_by!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at!: Date;

  @ManyToOne(() => Project, project => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, user => user.assignedTasks)
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @OneToMany(() => Comment, comment => comment.task)
  comments!: Comment[];

  @OneToMany(() => CustomPropertyValue, value => value.task)
  customPropertyValues!: CustomPropertyValue[];
}
