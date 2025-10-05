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

/**
 * @swagger
 * /api/projects/organizations/{orgId}/projects:
 *   post:
 *     tags: [projects]
 *     summary: Create a new project
 *     description: Create a new project within a specific organization
 *     operationId: createProject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectDto'
 *           example:
 *             name: Website Redesign
 *             description: Complete redesign of the company website with modern UI/UX
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Website Redesign
 *               description: Complete redesign of the company website with modern UI/UX
 *               organization_id: 550e8400-e29b-41d4-a716-446655440000
 *               created_by: 987fcdeb-51a2-43d1-9876-543210987654
 *               created_at: 2024-01-15T10:30:00Z
 *               taskCount: 0
 *               completionRate: 0
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.post('/organizations/:orgId/projects', jwtAuthGuard, validationMiddleware(CreateProjectDto), (req, res, next) => projectsController.create(req, res, next));

/**
 * @swagger
 * /api/projects/organizations/{orgId}/projects:
 *   get:
 *     tags: [projects]
 *     summary: Get organization projects
 *     description: Retrieve all projects for a specific organization with pagination
 *     operationId: getOrganizationProjects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name and description
 *         example: website
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, created_at, updated_at]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectResponse'
 *                 total:
 *                   type: integer
 *                   description: Total number of projects
 *             example:
 *               data:
 *                 - id: 123e4567-e89b-12d3-a456-426614174000
 *                   name: Website Redesign
 *                   description: Complete redesign of the company website
 *                   taskCount: 15
 *                   completionRate: 60.5
 *                 - id: 987fcdeb-51a2-43d1-9876-543210987654
 *                   name: Mobile App Development
 *                   description: Native iOS and Android applications
 *                   taskCount: 25
 *                   completionRate: 24.0
 *               total: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.get('/organizations/:orgId/projects', jwtAuthGuard, (req, res, next) => projectsController.findAll(req, res, next));

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [projects]
 *     summary: Get project by ID
 *     description: Retrieve detailed information about a specific project
 *     operationId: getProjectById
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ProjectResponse'
 *                 - type: object
 *                   properties:
 *                     recentTasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [todo, in_progress, review, done, archived]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                       description: Recent tasks in this project
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Website Redesign
 *               description: Complete redesign of the company website
 *               organization_id: 550e8400-e29b-41d4-a716-446655440000
 *               created_by: 987fcdeb-51a2-43d1-9876-543210987654
 *               created_at: 2024-01-15T10:30:00Z
 *               taskCount: 15
 *               completionRate: 60.5
 *               recentTasks:
 *                 - id: 111e1111-e11b-11d1-a111-111111111111
 *                   title: Design homepage mockup
 *                   status: done
 *                   created_at: 2024-01-20T14:30:00Z
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.get('/:id', jwtAuthGuard, (req, res, next) => projectsController.findOne(req, res, next));

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags: [projects]
 *     summary: Update project
 *     description: Update an existing project's details
 *     operationId: updateProject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Updated project name
 *                 example: Website Redesign v2.0
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Updated project description
 *                 example: Complete redesign with improved performance and accessibility
 *           example:
 *             name: Website Redesign v2.0
 *             description: Complete redesign with improved performance and accessibility
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateProjectDto), (req, res, next) => projectsController.update(req, res, next));

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [projects]
 *     summary: Delete project
 *     description: Delete an existing project permanently. This will also delete all associated tasks.
 *     operationId: deleteProject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       204:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => projectsController.remove(req, res, next));

/**
 * @swagger
 * /api/projects/{id}/stats:
 *   get:
 *     tags: [projects]
 *     summary: Get project statistics
 *     description: Retrieve detailed statistics and metrics for a specific project
 *     operationId: getProjectStats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projectId:
 *                   type: string
 *                   format: uuid
 *                   description: Project ID
 *                 totalTasks:
 *                   type: integer
 *                   description: Total number of tasks
 *                 completedTasks:
 *                   type: integer
 *                   description: Number of completed tasks
 *                 completionRate:
 *                   type: number
 *                   format: float
 *                   description: Completion percentage
 *                 tasksByStatus:
 *                   type: object
 *                   properties:
 *                     todo:
 *                       type: integer
 *                     in_progress:
 *                       type: integer
 *                     review:
 *                       type: integer
 *                     done:
 *                       type: integer
 *                     archived:
 *                       type: integer
 *                   description: Task count by status
 *                 tasksByPriority:
 *                   type: object
 *                   properties:
 *                     low:
 *                       type: integer
 *                     medium:
 *                       type: integer
 *                     high:
 *                       type: integer
 *                     urgent:
 *                       type: integer
 *                   description: Task count by priority
 *                 averageTaskDuration:
 *                   type: number
 *                   format: float
 *                   description: Average time to complete tasks (in days)
 *                 overdueTasks:
 *                   type: integer
 *                   description: Number of overdue tasks
 *                 activeMembers:
 *                   type: integer
 *                   description: Number of active team members
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       tasksCompleted:
 *                         type: integer
 *                   description: Tasks completed in the last 7 days
 *             example:
 *               projectId: 123e4567-e89b-12d3-a456-426614174000
 *               totalTasks: 25
 *               completedTasks: 15
 *               completionRate: 60.0
 *               tasksByStatus:
 *                 todo: 3
 *                 in_progress: 5
 *                 review: 2
 *                 done: 15
 *                 archived: 0
 *               tasksByPriority:
 *                 low: 8
 *                 medium: 12
 *                 high: 4
 *                 urgent: 1
 *               averageTaskDuration: 3.5
 *               overdueTasks: 2
 *               activeMembers: 6
 *               recentActivity:
 *                 - date: "2024-01-20"
 *                   tasksCompleted: 3
 *                 - date: "2024-01-19"
 *                   tasksCompleted: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
projectsRouter.get('/:id/stats', jwtAuthGuard, (req, res, next) => projectsController.getStats(req, res, next));

export { projectsRouter };
