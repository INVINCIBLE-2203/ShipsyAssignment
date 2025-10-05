
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Task } from '../../database/entities/task.entity';
import { Mention } from '../../database/entities/mention.entity';
import { User } from '../../database/entities/user.entity';
import { OrganizationMember, MemberRole } from '../../database/entities/organization-member.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AppError } from '../../common/AppError';
import { PaginationParams } from '../../utils/pagination.util';
import { MentionParserUtil } from '../../utils/mention-parser.util';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Mention)
    private mentionRepository: Repository<Mention>,
    @InjectRepository(OrganizationMember)
    private organizationMemberRepository: Repository<OrganizationMember>,
    private dataSource: DataSource,
  ) {}

  async createComment(taskId: string, userId: string, dto: CreateCommentDto): Promise<Comment> {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] });
    if (!task) {
      throw new AppError(404, 'Task not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have access to this task.');
    }

    const parsedMentions = MentionParserUtil.parse(dto.content);

    return this.dataSource.transaction(async manager => {
      const comment = manager.create(Comment, {
        task_id: taskId,
        user_id: userId,
        content: dto.content,
      });
      await manager.save(comment);

      if (parsedMentions.length > 0) {
        const usernames = parsedMentions.map(m => m.username);
        const users = await manager.getRepository(User).createQueryBuilder('user')
            .where('user.username IN (:...usernames)', { usernames })
            .getMany();
        
        const mentions = users.map(user => manager.create(Mention, {
            comment_id: comment.id,
            mentioned_user_id: user.id,
        }));
        await manager.save(mentions);
      }

      return comment;
    });
  }

  async getTaskComments(taskId: string, userId: string, pagination: PaginationParams) {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] });
    if (!task) {
      throw new AppError(404, 'Task not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: task.project.organization_id, user_id: userId } });
    if (!member) {
      throw new AppError(403, 'You do not have access to this task.');
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { task_id: taskId },
      relations: ['user', 'mentions', 'mentions.mentionedUser'],
      order: { created_at: 'DESC' },
      take: pagination.limit || 10,
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
    });

    return { data: comments, total };
  }

  async updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new AppError(404, 'Comment not found.');
    }

    if (comment.user_id !== userId) {
      throw new AppError(403, 'You do not have permission to update this comment.');
    }

    const parsedMentions = MentionParserUtil.parse(content);

    return this.dataSource.transaction(async manager => {
        comment.content = content;
        await manager.save(comment);

        await manager.delete(Mention, { comment_id: commentId });

        if (parsedMentions.length > 0) {
            const usernames = parsedMentions.map(m => m.username);
            const users = await manager.getRepository(User).createQueryBuilder('user')
                .where('user.username IN (:...usernames)', { usernames })
                .getMany();
            
            const mentions = users.map(user => manager.create(Mention, {
                comment_id: comment.id,
                mentioned_user_id: user.id,
            }));
            await manager.save(mentions);
        }

        return comment;
    });
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['task', 'task.project'] });
    if (!comment) {
      throw new AppError(404, 'Comment not found.');
    }

    const member = await this.organizationMemberRepository.findOne({ where: { organization_id: comment.task.project.organization_id, user_id: userId } });
    if (comment.user_id !== userId && (!member || ![MemberRole.ADMIN, MemberRole.OWNER].includes(member.role))) {
      throw new AppError(403, 'You do not have permission to delete this comment.');
    }

    await this.commentRepository.delete(commentId);
  }

  async getUserMentions(userId: string, pagination: PaginationParams) {
    const [mentions, total] = await this.mentionRepository.findAndCount({
        where: { mentioned_user_id: userId },
        relations: ['comment', 'comment.task', 'comment.task.project'],
        order: { created_at: 'DESC' },
        take: pagination.limit || 10,
        skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
    });

    return { data: mentions, total };
  }
}
