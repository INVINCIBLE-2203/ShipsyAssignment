import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { Task } from '../../database/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, OrganizationMember, Task])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
