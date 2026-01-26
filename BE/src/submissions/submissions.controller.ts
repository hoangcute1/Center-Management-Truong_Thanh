import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Submissions')
@ApiBearerAuth()
@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Học sinh nộp bài' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(user, dto);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Xem danh sách nộp bài theo assignment (Giáo viên)' })
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.submissionsService.findByAssignment(assignmentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Lịch sử nộp bài của học sinh' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.submissionsService.findByStudent(studentId);
  }

  @Get('student/:studentId/stats')
  @ApiOperation({ summary: 'Thống kê nộp bài của học sinh (cho leaderboard)' })
  getStudentStats(@Param('studentId') studentId: string) {
    return this.submissionsService.getStudentStats(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết submission' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }
}
