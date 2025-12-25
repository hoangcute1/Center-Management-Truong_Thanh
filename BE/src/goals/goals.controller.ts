import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('goals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student)
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: UserDocument) {
    return this.goalsService.listForUser(user);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Teacher, UserRole.Student)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.goalsService.update(id, dto, user);
  }
}
