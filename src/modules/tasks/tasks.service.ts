import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AppError } from '../../common/AppError';
import { PaginationParams } from '../../utils/pagination.util';

export interface SortParams {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface TaskFilterParams {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    assignee?: string[];
    due_date_from?: string;
    due_date_to?: string;
    search?: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private organizationMemberRepository: Repository<OrganizationMember>,
  ) {}

  async createTask(projectId: string, userId: string, dto: CreateTaskDto): Promise<Task> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have access to this project.');
    }

    if (dto.assigneeId) {
        const assigneeMember = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: dto.assigneeId } });
        if (!assigneeMember) {
            throw new AppError(400, 'Assignee is not a member of this organization.');
        }
    }

    const task = this.taskRepository.create({
      ...dto,
      project_id: projectId,
      created_by: userId,
      status: TaskStatus.TODO,
    });

    return this.taskRepository.save(task);
  }

  async getProjectTasks(projectId: string, userId: string, filters: TaskFilterParams, pagination: PaginationParams, sorting: SortParams) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
        throw new AppError(404, 'Project not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: project.organization_id, user_id: userId } });
    if (!member) {
        throw new AppError(403, 'You do not have access to this project.');
    }

    // Normalize pagination parameters
    const page = Math.max(1, pagination.page || 1); // Ensure page is at least 1
    const limit = Math.min(100, Math.max(1, pagination.limit || 10)); // Ensure limit is between 1 and 100

    const qb = this.taskRepository.createQueryBuilder('task')
        .where('task.project_id = :projectId', { projectId })
        .leftJoinAndSelect('task.assignee', 'assignee')
        .select([
            'task',
            'assignee.id',
            'assignee.username',
        ])
        .addSelect('CASE WHEN task.due_date < NOW() AND task.status != \'done\' THEN EXTRACT(DAY FROM NOW() - task.due_date) ELSE 0 END', 'overdue_days');

    // Handle status filtering - normalize status values
    if (filters.status) {
        let statusArray: string[];
        if (Array.isArray(filters.status)) {
            statusArray = filters.status;
        } else {
            // Handle single status value from query parameter
            statusArray = [filters.status as string];
        }
        qb.andWhere('task.status IN (:...statuses)', { statuses: statusArray });
    }
    if (filters.priority?.length) {
        qb.andWhere('task.priority IN (:...priorities)', { priorities: filters.priority });
    }
    if (filters.assignee?.length) {
        qb.andWhere('task.assignee_id IN (:...assignees)', { assignees: filters.assignee });
    }
    if (filters.due_date_from) {
        qb.andWhere('task.due_date >= :from', { from: filters.due_date_from });
    }
    if (filters.due_date_to) {
        qb.andWhere('task.due_date <= :to', { to: filters.due_date_to });
    }
    if (filters.search) {
        qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', { search: `%${filters.search}%` });
    }

    if (sorting.sortBy) {
        qb.orderBy(`task.${sorting.sortBy}`, sorting.sortOrder || 'ASC');
    }

    const [tasks, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return { 
        data: tasks, 
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
    };
  }

  async getTaskById(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ 
        where: { id: taskId }, 
        relations: ['project', 'assignee', 'customPropertyValues', 'customPropertyValues.customProperty']
    });
    if (!task) {
      throw new AppError(404, 'Task not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have access to this task.');
    }

    const commentCount = await this.taskRepository.count({ where: { project_id: taskId } });
    (task as any).commentCount = commentCount;

    return task;
  }

  async updateTask(taskId: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] });
    if (!task) {
      throw new AppError(404, 'Task not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have permission to update this task.');
    }

    if (dto.assigneeId) {
        const assigneeMember = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: dto.assigneeId } });
        if (!assigneeMember) {
            throw new AppError(400, 'Assignee is not a member of this organization.');
        }
    }

    if (dto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
        task.completed_at = new Date();
    } else if (dto.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
        task.completed_at = undefined as any;
    }

    // Map DTO fields to entity fields with proper field names
    const updateData: Partial<Task> = {};
    
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assigneeId !== undefined) updateData.assignee_id = dto.assigneeId;
    if (dto.dueDate !== undefined) {
        updateData.due_date = dto.dueDate ? new Date(dto.dueDate) : undefined;
    }

    Object.assign(task, updateData);
    return this.taskRepository.save(task);
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] });
    if (!task) {
      throw new AppError(404, 'Task not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have permission to delete this task.');
    }

    await this.taskRepository.delete(taskId);
  }

  async assignTask(taskId: string, userId: string, assigneeId: string): Promise<Task> {
    // Notification stub
    console.log(`User ${userId} assigned task ${taskId} to user ${assigneeId}`);
    return this.updateTask(taskId, userId, { assigneeId });
  }

  async updateTaskStatus(taskId: string, userId: string, newStatus: TaskStatus): Promise<Task> {
    return this.updateTask(taskId, userId, { status: newStatus });
  }

  async searchTasks(userId: string, searchQuery: string, pagination: PaginationParams) {
    const userOrgs = await this.organizationMemberRepository.find({ where: { user_id: userId }, select: ['organization_id'] });
    const orgIds = userOrgs.map(m => m.organization_id);

    if (orgIds.length === 0) {
        return { data: [], total: 0 };
    }

    const qb = this.taskRepository.createQueryBuilder('task')
        .leftJoin('task.project', 'project')
        .where('project.organization_id IN (:...orgIds)', { orgIds })
        .andWhere('task.title @@ to_tsquery(:query)', { query: `${searchQuery}:*` })
        .orWhere('task.description @@ to_tsquery(:query)', { query: `${searchQuery}:*` })
        .leftJoinAndSelect('task.project', 'projectContext')
        .select([
            'task.id',
            'task.title',
            'task.status',
            'projectContext.id',
            'projectContext.name',
        ])
        .skip(((pagination.page || 1) - 1) * (pagination.limit || 10))
        .take(pagination.limit || 10);

    const [tasks, total] = await qb.getManyAndCount();
    return { data: tasks, total };
  }
}
