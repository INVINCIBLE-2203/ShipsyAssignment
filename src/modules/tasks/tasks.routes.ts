import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AppDataSource } from '../../config/database.config';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const tasksRouter = Router();

// Manually instantiate service and controller
const taskRepository = AppDataSource.getRepository(Task);
const projectRepository = AppDataSource.getRepository(Project);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const tasksService = new TasksService(taskRepository, projectRepository, organizationMemberRepository);
const tasksController = new TasksController(tasksService);

// Routes
tasksRouter.post(
  '/projects/:projectId/tasks',
  jwtAuthGuard,
  validationMiddleware(CreateTaskDto),
  (req, res, next) => tasksController.create(req.params.projectId, req, res, next)
);

tasksRouter.get(
  '/projects/:projectId/tasks',
  jwtAuthGuard,
  (req, res, next) => tasksController.findAll(req.params.projectId, req, res, next)
);

tasksRouter.get('/search', jwtAuthGuard, (req, res, next) => tasksController.search(req, res, next));

tasksRouter.get('/:id', jwtAuthGuard, (req, res, next) => tasksController.findOne(req.params.id, req, res, next));

tasksRouter.put(
  '/:id',
  jwtAuthGuard,
  validationMiddleware(UpdateTaskDto),
  (req, res, next) => tasksController.update(req.params.id, req, res, next)
);

tasksRouter.delete('/:id', jwtAuthGuard, (req, res, next) => tasksController.remove(req.params.id, req, res, next));

tasksRouter.post('/:id/assign', jwtAuthGuard, (req, res, next) => tasksController.assign(req.params.id, req, res, next));

tasksRouter.put('/:id/status', jwtAuthGuard, (req, res, next) => tasksController.updateStatus(req.params.id, req, res, next));

export { tasksRouter };