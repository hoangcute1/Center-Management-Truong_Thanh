import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';

export class ImportUsersDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  classId?: string;
}

// Row data từ Excel/CSV cho Student
export interface StudentRowData {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  parentEmail?: string;
}

// Row data từ Excel/CSV cho Teacher
export interface TeacherRowData {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  subject?: string;
}

// Row data từ Excel/CSV cho Parent
export interface ParentRowData {
  name: string;
  email: string;
  phone?: string;
  childrenEmails?: string; // comma-separated
}

export type ImportRowData = StudentRowData | TeacherRowData | ParentRowData;

export interface ImportResult {
  success: boolean;
  row: number;
  email?: string;
  name?: string;
  error?: string;
  tempPassword?: string;
}

export interface ImportResponse {
  total: number;
  successful: number;
  failed: number;
  results: ImportResult[];
  classId?: string; // ID lớp học đã thêm học sinh vào
}
