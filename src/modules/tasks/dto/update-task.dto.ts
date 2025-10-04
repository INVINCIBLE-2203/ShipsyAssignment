import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MinLength, MaxLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../database/entities/task.entity';

export class UpdateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}