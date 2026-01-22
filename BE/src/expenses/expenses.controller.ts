import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, GetExpensesQueryDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('admin/finance/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateExpenseDto) {
    const expense = await this.expensesService.create(dto, req.user._id);
    return {
      success: true,
      expense,
    };
  }

  @Get()
  async findByBranch(@Query() query: GetExpensesQueryDto) {
    return this.expensesService.findByBranch(query);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.expensesService.delete(id, req.user._id);
    return {
      success: true,
      message: 'Đã xóa chi phí',
    };
  }
}
