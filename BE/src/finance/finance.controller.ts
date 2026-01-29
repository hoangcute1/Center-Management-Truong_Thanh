import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  @Get('dashboard')
  async getDashboard(
    @Query('branchId', new DefaultValuePipe('ALL')) branchId: string,
    @Query(
      'year',
      new DefaultValuePipe(new Date().getFullYear()),
      ParseIntPipe,
    )
    year: number,
  ) {
    return this.financeService.getDashboard(branchId, year);
  }
}
