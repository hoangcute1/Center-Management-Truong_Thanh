import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
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

  @Get('student/:studentId/stats')
  @ApiOperation({ summary: 'Thống kê điểm của học sinh (cho leaderboard)' })
  getStudentStats(@Param('studentId') studentId: string) {
    return this.gradesService.getStudentStats(studentId);
  }
}
