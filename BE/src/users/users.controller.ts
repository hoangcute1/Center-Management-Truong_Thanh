import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './schemas/user.schema';
import type { UserDocument } from './schemas/user.schema';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
  @Roles(UserRole.Admin, UserRole.Parent)
  getParentChildren(
    @Param('parentId') parentId: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    // Parent chỉ có thể xem con của chính mình
    if (
      currentUser.role === UserRole.Parent &&
      currentUser._id.toString() !== parentId
    ) {
      return { children: [] };
    }
    return this.usersService.getParentChildren(parentId);
  }

  // Cho phép parent tìm child bằng email
  @Get('child-by-email')
  @Roles(UserRole.Admin, UserRole.Parent)
  findChildByEmail(
    @Query('email') email: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.findChildByEmail(email, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student, UserRole.Parent)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    // Admin và Teacher có thể xem bất kỳ ai
    if (
      currentUser.role === UserRole.Admin ||
      currentUser.role === UserRole.Teacher
    ) {
      return this.usersService.findById(id);
    }

    // Student và Parent chỉ có thể xem chính mình
    if (currentUser._id.toString() === id) {
      return this.usersService.findById(id);
    }

    throw new ForbiddenException('You can only view your own profile');
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
