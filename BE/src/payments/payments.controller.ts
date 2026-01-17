import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  Ip,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ConfirmCashPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==================== CREATE PAYMENT ====================

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Parent)
  async createPayment(
    @Request() req,
    @Body() dto: CreatePaymentDto,
    @Ip() ip: string,
  ) {
    const ipAddr = ip || '127.0.0.1';
    return this.paymentsService.createPayment(
      dto,
      req.user._id,
      req.user.role,
      ipAddr,
    );
  }

  // ==================== VNPAY ====================

  @Get('vnpay-test/return')
  async vnpayReturn(
    @Query() vnpParams: Record<string, any>,
    @Res() res: Response,
  ) {
    const result = await this.paymentsService.handleVnpayReturn(vnpParams);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/payment-result?success=${result.success}&paymentId=${result.paymentId}&message=${encodeURIComponent(result.message)}`;

    return res.redirect(redirectUrl);
  }

  @Post('vnpay-test/ipn')
  async vnpayIpn(@Body() vnpParams: Record<string, any>) {
    return this.paymentsService.handleVnpayIpn(vnpParams);
  }

  @Get('vnpay-test/ipn')
  async vnpayIpnGet(@Query() vnpParams: Record<string, any>) {
    return this.paymentsService.handleVnpayIpn(vnpParams);
  }

  // ==================== CASH ====================

  @Post('cash/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async confirmCashPayment(@Request() req, @Body() dto: ConfirmCashPaymentDto) {
    return this.paymentsService.confirmCashPayment(dto, req.user._id);
  }

  @Get('cash/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getPendingCashPayments() {
    return this.paymentsService.findPendingCashPayments();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  // ==================== COMMON ====================

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Parent)
  async getMyPayments(@Request() req) {
    return this.paymentsService.findByStudent(req.user._id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
