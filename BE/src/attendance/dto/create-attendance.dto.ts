import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Late = 'late',
  Excused = 'excused',
}

export class CreateAttendanceDto {
  @IsString()
  sessionId: string;

  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
