import { NextFunction, Request, Response } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const result = await this.commentsService.createComment(taskId, req.user.id, req.body as CreateCommentDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await this.commentsService.getTaskComments(taskId, req.user.id, { page: +page, limit: +limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body as UpdateCommentDto;
      const result = await this.commentsService.updateComment(id, req.user.id, content);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.commentsService.deleteComment(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getUserMentions(req: Request, res: Response, next: NextFunction) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await this.commentsService.getUserMentions(req.user.id, { page: +page, limit: +limit });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
  }
}
