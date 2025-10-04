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

commentsRouter.post('/tasks/:taskId/comments', jwtAuthGuard, validationMiddleware(CreateCommentDto), (req, res, next) => commentsController.create(req, res, next));
commentsRouter.get('/tasks/:taskId/comments', jwtAuthGuard, (req, res, next) => commentsController.findAll(req, res, next));
commentsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateCommentDto), (req, res, next) => commentsController.update(req, res, next));
commentsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => commentsController.remove(req, res, next));
commentsRouter.get('/mentions/me', jwtAuthGuard, (req, res, next) => commentsController.getUserMentions(req, res, next));

export { commentsRouter };
