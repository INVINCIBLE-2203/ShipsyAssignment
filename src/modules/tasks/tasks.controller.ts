import { NextFunction, Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../database/entities/task.entity';

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  async create(projectId: string, req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.tasksService.createTask(projectId, (req.user as any)?.id, req.body as CreateTaskDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(projectId: string, req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, sortBy, sortOrder, ...filters } = req.query;
      const result = await this.tasksService.getProjectTasks(
        projectId,
        (req.user as any)?.id,
        filters as any,
        { page: +page, limit: +limit },
        { sortBy: sortBy as string, sortOrder: sortOrder as any },
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      const result = await this.tasksService.searchTasks((req.user as any)?.id, q as string, { page: +page, limit: +limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findOne(id: string, req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.tasksService.getTaskById(id, (req.user as any)?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(id: string, req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.tasksService.updateTask(id, (req.user as any)?.id, req.body as UpdateTaskDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async remove(id: string, req: Request, res: Response, next: NextFunction) {
    try {
      await this.tasksService.deleteTask(id, (req.user as any)?.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async assign(id: string, req: Request, res: Response, next: NextFunction) {
    try {
      const { assigneeId } = req.body;
      const result = await this.tasksService.assignTask(id, (req.user as any)?.id, assigneeId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(id: string, req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const result = await this.tasksService.updateTaskStatus(id, (req.user as any)?.id, status as TaskStatus);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
