import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CustomProperty, EntityType } from './custom-property.entity';
import { Task } from './task.entity';

@Entity('custom_property_values')
export class CustomPropertyValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  entity_id: string; // Could be task_id, project_id, etc.

  @Column({
    type: 'enum',
    enum: EntityType
  })
  entity_type: EntityType;

  @Column('uuid')
  custom_property_id: string;

  @Column('jsonb')
  value: any;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => CustomProperty, prop => prop.values)
  @JoinColumn({ name: 'custom_property_id' })
  customProperty: CustomProperty;

  // Example of a possible relation, you might need more for other entity types
  @ManyToOne(() => Task, task => task.customPropertyValues)
  @JoinColumn({ name: 'entity_id', referencedColumnName: 'id' })
  task: Task;
}
