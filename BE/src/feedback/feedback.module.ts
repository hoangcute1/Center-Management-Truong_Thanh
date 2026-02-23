import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import {
  EvaluationPeriod,
  EvaluationPeriodSchema,
} from './schemas/evaluation-period.schema';
import { ClassEntity, ClassSchema } from '../classes/schemas/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: EvaluationPeriod.name, schema: EvaluationPeriodSchema },
      { name: ClassEntity.name, schema: ClassSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
