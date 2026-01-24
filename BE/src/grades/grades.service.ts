import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Grade, GradeDocument } from './schemas/grade.schema';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { Submission, SubmissionDocument } from '../submissions/schemas/submission.schema';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';

@Injectable()
export class GradesService {
  constructor(
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<GradeDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
  ) {}

  /**
   * Chấm bài - Tạo grade record + update submission
   */
  async gradeAssignment(teacher: UserDocument, dto: GradeAssignmentDto) {
    // 1. Lấy submission
    const submission = await this.submissionModel
      .findById(dto.submissionId)
      .populate('assignmentId')
      .exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const assignment = submission.assignmentId as any;

    // 2. Validate score không vượt quá maxScore
    if (dto.score > assignment.maxScore) {
      throw new BadRequestException(
        `Score cannot exceed maxScore (${assignment.maxScore})`,
      );
    }

    // 3. Check xem đã chấm chưa
    const existingGrade = await this.gradeModel
      .findOne({
        studentId: submission.studentId,
        assignmentId: assignment._id,
      })
      .exec();

    if (existingGrade) {
      throw new BadRequestException('This assignment has already been graded');
    }

    // 4. Tạo Grade record
    const grade = new this.gradeModel({
      studentId: submission.studentId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      assignmentId: assignment._id,
      score: dto.score,
      maxScore: assignment.maxScore,
      type: 'assignment',
      gradedBy: teacher._id,
      gradedAt: new Date(),
      feedback: dto.feedback,
    });

    await grade.save();

    // 5. Update submission: đánh dấu đã chấm
    submission.graded = true;
    submission.grade = dto.score;
    submission.maxScore = assignment.maxScore;
    await submission.save();

    // 6. Populate và trả về
    return this.gradeModel
      .findById(grade._id)
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title type')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('gradedBy', 'name email')
      .exec();
  }

  /**
   * Lấy danh sách điểm theo assignment
   */
  async findByAssignment(assignmentId: string) {
    return this.gradeModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .populate('studentId', 'name email')
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 })
      .exec();
  }

  /**
   * Lấy danh sách điểm theo học sinh
   */
  async findByStudent(studentId: string) {
    return this.gradeModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('assignmentId', 'title type dueDate')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 })
      .exec();
  }

  /**
   * Thống kê điểm của học sinh (cho leaderboard sau này)
   */
  async getStudentStats(studentId: string) {
    const grades = await this.gradeModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .exec();

    if (grades.length === 0) {
      return {
        totalGrades: 0,
        averageScore: 0,
        totalPoints: 0,
        maxPossiblePoints: 0,
      };
    }

    const totalPoints = grades.reduce((sum, g) => sum + g.score, 0);
    const maxPossiblePoints = grades.reduce((sum, g) => sum + g.maxScore, 0);
    const averageScore = Math.round((totalPoints / maxPossiblePoints) * 100);

    return {
      totalGrades: grades.length,
      averageScore,
      totalPoints,
      maxPossiblePoints,
    };
  }
}
