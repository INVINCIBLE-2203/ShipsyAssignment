import { IsString, IsOptional, IsArray, ValidateIf, MaxLength, IsObject } from 'class-validator';

export class UpdateCustomPropertyDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  options?: any;
}
