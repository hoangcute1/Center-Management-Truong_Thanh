import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Limit number of results', default: 10 })
  @IsOptional()
  limit?: number;
}

export interface ScoreLeaderboardItem {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatarUrl?: string;
  averageScore: number;
  totalGrades: number;
  className?: string;
}

export interface AttendanceLeaderboardItem {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatarUrl?: string;
  attendanceRate: number;
  presentCount: number;
  totalSessions: number;
  daysEnrolled: number; // số ngày từ lúc tạo tài khoản đến hiện tại
}

export interface LeaderboardResponse {
  score: ScoreLeaderboardItem[];
  attendance: AttendanceLeaderboardItem[];
  summary: {
    totalStudents: number;
    averageScore: number;
    averageAttendanceRate: number;
  };
}
