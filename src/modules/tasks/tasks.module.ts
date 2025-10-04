import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, OrganizationMember])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule]
})
export class TasksModule {}
