import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from './dto/evaluation-period.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ==================== FEEDBACK ENDPOINTS ====================

  @Post()
  @Roles(UserRole.Student, UserRole.Admin)
  @ApiOperation({ summary: 'Tạo đánh giá giáo viên' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(user, dto);
  }

  @Get('pending')
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Lấy danh sách giáo viên cần đánh giá' })
  getPendingEvaluations(@CurrentUser() user: UserDocument) {
    return this.feedbackService.getPendingEvaluations(user);
  }

  @Get('my-ratings')
  @Roles(UserRole.Teacher)
  @ApiOperation({ summary: 'Giáo viên xem điểm đánh giá của mình (ẩn danh)' })
  getMyRatings(@CurrentUser() user: UserDocument) {
    return this.feedbackService.getMyRatings(user._id.toString());
  }

  @Get('statistics')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Thống kê đánh giá tổng hợp' })
  getStatistics(
    @Query('periodId') periodId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.feedbackService.getStatistics({ periodId, branchId });
  }

  @Get('statistics/by-class')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Thống kê đánh giá theo lớp' })
  getStatisticsByClass(
    @Query('periodId') periodId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.feedbackService.getStatisticsByClass({ periodId, branchId });
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Admin: Xem tất cả đánh giá (bao gồm tên học sinh)',
  })
  list(
    @Query('teacherId') teacherId?: string,
    @Query('periodId') periodId?: string,
    @Query('branchId') branchId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.feedbackService.listAll({
      teacherId,
      periodId,
      branchId,
      classId,
    });
  }

  // ==================== EVALUATION PERIOD ENDPOINTS ====================

  @Post('periods')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Tạo đợt đánh giá' })
  createPeriod(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateEvaluationPeriodDto,
  ) {
    return this.feedbackService.createEvaluationPeriod(user, dto);
  }

  @Get('periods')
  @Roles(UserRole.Admin, UserRole.Student)
  @ApiOperation({ summary: 'Lấy danh sách đợt đánh giá' })
  listPeriods(@Query('branchId') branchId?: string) {
    return this.feedbackService.listEvaluationPeriods(branchId);
  }

  @Get('periods/active')
  @Roles(UserRole.Student, UserRole.Admin)
  @ApiOperation({ summary: 'Lấy đợt đánh giá đang active' })
  getActivePeriods() {
    return this.feedbackService.getActiveEvaluationPeriods();
  }

  @Get('periods/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Xem chi tiết đợt đánh giá' })
  getPeriod(@Param('id') id: string) {
    return this.feedbackService.getEvaluationPeriod(id);
  }

  @Patch('periods/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Cập nhật đợt đánh giá' })
  updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationPeriodDto,
  ) {
    return this.feedbackService.updateEvaluationPeriod(id, dto);
  }

  @Delete('periods/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin: Xóa đợt đánh giá' })
  deletePeriod(@Param('id') id: string) {
    return this.feedbackService.deleteEvaluationPeriod(id);
  }
}
