import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
