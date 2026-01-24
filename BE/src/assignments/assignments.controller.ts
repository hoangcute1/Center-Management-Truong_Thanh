import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Giao bài tập/bài kiểm tra cho lớp' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(user, dto);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lấy danh sách bài tập theo lớp' })
  findByClass(@Param('classId') classId: string) {
    return this.assignmentsService.findByClass(classId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài tập' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Cập nhật bài tập' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Xóa bài tập' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
