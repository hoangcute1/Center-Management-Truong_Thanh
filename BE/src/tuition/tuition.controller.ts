import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TuitionService } from './tuition.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('tuition')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TuitionController {
  constructor(private readonly tuitionService: TuitionService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateInvoiceDto) {
    return this.tuitionService.create(dto);
  }

  @Get()
  list(@CurrentUser() user: UserDocument) {
    return this.tuitionService.listForUser(user);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.tuitionService.update(id, dto);
  }
}
