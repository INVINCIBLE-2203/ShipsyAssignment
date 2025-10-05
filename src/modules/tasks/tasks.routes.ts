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

/**
 * @swagger
 * /api/tasks/projects/{projectId}/tasks:
 *   post:
 *     tags: [tasks]
 *     summary: Create a new task
 *     description: Create a new task within a specific project
 *     operationId: createTask
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskDto'
 *           example:
 *             title: Implement user authentication
 *             description: Add JWT-based authentication to the API
 *             priority: high
 *             dueDate: 2024-12-31T23:59:59Z
 *             assigneeId: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
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
tasksRouter.post(
  '/projects/:projectId/tasks',
  jwtAuthGuard,
  validationMiddleware(CreateTaskDto),
  (req, res, next) => tasksController.create(req.params.projectId, req, res, next)
);

/**
 * @swagger
 * /api/tasks/projects/{projectId}/tasks:
 *   get:
 *     tags: [tasks]
 *     summary: Get project tasks
 *     description: Retrieve all tasks for a specific project with filtering and pagination
 *     operationId: getProjectTasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
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
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [todo, in_progress, review, done, archived]
 *         style: form
 *         explode: true
 *         description: Filter by task status (multiple values allowed)
 *         example: [todo, in_progress]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [low, medium, high, urgent]
 *         style: form
 *         explode: true
 *         description: Filter by task priority (multiple values allowed)
 *         example: [high, urgent]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         style: form
 *         explode: true
 *         description: Filter by assignee user IDs (multiple values allowed)
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks due after this date
 *         example: 2024-01-01T00:00:00Z
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks due before this date
 *         example: 2024-12-31T23:59:59Z
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in task title and description
 *         example: authentication
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, due_date, priority, title, status]
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
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskResponse'
 *                 total:
 *                   type: integer
 *                   description: Total number of tasks
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
tasksRouter.get(
  '/projects/:projectId/tasks',
  jwtAuthGuard,
  (req, res, next) => tasksController.findAll(req.params.projectId, req, res, next)
);

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     tags: [tasks]
 *     summary: Search tasks across all accessible projects
 *     description: Search for tasks across all projects the user has access to
 *     operationId: searchTasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
 *         example: authentication
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [todo, in_progress, review, done, archived]
 *                       project:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                 total:
 *                   type: integer
 *       400:
 *         description: Invalid search parameters
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
 */
tasksRouter.get('/search', jwtAuthGuard, (req, res, next) => tasksController.search(req, res, next));

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [tasks]
 *     summary: Get task by ID
 *     description: Retrieve detailed information about a specific task
 *     operationId: getTaskById
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/TaskResponse'
 *                 - type: object
 *                   properties:
 *                     commentCount:
 *                       type: integer
 *                       description: Number of comments on this task
 *                     customPropertyValues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           value:
 *                             type: object
 *                           customProperty:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               property_name:
 *                                 type: string
 *                               property_type:
 *                                 type: string
 *                                 enum: [text, number, date, datetime, select, multi_select, user]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
tasksRouter.get('/:id', jwtAuthGuard, (req, res, next) => tasksController.findOne(req.params.id, req, res, next));

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags: [tasks]
 *     summary: Update task
 *     description: Update an existing task
 *     operationId: updateTask
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskDto'
 *           example:
 *             title: Updated task title
 *             description: Updated task description
 *             status: in_progress
 *             priority: high
 *             dueDate: 2024-12-31T23:59:59Z
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
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
 *         description: Access denied to task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
tasksRouter.put(
  '/:id',
  jwtAuthGuard,
  validationMiddleware(UpdateTaskDto),
  (req, res, next) => tasksController.update(req.params.id, req, res, next)
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [tasks]
 *     summary: Delete task
 *     description: Delete an existing task
 *     operationId: deleteTask
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
tasksRouter.delete('/:id', jwtAuthGuard, (req, res, next) => tasksController.remove(req.params.id, req, res, next));

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     tags: [tasks]
 *     summary: Assign task to user
 *     description: Assign or reassign a task to a specific user
 *     operationId: assignTask
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to assign the task to
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *             required:
 *               - assigneeId
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Invalid assignee or assignee not in organization
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
 *         description: Access denied to task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
tasksRouter.post('/:id/assign', jwtAuthGuard, (req, res, next) => tasksController.assign(req.params.id, req, res, next));

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     tags: [tasks]
 *     summary: Update task status
 *     description: Update the status of a specific task
 *     operationId: updateTaskStatus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done, archived]
 *                 description: New task status
 *                 example: done
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Invalid status value
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
 *         description: Access denied to task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
tasksRouter.put('/:id/status', jwtAuthGuard, (req, res, next) => tasksController.updateStatus(req.params.id, req, res, next));

export { tasksRouter };
