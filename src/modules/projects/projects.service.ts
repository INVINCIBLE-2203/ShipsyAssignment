
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember, MemberRole } from '../../database/entities/organization-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AppError } from '../../common/AppError';
import { PaginationParams } from '../../utils/pagination.util';
import { Task, TaskStatus } from '../../database/entities/task.entity';

export interface ProjectFilterParams {
    name?: string;
    created_by?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async createProject(orgId: string, userId: string, dto: CreateProjectDto): Promise<Project> {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You must be a member of the organization to create a project.');
    }

    const project = this.projectRepository.create({
      ...dto,
      organization_id: orgId,
      created_by: userId,
    });

    return this.projectRepository.save(project);
  }

  async getOrganizationProjects(orgId: string, userId: string, filters: ProjectFilterParams, pagination: PaginationParams) {
    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: orgId, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You are not a member of this organization.');
    }

    const qb = this.projectRepository.createQueryBuilder('project')
      .where('project.organization_id = :orgId', { orgId })
      .leftJoinAndSelect('project.creator', 'creator')
      .select([
        'project.id',
        'project.name',
        'project.description',
        'project.created_at',
        'creator.id',
        'creator.username',
      ])
      .loadRelationCountAndMap('project.taskCount', 'project.tasks')
      .addSelect(subQuery => {
          return subQuery
            .select("CASE WHEN COUNT(t.id) = 0 THEN 0 ELSE CAST(COUNT(CASE WHEN t.status = 'done' THEN 1 END) * 100.0 / COUNT(t.id) AS FLOAT) END")
            .from(Task, 't')
            .where('t.project_id = project.id');
      }, 'completionRate')
      .offset(((pagination.page || 1) - 1) * (pagination.limit || 10))
      .limit(pagination.limit || 10);

    if (filters.name) {
      qb.andWhere('project.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.created_by) {
      qb.andWhere('project.created_by = :createdBy', { createdBy: filters.created_by });
    }

    const [projects, total] = await qb.getManyAndCount();
    return { data: projects, total };
  }

  async getProjectById(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: ['organization'] });
    if (!project) {
      throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have access to this project.');
    }

    const stats = await this.getProjectStats(projectId, userId);
    return { ...project, ...stats } as Project;
  }

  async updateProject(projectId: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have permission to update this project.');
    }

    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member || ![MemberRole.OWNER, MemberRole.ADMIN].includes(member.role)) {
      throw new AppError(403, 'You do not have permission to delete this project.');
    }

    // Delete all tasks associated with this project first (cascading delete)
    await this.taskRepository.delete({ project_id: projectId });

    // Then delete the project
    await this.projectRepository.delete(projectId);
  }

  async getProjectStats(projectId: string, userId: string) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
        throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member) {
        throw new AppError(403, 'You do not have access to this project.');
    }

    const totalTasks = await this.taskRepository.count({ where: { project_id: projectId } });
    const completedTasks = await this.taskRepository.count({ where: { project_id: projectId, status: TaskStatus.DONE } });
    const overdueTasks = await this.taskRepository.createQueryBuilder('task')
        .where('task.project_id = :projectId', { projectId })
        .andWhere('task.due_date < NOW()')
        .andWhere('task.status != :status', { status: TaskStatus.DONE })
        .getCount();

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const taskStatusBreakdown = await this.taskRepository.createQueryBuilder('task')
        .select('task.status')
        .addSelect('COUNT(task.id)', 'count')
        .where('task.project_id = :projectId', { projectId })
        .groupBy('task.status')
        .getRawMany();

    const taskPriorityBreakdown = await this.taskRepository.createQueryBuilder('task')
        .select('task.priority')
        .addSelect('COUNT(task.id)', 'count')
        .where('task.project_id = :projectId', { projectId })
        .groupBy('task.priority')
        .getRawMany();

    const teamInvolvement = await this.taskRepository.createQueryBuilder('task')
        .leftJoin('task.assignee', 'assignee')
        .select('assignee.id', 'userId')
        .addSelect('assignee.username', 'username')
        .addSelect('COUNT(task.id)', 'taskCount')
        .where('task.project_id = :projectId', { projectId })
        .andWhere('assignee.id IS NOT NULL')
        .groupBy('assignee.id')
        .addGroupBy('assignee.username')
        .orderBy('COUNT(task.id)', 'DESC')
        .getRawMany();

    return {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        taskStatusBreakdown,
        taskPriorityBreakdown,
        teamInvolvement,
    };
  }
}
