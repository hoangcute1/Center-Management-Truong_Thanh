import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { IncidentType, IncidentPlatform } from '../schemas/incident.schema';

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  @IsNotEmpty()
  type: IncidentType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(IncidentPlatform)
  @IsOptional()
  platform?: IncidentPlatform;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
