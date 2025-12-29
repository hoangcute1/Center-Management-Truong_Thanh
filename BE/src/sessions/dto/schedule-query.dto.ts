import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { SessionStatus, SessionType } from './create-session.dto';

export class ScheduleQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}

export class GenerateSessionsDto {
  @IsString()
  classId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;
}

export class CheckConflictDto {
  @IsString()
  teacherId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  excludeSessionId?: string;
}

export class BulkCreateSessionsDto {
  @IsString()
  classId: string;

  sessions: Array<{
    startTime: string;
    endTime: string;
    type?: SessionType;
    note?: string;
  }>;
}
