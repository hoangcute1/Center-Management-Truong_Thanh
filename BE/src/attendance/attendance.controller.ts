import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { TimetableAttendanceDto } from './dto/timetable-attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher)
  mark(@CurrentUser() user: UserDocument, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.mark(user, dto);
  }

  // New endpoint for timetable-based attendance
  @Post('timetable')
  @Roles(UserRole.Admin, UserRole.Teacher)
  markFromTimetable(
    @CurrentUser() user: UserDocument,
    @Body() dto: TimetableAttendanceDto,
  ) {
    return this.attendanceService.markFromTimetable(user, dto);
  }

  @Get()
  list(
    @Query('sessionId') sessionId?: string,
    @Query('studentId') studentId?: string,
  ) {
    if (sessionId) return this.attendanceService.listBySession(sessionId);
    if (studentId) return this.attendanceService.listByStudent(studentId);
    return [];
  }

  @Get('statistics')
  getStatistics(@Query('studentId') studentId: string) {
    return this.attendanceService.getStatistics(studentId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
