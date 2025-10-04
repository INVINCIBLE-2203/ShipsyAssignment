import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  comment_id: string;

  @Column('uuid')
  mentioned_user_id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Comment, comment => comment.mentions)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'mentioned_user_id' })
  mentionedUser: User;
}
