import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    PaymentRequestsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, VnpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
