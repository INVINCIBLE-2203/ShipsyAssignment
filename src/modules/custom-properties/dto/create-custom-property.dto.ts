import { IsString, IsEnum, IsOptional, IsArray, ValidateIf, MaxLength } from 'class-validator';

export enum CustomPropertyType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    SELECT = 'select',
    MULTI_SELECT = 'multi_select',
    USER = 'user',
}

export class CreateCustomPropertyDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsEnum(CustomPropertyType)
  type: CustomPropertyType;

  @IsEnum(['task', 'project'])
  entityType: 'task' | 'project';

  @IsArray()
  @IsString({ each: true })
  @ValidateIf(o => o.type === CustomPropertyType.SELECT || o.type === CustomPropertyType.MULTI_SELECT)
  @IsOptional()
  options?: string[];
}
