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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher)
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user, dto);
  }

  @Get()
  find(@Query('classId') classId?: string) {
    if (classId) return this.sessionsService.findByClass(classId);
    return this.sessionsService.findAll();
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.sessionsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}
