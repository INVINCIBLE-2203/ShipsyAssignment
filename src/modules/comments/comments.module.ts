import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from '../../database/entities/comment.entity';
import { Task } from '../../database/entities/task.entity';
import { Mention } from '../../database/entities/mention.entity';
import { User } from '../../database/entities/user.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Task, Mention, User, OrganizationMember])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
