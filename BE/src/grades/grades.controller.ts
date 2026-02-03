import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { CreateManualGradeDto } from './dto/create-manual-grade.dto';
import { CreateGradingSheetDto } from './dto/create-grading-sheet.dto';
import { BulkGradeDto } from './dto/bulk-grade.dto';
import { LeaderboardQueryDto } from './dto/leaderboard.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ==================== GRADING SHEET ENDPOINTS ====================

  @Post('sheets')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Tạo bài chấm điểm mới' })
  createGradingSheet(
    @CurrentUser() teacher: UserDocument,
    @Body() dto: CreateGradingSheetDto,
  ) {
    return this.gradesService.createGradingSheet(teacher, dto);
  }

  @Get('sheets')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Lấy danh sách bài chấm của teacher' })
  getTeacherGradingSheets(@CurrentUser() teacher: UserDocument) {
    return this.gradesService.getTeacherGradingSheets(teacher._id.toString());
  }

  @Get('sheets/:id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Chi tiết bài chấm + danh sách học sinh' })
  getGradingSheetWithStudents(@Param('id') id: string) {
    return this.gradesService.getGradingSheetWithStudents(id);
  }

  @Post('sheets/:id/grade')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Chấm điểm hàng loạt cho học sinh' })
  bulkGradeStudents(
    @CurrentUser() teacher: UserDocument,
    @Param('id') id: string,
    @Body() dto: BulkGradeDto,
  ) {
    return this.gradesService.bulkGradeStudents(teacher, id, dto);
  }

  // ==================== OLD ENDPOINTS ====================

  @Post('manual')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Nhập điểm tay (không cần assignment)' })
  createManualGrade(
    @CurrentUser() teacher: UserDocument,
    @Body() dto: CreateManualGradeDto,
  ) {
    return this.gradesService.createManualGrade(teacher, dto);
  }

  @Post('assignment')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Chấm bài tập/kiểm tra' })
  gradeAssignment(
    @CurrentUser() teacher: UserDocument,
    @Body() dto: GradeAssignmentDto,
  ) {
    return this.gradesService.gradeAssignment(teacher, dto);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Xem điểm theo assignment' })
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.gradesService.findByAssignment(assignmentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Xem điểm của học sinh' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.gradesService.findByStudent(studentId);
  }

  @Get('student/:studentId/class/:classId')
  @ApiOperation({ summary: 'Xem điểm của học sinh trong một lớp' })
  findByStudentInClass(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
  ) {
    return this.gradesService.findByStudentInClass(studentId, classId);
  }

  @Get('student/:studentId/stats')
  @ApiOperation({ summary: 'Thống kê điểm của học sinh' })
  getStudentStats(@Param('studentId') studentId: string) {
    return this.gradesService.getStudentStats(studentId);
  }

  @Get('class/:classId/ranking')
  @ApiOperation({ summary: 'Xếp hạng học sinh trong lớp theo điểm TB' })
  getClassRanking(@Param('classId') classId: string) {
    return this.gradesService.getClassRanking(classId);
  }

  @Get('student/:studentId/class/:classId/rank')
  @ApiOperation({ summary: 'Lấy thứ hạng của học sinh trong lớp' })
  getStudentRankInClass(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
  ) {
    return this.gradesService.getStudentRankInClass(studentId, classId);
  }

  // ==================== LEADERBOARD ENDPOINTS ====================

  @Get('leaderboard')
  @ApiOperation({ summary: 'Lấy bảng xếp hạng tổng hợp (Top điểm + Chuyên cần)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch ID' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by class ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', example: 10 })
  getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.gradesService.getLeaderboard(query);
  }

  @Get('leaderboard/teacher')
  @Roles(UserRole.Teacher)
  @ApiOperation({ summary: 'Lấy bảng xếp hạng học sinh trong các lớp của giáo viên' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by specific class ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', example: 10 })
  getTeacherLeaderboard(
    @CurrentUser() teacher: UserDocument,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.gradesService.getTeacherLeaderboard(teacher._id.toString(), query);
  }

  @Get('leaderboard/my-rank')
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Lấy thứ hạng của học sinh hiện tại trong toàn trung tâm' })
  getMyOverallRank(@CurrentUser() student: UserDocument) {
    return this.gradesService.getStudentOverallRank(student._id.toString());
  }
}
