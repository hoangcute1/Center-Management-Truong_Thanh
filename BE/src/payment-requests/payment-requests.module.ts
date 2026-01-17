import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import {
  ClassPaymentRequest,
  ClassPaymentRequestSchema,
} from './schemas/class-payment-request.schema';
import {
  StudentPaymentRequest,
  StudentPaymentRequestSchema,
} from './schemas/student-payment-request.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ClassEntity, ClassSchema } from '../classes/schemas/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassPaymentRequest.name, schema: ClassPaymentRequestSchema },
      { name: StudentPaymentRequest.name, schema: StudentPaymentRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: ClassEntity.name, schema: ClassSchema },
    ]),
  ],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
  exports: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
