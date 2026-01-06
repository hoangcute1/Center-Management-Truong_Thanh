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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    return this.classesService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  // Thêm 1 học sinh vào lớp
  @Post(':id/students')
  @Roles(UserRole.Admin)
  addStudent(
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ) {
    return this.classesService.addStudentToClass(id, studentId);
  }

  // Xóa 1 học sinh khỏi lớp
  @Delete(':id/students/:studentId')
  @Roles(UserRole.Admin)
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.removeStudentFromClass(id, studentId);
  }

  // Thêm nhiều học sinh vào lớp (hỗ trợ import nhanh)
  @Post(':id/students/bulk')
  @Roles(UserRole.Admin)
  addStudents(
    @Param('id') id: string,
    @Body('studentIds') studentIds: string[],
  ) {
    return this.classesService.addStudentsToClass(id, studentIds);
  }
}
