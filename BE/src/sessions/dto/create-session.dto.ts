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
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  room?: string;

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
