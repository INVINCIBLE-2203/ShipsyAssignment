import { IsString, IsOptional, IsArray, ValidateIf, MaxLength } from 'class-validator';

export class UpdateCustomPropertyDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}
