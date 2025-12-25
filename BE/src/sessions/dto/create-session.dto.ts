import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SessionStatus {
  Pending = 'pending',
  Approved = 'approved',
  Cancelled = 'cancelled',
}

export enum SessionType {
  Regular = 'regular',
  Makeup = 'makeup',
  Exam = 'exam',
}

export class CreateSessionDto {
  @IsString()
  classId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @IsOptional()
  @IsString()
  note?: string;
}
