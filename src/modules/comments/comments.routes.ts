import { Router } from 'express';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AppDataSource } from '../../config/database.config';
import { Comment } from '../../database/entities/comment.entity';
import { Task } from '../../database/entities/task.entity';
import { Mention } from '../../database/entities/mention.entity';
import { User } from '../../database/entities/user.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const commentsRouter = Router();

const commentRepository = AppDataSource.getRepository(Comment);
const taskRepository = AppDataSource.getRepository(Task);
const mentionRepository = AppDataSource.getRepository(Mention);
const userRepository = AppDataSource.getRepository(User);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const commentsService = new CommentsService(commentRepository, taskRepository, userRepository, mentionRepository, organizationMemberRepository, AppDataSource);
const commentsController = new CommentsController(commentsService);

/**
 * @swagger
 * /api/comments/tasks/{taskId}/comments:
 *   post:
 *     tags: [comments]
 *     summary: Create a comment on a task
 *     description: Add a new comment to a specific task. Supports @mentions of team members.
 *     operationId: createComment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID to comment on
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentDto'
 *           example:
 *             content: "This task looks good to me! @johndoe please review the implementation details."
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/CommentResponse'
 *                 - type: object
 *                   properties:
 *                     mentions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           mentioned_user_id:
 *                             type: string
 *                             format: uuid
 *                           mentionedUser:
 *                             $ref: '#/components/schemas/UserResponse'
 *                       description: Users mentioned in this comment
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               content: "This task looks good to me! @johndoe please review the implementation details."
 *               task_id: 550e8400-e29b-41d4-a716-446655440000
 *               user_id: 987fcdeb-51a2-43d1-9876-543210987654
 *               created_at: 2024-01-15T10:30:00Z
 *               updated_at: 2024-01-15T10:30:00Z
 *               user:
 *                 id: 987fcdeb-51a2-43d1-9876-543210987654
 *                 username: janesmith
 *                 email: jane@example.com
 *               mentions:
 *                 - id: 111e1111-e11b-11d1-a111-111111111111
 *                   mentioned_user_id: 222e2222-e22b-22d2-a222-222222222222
 *                   mentionedUser:
 *                     id: 222e2222-e22b-22d2-a222-222222222222
 *                     username: johndoe
 *                     email: john@example.com
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
commentsRouter.post('/tasks/:taskId/comments', jwtAuthGuard, validationMiddleware(CreateCommentDto), (req, res, next) => commentsController.create(req, res, next));

/**
 * @swagger
 * /api/comments/tasks/{taskId}/comments:
 *   get:
 *     tags: [comments]
 *     summary: Get task comments
 *     description: Retrieve all comments for a specific task with pagination and user information
 *     operationId: getTaskComments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
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
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order by creation date
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/CommentResponse'
 *                       - type: object
 *                         properties:
 *                           mentions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 mentionedUser:
 *                                   $ref: '#/components/schemas/UserResponse'
 *                 total:
 *                   type: integer
 *                   description: Total number of comments
 *             example:
 *               data:
 *                 - id: 123e4567-e89b-12d3-a456-426614174000
 *                   content: "This looks great! Nice work on the implementation."
 *                   task_id: 550e8400-e29b-41d4-a716-446655440000
 *                   user_id: 987fcdeb-51a2-43d1-9876-543210987654
 *                   created_at: 2024-01-15T10:30:00Z
 *                   user:
 *                     id: 987fcdeb-51a2-43d1-9876-543210987654
 *                     username: janesmith
 *                     email: jane@example.com
 *                   mentions: []
 *                 - id: 456e7890-e12b-34d5-a678-901234567890
 *                   content: "I have a question about the approach. @johndoe can you clarify?"
 *                   task_id: 550e8400-e29b-41d4-a716-446655440000
 *                   user_id: 111e1111-e11b-11d1-a111-111111111111
 *                   created_at: 2024-01-15T11:00:00Z
 *                   user:
 *                     id: 111e1111-e11b-11d1-a111-111111111111
 *                     username: bobwilson
 *                     email: bob@example.com
 *                   mentions:
 *                     - mentionedUser:
 *                         id: 222e2222-e22b-22d2-a222-222222222222
 *                         username: johndoe
 *                         email: john@example.com
 *               total: 2
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
commentsRouter.get('/tasks/:taskId/comments', jwtAuthGuard, (req, res, next) => commentsController.findAll(req, res, next));

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     tags: [comments]
 *     summary: Update a comment
 *     description: Update an existing comment. Only the comment author can edit their comments.
 *     operationId: updateComment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Updated comment content
 *                 example: "Updated comment with new information. @johndoe please check this out."
 *             required:
 *               - content
 *           example:
 *             content: "Updated comment with new information. @johndoe please check this out."
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentResponse'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               content: "Updated comment with new information. @johndoe please check this out."
 *               task_id: 550e8400-e29b-41d4-a716-446655440000
 *               user_id: 987fcdeb-51a2-43d1-9876-543210987654
 *               created_at: 2024-01-15T10:30:00Z
 *               updated_at: 2024-01-15T10:45:00Z
 *               user:
 *                 id: 987fcdeb-51a2-43d1-9876-543210987654
 *                 username: janesmith
 *                 email: jane@example.com
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
 *         description: Only comment author can edit the comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
commentsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateCommentDto), (req, res, next) => commentsController.update(req, res, next));

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags: [comments]
 *     summary: Delete a comment
 *     description: Delete an existing comment. Only the comment author can delete their comments.
 *     operationId: deleteComment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Only comment author can delete the comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
commentsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => commentsController.remove(req, res, next));

/**
 * @swagger
 * /api/comments/mentions/me:
 *   get:
 *     tags: [comments]
 *     summary: Get user mentions
 *     description: Retrieve all comments where the authenticated user has been mentioned
 *     operationId: getUserMentions
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter for unread mentions only
 *         example: true
 *     responses:
 *       200:
 *         description: User mentions retrieved successfully
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
 *                         description: Mention ID
 *                       comment_id:
 *                         type: string
 *                         format: uuid
 *                         description: Comment ID where user was mentioned
 *                       mentioned_user_id:
 *                         type: string
 *                         format: uuid
 *                         description: Mentioned user ID (current user)
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: When the mention was created
 *                       comment:
 *                         allOf:
 *                           - $ref: '#/components/schemas/CommentResponse'
 *                           - type: object
 *                             properties:
 *                               task:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     format: uuid
 *                                   title:
 *                                     type: string
 *                                   project:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                         format: uuid
 *                                       name:
 *                                         type: string
 *                                       organization:
 *                                         type: object
 *                                         properties:
 *                                           id:
 *                                             type: string
 *                                             format: uuid
 *                                           name:
 *                                             type: string
 *                 total:
 *                   type: integer
 *                   description: Total number of mentions
 *             example:
 *               data:
 *                 - id: 111e1111-e11b-11d1-a111-111111111111
 *                   comment_id: 123e4567-e89b-12d3-a456-426614174000
 *                   mentioned_user_id: 987fcdeb-51a2-43d1-9876-543210987654
 *                   created_at: 2024-01-15T10:30:00Z
 *                   comment:
 *                     id: 123e4567-e89b-12d3-a456-426614174000
 *                     content: "Hey @janesmith can you review this implementation?"
 *                     task_id: 550e8400-e29b-41d4-a716-446655440000
 *                     user_id: 222e2222-e22b-22d2-a222-222222222222
 *                     created_at: 2024-01-15T10:30:00Z
 *                     user:
 *                       id: 222e2222-e22b-22d2-a222-222222222222
 *                       username: johndoe
 *                       email: john@example.com
 *                     task:
 *                       id: 550e8400-e29b-41d4-a716-446655440000
 *                       title: "Implement user authentication"
 *                       project:
 *                         id: 333e3333-e33b-33d3-a333-333333333333
 *                         name: "Website Redesign"
 *                         organization:
 *                           id: 444e4444-e44b-44d4-a444-444444444444
 *                           name: "Acme Corporation"
 *               total: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
commentsRouter.get('/mentions/me', jwtAuthGuard, (req, res, next) => commentsController.getUserMentions(req, res, next));

export { commentsRouter };
