import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { Grade, GradeSchema } from './schemas/grade.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grade.name, schema: GradeSchema },
      { name: Submission.name, schema: SubmissionSchema }, // Để update submission
      { name: Assignment.name, schema: AssignmentSchema }, // Để lấy maxScore
    ]),
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService], // Export cho leaderboard sau này
})
export class GradesModule {}
