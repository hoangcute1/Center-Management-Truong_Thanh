import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { Grade, GradeSchema } from './schemas/grade.schema';
import { GradingSheet, GradingSheetSchema } from './schemas/grading-sheet.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { ClassEntity, ClassSchema } from '../classes/schemas/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grade.name, schema: GradeSchema },
      { name: GradingSheet.name, schema: GradingSheetSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: ClassEntity.name, schema: ClassSchema },
    ]),
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule { }

