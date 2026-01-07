import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IncidentStatus } from '../schemas/incident.schema';

export class UpdateIncidentDto {
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsString()
  @IsOptional()
  adminNote?: string;
}
