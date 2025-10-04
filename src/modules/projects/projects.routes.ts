import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AppDataSource } from '../../config/database.config';
import { Project } from '../../database/entities/project.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { Task } from '../../database/entities/task.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const projectsRouter = Router();

const projectRepository = AppDataSource.getRepository(Project);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const taskRepository = AppDataSource.getRepository(Task);
const projectsService = new ProjectsService(projectRepository, organizationMemberRepository, taskRepository);
const projectsController = new ProjectsController(projectsService);

projectsRouter.post('/organizations/:orgId/projects', jwtAuthGuard, validationMiddleware(CreateProjectDto), (req, res, next) => projectsController.create(req, res, next));
projectsRouter.get('/organizations/:orgId/projects', jwtAuthGuard, (req, res, next) => projectsController.findAll(req, res, next));
projectsRouter.get('/:id', jwtAuthGuard, (req, res, next) => projectsController.findOne(req, res, next));
projectsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateProjectDto), (req, res, next) => projectsController.update(req, res, next));
projectsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => projectsController.remove(req, res, next));
projectsRouter.get('/:id/stats', jwtAuthGuard, (req, res, next) => projectsController.getStats(req, res, next));

export { projectsRouter };
