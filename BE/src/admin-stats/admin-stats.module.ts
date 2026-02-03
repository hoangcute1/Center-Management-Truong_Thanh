import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ClassEntity, ClassSchema } from '../classes/schemas/class.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Attendance, AttendanceSchema } from '../attendance/schemas/attendance.schema';
import { Grade, GradeSchema } from '../grades/schemas/grade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ClassEntity.name, schema: ClassSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Grade.name, schema: GradeSchema },
    ]),
  ],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
  exports: [AdminStatsService],
})
export class AdminStatsModule {}
