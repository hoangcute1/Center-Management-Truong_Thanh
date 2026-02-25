import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Grade, GradeDocument, GradeType } from './schemas/grade.schema';
import {
  GradingSheet,
  GradingSheetDocument,
} from './schemas/grading-sheet.schema';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { CreateManualGradeDto } from './dto/create-manual-grade.dto';
import { CreateGradingSheetDto } from './dto/create-grading-sheet.dto';
import { BulkGradeDto } from './dto/bulk-grade.dto';
import {
  LeaderboardQueryDto,
  ScoreLeaderboardItem,
  AttendanceLeaderboardItem,
  LeaderboardResponse,
} from './dto/leaderboard.dto';
import { UserDocument, User } from '../users/schemas/user.schema';
import {
  Submission,
  SubmissionDocument,
} from '../submissions/schemas/submission.schema';
import {
  Assignment,
  AssignmentDocument,
} from '../assignments/schemas/assignment.schema';
import { ClassEntity, ClassDocument } from '../classes/schemas/class.schema';
import {
  Attendance,
  AttendanceDocument,
} from '../attendance/schemas/attendance.schema';

@Injectable()
export class GradesService {
  constructor(
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<GradeDocument>,
    @InjectModel(GradingSheet.name)
    private readonly gradingSheetModel: Model<GradingSheetDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(ClassEntity.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
  ) {}

  // ==================== GRADING SHEET METHODS ====================

  /**
   * Tạo bài chấm điểm mới
   */
  async createGradingSheet(teacher: UserDocument, dto: CreateGradingSheetDto) {
    // Kiểm tra lớp có tồn tại và teacher có quyền không
    const classDoc = await this.classModel.findById(dto.classId).exec();
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Kiểm tra teacher có được assign cho lớp này không
    if (classDoc.teacherId?.toString() !== teacher._id.toString()) {
      throw new BadRequestException('You are not assigned to this class');
    }

    const gradingSheet = new this.gradingSheetModel({
      title: dto.title,
      description: dto.description,
      classId: new Types.ObjectId(dto.classId),
      category: dto.category,
      maxScore: dto.maxScore,
      createdBy: teacher._id,
    });

    await gradingSheet.save();

    return this.gradingSheetModel
      .findById(gradingSheet._id)
      .populate('classId', 'name')
      .populate('createdBy', 'name email')
      .exec();
  }

  /**
   * Lấy danh sách bài chấm điểm của teacher
   */
  async getTeacherGradingSheets(teacherId: string) {
    return this.gradingSheetModel
      .find({ createdBy: new Types.ObjectId(teacherId) })
      .populate('classId', 'name studentIds')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết bài chấm điểm + danh sách học sinh với điểm
   */
  async getGradingSheetWithStudents(gradingSheetId: string) {
    const gradingSheet = await this.gradingSheetModel
      .findById(gradingSheetId)
      .populate('classId', 'name')
      .populate('createdBy', 'name email')
      .exec();

    if (!gradingSheet) {
      throw new NotFoundException('Grading sheet not found');
    }

    // Lấy danh sách học sinh của lớp
    const classDoc = await this.classModel
      .findById(gradingSheet.classId)
      .populate('studentIds', 'name email studentCode')
      .exec();

    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Lấy điểm đã chấm cho grading sheet này
    const grades = await this.gradeModel
      .find({ gradingSheetId: new Types.ObjectId(gradingSheetId) })
      .exec();

    // Map điểm vào từng học sinh
    const students = (classDoc.studentIds || []).map((student: any) => {
      const grade = grades.find(
        (g) => g.studentId.toString() === student._id.toString(),
      );
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentCode: student.studentCode,
        score: grade?.score ?? null,
        feedback: grade?.feedback ?? null,
        graded: !!grade,
        gradedAt: grade?.gradedAt ?? null,
      };
    });

    return {
      gradingSheet,
      students,
      summary: {
        total: students.length,
        graded: grades.length,
        pending: students.length - grades.length,
      },
    };
  }

  /**
   * Chấm điểm hàng loạt cho nhiều học sinh
   */
  async bulkGradeStudents(
    teacher: UserDocument,
    gradingSheetId: string,
    dto: BulkGradeDto,
  ) {
    const gradingSheet = await this.gradingSheetModel
      .findById(gradingSheetId)
      .exec();
    if (!gradingSheet) {
      throw new NotFoundException('Grading sheet not found');
    }

    // Validate teacher có quyền chấm không
    if (gradingSheet.createdBy.toString() !== teacher._id.toString()) {
      throw new BadRequestException(
        'You do not have permission to grade this sheet',
      );
    }

    const results: any[] = [];

    for (const gradeDto of dto.grades) {
      // Validate score
      if (gradeDto.score > gradingSheet.maxScore) {
        throw new BadRequestException(
          `Score for student ${gradeDto.studentId} exceeds maxScore (${gradingSheet.maxScore})`,
        );
      }

      // Check xem đã có grade chưa
      const existingGrade = await this.gradeModel
        .findOne({
          studentId: new Types.ObjectId(gradeDto.studentId),
          gradingSheetId: new Types.ObjectId(gradingSheetId),
        })
        .exec();

      if (existingGrade) {
        // Update existing grade
        existingGrade.score = gradeDto.score;
        existingGrade.feedback = gradeDto.feedback;
        existingGrade.gradedAt = new Date();
        await existingGrade.save();
        results.push(existingGrade);
      } else {
        // Create new grade
        const grade = new this.gradeModel({
          studentId: new Types.ObjectId(gradeDto.studentId),
          classId: gradingSheet.classId,
          gradingSheetId: new Types.ObjectId(gradingSheetId),
          score: gradeDto.score,
          maxScore: gradingSheet.maxScore,
          type: GradeType.Manual,
          category: gradingSheet.category,
          gradedBy: teacher._id,
          gradedAt: new Date(),
          feedback: gradeDto.feedback,
        });
        await grade.save();
        results.push(grade);
      }
    }

    return {
      success: true,
      count: results.length,
      message: `Successfully graded ${results.length} students`,
    };
  }

  // ==================== OLD METHODS ====================

  /**
   * Nhập điểm tay - Không cần assignment/submission
   */
  async createManualGrade(teacher: UserDocument, dto: CreateManualGradeDto) {
    if (dto.score > dto.maxScore) {
      throw new BadRequestException(
        `Score (${dto.score}) cannot exceed maxScore (${dto.maxScore})`,
      );
    }

    const grade = new this.gradeModel({
      studentId: new Types.ObjectId(dto.studentId),
      classId: new Types.ObjectId(dto.classId),
      subjectId: dto.subjectId ? new Types.ObjectId(dto.subjectId) : undefined,
      assignmentId: undefined,
      score: dto.score,
      maxScore: dto.maxScore,
      type: GradeType.Manual,
      category: dto.category,
      gradedBy: teacher._id,
      gradedAt: new Date(),
      feedback: dto.feedback,
    });

    await grade.save();

    return this.gradeModel
      .findById(grade._id)
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('gradedBy', 'name email')
      .exec();
  }

  /**
   * Chấm bài - Tạo grade record + update submission
   */
  async gradeAssignment(teacher: UserDocument, dto: GradeAssignmentDto) {
    const submission = await this.submissionModel
      .findById(dto.submissionId)
      .populate('assignmentId')
      .exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const assignment = submission.assignmentId as any;

    if (dto.score > assignment.maxScore) {
      throw new BadRequestException(
        `Score cannot exceed maxScore (${assignment.maxScore})`,
      );
    }

    const existingGrade = await this.gradeModel
      .findOne({
        studentId: submission.studentId,
        assignmentId: assignment._id,
      })
      .exec();

    if (existingGrade) {
      throw new BadRequestException('This assignment has already been graded');
    }

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

    submission.graded = true;
    submission.grade = dto.score;
    submission.maxScore = assignment.maxScore;
    await submission.save();

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
      .populate('gradingSheetId', 'title category')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 })
      .exec();
  }

  /**
   * Lấy điểm của học sinh trong một lớp cụ thể
   */
  async findByStudentInClass(studentId: string, classId: string) {
    return this.gradeModel
      .find({
        studentId: new Types.ObjectId(studentId),
        classId: new Types.ObjectId(classId),
      })
      .populate('gradingSheetId', 'title category')
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 })
      .exec();
  }

  /**
   * Thống kê điểm của học sinh
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

  /**
   * Xếp hạng học sinh trong lớp dựa trên điểm trung bình
   */
  async getClassRanking(classId: string) {
    // Lấy danh sách học sinh của lớp
    const classDoc = await this.classModel
      .findById(classId)
      .populate('studentIds', 'name email studentCode avatar')
      .exec();

    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    const students = classDoc.studentIds as any[];
    if (!students || students.length === 0) {
      return [];
    }

    // Tính điểm trung bình cho mỗi học sinh
    const studentRankings = await Promise.all(
      students.map(async (student) => {
        const grades = await this.gradeModel
          .find({
            studentId: student._id,
            classId: new Types.ObjectId(classId),
          })
          .exec();

        let averageScore = 0;
        let totalGrades = 0;
        if (grades.length > 0) {
          const totalPoints = grades.reduce((sum, g) => sum + g.score, 0);
          const maxPossiblePoints = grades.reduce(
            (sum, g) => sum + g.maxScore,
            0,
          );
          averageScore =
            maxPossiblePoints > 0
              ? parseFloat(((totalPoints / maxPossiblePoints) * 10).toFixed(2))
              : 0;
          totalGrades = grades.length;
        }

        return {
          studentId: student._id,
          studentName: student.name,
          studentCode: student.studentCode,
          avatar: student.avatar,
          averageScore,
          totalGrades,
        };
      }),
    );

    // Sắp xếp theo điểm trung bình giảm dần
    studentRankings.sort((a, b) => b.averageScore - a.averageScore);

    // Thêm thứ hạng
    return studentRankings.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }

  /**
   * Lấy thứ hạng của một học sinh trong lớp
   */
  async getStudentRankInClass(studentId: string, classId: string) {
    const rankings = await this.getClassRanking(classId);
    const studentRank = rankings.find(
      (r) => r.studentId.toString() === studentId,
    );

    if (!studentRank) {
      return {
        rank: null,
        totalStudents: rankings.length,
        averageScore: 0,
        totalGrades: 0,
      };
    }

    return {
      rank: studentRank.rank,
      totalStudents: rankings.length,
      averageScore: studentRank.averageScore,
      totalGrades: studentRank.totalGrades,
    };
  }

  // ==================== LEADERBOARD METHODS ====================

  /**
   * Lấy bảng xếp hạng tổng hợp (Top điểm + Chuyên cần)
   * - Top điểm: Tính trung bình điểm từ các bài kiểm tra giáo viên tạo và chấm
   * - Chuyên cần: Tính tỉ lệ có mặt từ lúc tạo tài khoản đến hiện tại
   */
  async getLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponse> {
    const limit = query.limit || 10;

    // Lấy danh sách học sinh (có thể filter theo branch/class)
    const studentFilter: any = { role: 'student', status: 'active' };

    if (query.branchId) {
      studentFilter.branchId = query.branchId;
    }

    let studentIds: Types.ObjectId[] | null = null;

    if (query.classId) {
      // Nếu filter theo class, lấy học sinh của class đó
      const classDoc = await this.classModel.findById(query.classId).exec();
      if (classDoc && classDoc.studentIds) {
        studentIds = classDoc.studentIds.map(
          (id) => new Types.ObjectId(id.toString()),
        );
      }
    }

    // Query students
    const students = studentIds
      ? await this.userModel
          .find({
            _id: { $in: studentIds },
            status: 'active',
          })
          .exec()
      : await this.userModel.find(studentFilter).exec();

    if (students.length === 0) {
      return {
        score: [],
        attendance: [],
        summary: {
          totalStudents: 0,
          averageScore: 0,
          averageAttendanceRate: 0,
        },
      };
    }

    // ===== TOP ĐIỂM =====
    const scoreRankings: ScoreLeaderboardItem[] = [];
    let totalAvgScore = 0;
    let studentsWithGrades = 0;

    for (const student of students) {
      const grades = await this.gradeModel
        .find({
          studentId: student._id,
        })
        .populate('classId', 'name')
        .exec();

      let averageScore = 0;
      let totalGrades = 0;
      let className: string | undefined = undefined;

      if (grades.length > 0) {
        const totalPoints = grades.reduce((sum, g) => sum + g.score, 0);
        const maxPossiblePoints = grades.reduce(
          (sum, g) => sum + g.maxScore,
          0,
        );
        averageScore =
          maxPossiblePoints > 0
            ? parseFloat(((totalPoints / maxPossiblePoints) * 10).toFixed(2))
            : 0;
        totalGrades = grades.length;

        // Lấy tên lớp đầu tiên (hoặc có thể lấy nhiều lớp)
        const classNames = [
          ...new Set(
            grades.map((g) => (g.classId as any)?.name).filter(Boolean),
          ),
        ];
        className = classNames.join(', ') || undefined;

        totalAvgScore += averageScore;
        studentsWithGrades++;
      }

      // Include ALL students (those without grades get 0)
      scoreRankings.push({
        rank: 0, // sẽ được assign sau khi sort
        studentId: student._id.toString(),
        studentName: student.name,
        studentCode: student.studentCode,
        avatarUrl: student.avatarUrl,
        averageScore,
        totalGrades,
        className,
      });
    }

    // Sort và assign rank cho score
    scoreRankings.sort((a, b) => b.averageScore - a.averageScore);
    scoreRankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    // ===== CHUYÊN CẦN =====
    const attendanceRankings: AttendanceLeaderboardItem[] = [];
    let totalAttendanceRate = 0;
    let studentsWithAttendance = 0;

    for (const student of students) {
      const attendanceRecords = await this.attendanceModel
        .find({
          studentId: student._id,
        })
        .exec();

      const presentCount = attendanceRecords.filter(
        (r) => r.status === 'present',
      ).length;
      const totalSessions = attendanceRecords.length;
      const attendanceRate =
        totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 0;

      // Tính số ngày từ lúc tạo tài khoản đến hiện tại
      const createdAt = (student as any).createdAt || new Date();
      const now = new Date();
      const daysEnrolled = Math.floor(
        (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      attendanceRankings.push({
        rank: 0,
        studentId: student._id.toString(),
        studentName: student.name,
        studentCode: student.studentCode,
        avatarUrl: student.avatarUrl,
        attendanceRate,
        presentCount,
        totalSessions,
        daysEnrolled: Math.max(daysEnrolled, 0),
      });

      if (totalSessions > 0) {
        totalAttendanceRate += attendanceRate;
        studentsWithAttendance++;
      }
    }

    // Sort và assign rank cho attendance (theo rate, rồi theo số ngày enrolled)
    attendanceRankings.sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      return b.daysEnrolled - a.daysEnrolled;
    });
    attendanceRankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      score: scoreRankings.slice(0, limit),
      attendance: attendanceRankings.slice(0, limit),
      summary: {
        totalStudents: students.length,
        averageScore:
          studentsWithGrades > 0
            ? parseFloat((totalAvgScore / studentsWithGrades).toFixed(2))
            : 0,
        averageAttendanceRate:
          studentsWithAttendance > 0
            ? Math.round(totalAttendanceRate / studentsWithAttendance)
            : 0,
      },
    };
  }

  /**
   * Lấy bảng xếp hạng cho lớp của giáo viên
   */
  async getTeacherLeaderboard(
    teacherId: string,
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponse> {
    // Lấy danh sách lớp mà giáo viên đang dạy
    const classes = await this.classModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
      })
      .exec();

    if (classes.length === 0) {
      return {
        score: [],
        attendance: [],
        summary: {
          totalStudents: 0,
          averageScore: 0,
          averageAttendanceRate: 0,
        },
      };
    }

    // Lấy tất cả học sinh từ các lớp
    const allStudentIds: Types.ObjectId[] = [];
    for (const cls of classes) {
      if (cls.studentIds) {
        allStudentIds.push(
          ...cls.studentIds.map((id) => new Types.ObjectId(id.toString())),
        );
      }
    }

    // Remove duplicates
    const uniqueStudentIds = [
      ...new Set(allStudentIds.map((id) => id.toString())),
    ].map((id) => new Types.ObjectId(id));

    // Nếu có filter theo classId, chỉ lấy học sinh của class đó
    let finalStudentIds = uniqueStudentIds;
    if (query.classId) {
      const targetClass = classes.find(
        (c) => c._id.toString() === query.classId,
      );
      if (targetClass && targetClass.studentIds) {
        finalStudentIds = targetClass.studentIds.map(
          (id) => new Types.ObjectId(id.toString()),
        );
      }
    }

    const students = await this.userModel
      .find({
        _id: { $in: finalStudentIds },
        status: 'active',
      })
      .exec();

    const limit = query.limit || 10;

    // ===== TOP ĐIỂM (chỉ tính điểm từ các lớp của giáo viên) =====
    const classIds = query.classId
      ? [new Types.ObjectId(query.classId)]
      : classes.map((c) => c._id);

    const scoreRankings: ScoreLeaderboardItem[] = [];
    let totalAvgScore = 0;
    let studentsWithGrades = 0;

    for (const student of students) {
      const grades = await this.gradeModel
        .find({
          studentId: student._id,
          classId: { $in: classIds },
        })
        .populate('classId', 'name')
        .exec();

      let averageScore = 0;
      let totalGrades = 0;
      let className: string | undefined = undefined;

      if (grades.length > 0) {
        const totalPoints = grades.reduce((sum, g) => sum + g.score, 0);
        const maxPossiblePoints = grades.reduce(
          (sum, g) => sum + g.maxScore,
          0,
        );
        averageScore =
          maxPossiblePoints > 0
            ? parseFloat(((totalPoints / maxPossiblePoints) * 10).toFixed(2))
            : 0;
        totalGrades = grades.length;

        const classNames = [
          ...new Set(
            grades.map((g) => (g.classId as any)?.name).filter(Boolean),
          ),
        ];
        className = classNames.join(', ') || undefined;

        totalAvgScore += averageScore;
        studentsWithGrades++;
      }

      // Include ALL students (those without grades get 0)
      scoreRankings.push({
        rank: 0,
        studentId: student._id.toString(),
        studentName: student.name,
        studentCode: student.studentCode,
        avatarUrl: student.avatarUrl,
        averageScore,
        totalGrades,
        className,
      });
    }

    scoreRankings.sort((a, b) => b.averageScore - a.averageScore);
    scoreRankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    // ===== CHUYÊN CẦN =====
    const attendanceRankings: AttendanceLeaderboardItem[] = [];
    let totalAttendanceRate = 0;
    let studentsWithAttendance = 0;

    for (const student of students) {
      const attendanceRecords = await this.attendanceModel
        .find({
          studentId: student._id,
        })
        .exec();

      const presentCount = attendanceRecords.filter(
        (r) => r.status === 'present',
      ).length;
      const totalSessions = attendanceRecords.length;
      const attendanceRate =
        totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 0;

      const createdAt = (student as any).createdAt || new Date();
      const now = new Date();
      const daysEnrolled = Math.floor(
        (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      attendanceRankings.push({
        rank: 0,
        studentId: student._id.toString(),
        studentName: student.name,
        studentCode: student.studentCode,
        avatarUrl: student.avatarUrl,
        attendanceRate,
        presentCount,
        totalSessions,
        daysEnrolled: Math.max(daysEnrolled, 0),
      });

      if (totalSessions > 0) {
        totalAttendanceRate += attendanceRate;
        studentsWithAttendance++;
      }
    }

    attendanceRankings.sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      return b.daysEnrolled - a.daysEnrolled;
    });
    attendanceRankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      score: scoreRankings.slice(0, limit),
      attendance: attendanceRankings.slice(0, limit),
      summary: {
        totalStudents: students.length,
        averageScore:
          studentsWithGrades > 0
            ? parseFloat((totalAvgScore / studentsWithGrades).toFixed(2))
            : 0,
        averageAttendanceRate:
          studentsWithAttendance > 0
            ? Math.round(totalAttendanceRate / studentsWithAttendance)
            : 0,
      },
    };
  }

  /**
   * Lấy thứ hạng của học sinh hiện tại trong cơ sở của họ
   */
  async getStudentOverallRank(
    studentId: string,
    branchId?: string,
  ): Promise<{
    scoreRank: number | null;
    attendanceRank: number | null;
    totalStudents: number;
  }> {
    const query: LeaderboardQueryDto = { limit: 9999 };
    if (branchId) {
      query.branchId = branchId;
    }
    const leaderboard = await this.getLeaderboard(query);

    const scoreItem = leaderboard.score.find(
      (item) => item.studentId === studentId,
    );
    const attendanceItem = leaderboard.attendance.find(
      (item) => item.studentId === studentId,
    );

    return {
      scoreRank: scoreItem?.rank || null,
      attendanceRank: attendanceItem?.rank || null,
      totalStudents: leaderboard.summary.totalStudents,
    };
  }
}
