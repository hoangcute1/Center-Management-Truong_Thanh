import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TuitionService } from './tuition.service';
import { TuitionController } from './tuition.controller';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TuitionController],
  providers: [TuitionService],
})
export class TuitionModule {}
