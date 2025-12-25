import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TuitionService } from './tuition.service';
import { TuitionController } from './tuition.controller';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
  controllers: [TuitionController],
  providers: [TuitionService],
})
export class TuitionModule {}
