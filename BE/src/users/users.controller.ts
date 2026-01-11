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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Teacher)
  findAll(
    @CurrentUser() currentUser: User,
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('subject') subject?: string,
  ) {
    // Nếu không phải Admin, chỉ lấy users của chi nhánh mình
    let effectiveBranchId = branchId;
    if (currentUser.role !== UserRole.Admin) {
      effectiveBranchId = (currentUser as any).branchId;
    }
    return this.usersService.findAll({
      role,
      status,
      branchId: effectiveBranchId,
      subject,
    });
  }

  // Lấy danh sách môn học có sẵn
  @Get('subjects/list')
  @Roles(UserRole.Admin, UserRole.Teacher)
  getSubjects() {
    return this.usersService.getAvailableSubjects();
  }

  // Thống kê giáo viên theo môn học
  @Get('teachers/stats-by-subject')
  @Roles(UserRole.Admin)
  getTeacherStatsBySubject() {
    return this.usersService.getTeacherStatsBySubject();
  }

  // Lấy giáo viên theo môn học
  @Get('teachers/by-subject/:subject')
  @Roles(UserRole.Admin)
  findTeachersBySubject(@Param('subject') subject: string) {
    return this.usersService.findTeachersBySubject(subject);
  }

  // Lấy thông tin con của phụ huynh
  @Get('parent/:parentId/children')
  @Roles(UserRole.Admin)
  getParentChildren(@Param('parentId') parentId: string) {
    return this.usersService.getParentChildren(parentId);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
