import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { OrderStatus } from './schemas/order.schema';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.Student, UserRole.Parent, UserRole.Admin)
  async create(@Request() req, @Body() dto: CreateOrderDto) {
    const studentId = req.user._id;
    return this.ordersService.create(studentId, dto);
  }

  @Get('me')
  @Roles(UserRole.Student, UserRole.Parent)
  async findMyOrders(
    @Request() req,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findByStudent(req.user._id, status);
  }

  @Get()
  @Roles(UserRole.Admin)
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.ordersService.findAll({
      status,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Delete(':id')
  @Roles(UserRole.Student, UserRole.Admin)
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.ordersService.cancel(id, reason);
  }
}
