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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { IncidentStatus } from './schemas/incident.schema';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  // Tạo báo cáo sự cố (tất cả user đều có thể)
  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student, UserRole.Parent)
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: UserDocument) {
    return this.incidentsService.create(dto, user);
  }

  // Lấy danh sách sự cố của user hiện tại
  @Get('my-incidents')
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student, UserRole.Parent)
  findMyIncidents(@CurrentUser() user: UserDocument) {
    return this.incidentsService.findByUser(user._id.toString());
  }

  // Lấy tất cả sự cố (chỉ Admin)
  @Get()
  @Roles(UserRole.Admin)
  findAll(
    @Query('status') status?: IncidentStatus,
    @Query('type') type?: string,
    @Query('reporterId') reporterId?: string,
  ) {
    return this.incidentsService.findAll({ status, type, reporterId });
  }

  // Lấy thống kê sự cố (chỉ Admin)
  @Get('statistics')
  @Roles(UserRole.Admin)
  getStatistics() {
    return this.incidentsService.getStatistics();
  }

  // Lấy chi tiết sự cố
  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student, UserRole.Parent)
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  // Cập nhật sự cố (chỉ Admin)
  @Patch(':id')
  @Roles(UserRole.Admin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.incidentsService.update(id, dto, user._id.toString());
  }

  // Xóa sự cố (chỉ Admin)
  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
