import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
