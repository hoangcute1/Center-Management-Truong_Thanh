import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import {
  EvaluationPeriod,
  EvaluationPeriodDocument,
} from './schemas/evaluation-period.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from './dto/evaluation-period.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';
import { ClassEntity, ClassDocument } from '../classes/schemas/class.schema';
import { Branch } from '../branches/schemas/branch.schema'; // Assuming Branch schema exists or I will define a helper type

// Helper types for populated fields
interface PopulatedClass extends Omit<ClassDocument, 'teacherId' | 'branchId'> {
  teacherId: UserDocument;
  branchId: Branch & { _id: Types.ObjectId };
}

interface PopulatedPeriod extends Omit<EvaluationPeriodDocument, 'branchId'> {
  branchId: Branch & { _id: Types.ObjectId };
}

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly model: Model<FeedbackDocument>,
    @InjectModel(EvaluationPeriod.name)
    private readonly evaluationPeriodModel: Model<EvaluationPeriodDocument>,
    @InjectModel(ClassEntity.name)
    private readonly classModel: Model<ClassDocument>,
  ) {}

  // ==================== VALIDATION METHODS ====================

  /**
   * Kiểm tra học sinh có thuộc lớp của giáo viên không
   */
  async validateStudentCanEvaluateTeacher(
    studentId: string,
    teacherId: string,
  ): Promise<{ valid: boolean; classes: ClassDocument[] }> {
    const classes = await this.classModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
        studentIds: { $in: [new Types.ObjectId(studentId)] },
        status: 'active',
      })
      .exec();
    return { valid: classes.length > 0, classes };
  }

  /**
   * Kiểm tra đợt đánh giá còn hiệu lực
   */
  async isEvaluationPeriodActive(periodId: string): Promise<boolean> {
    const period = await this.evaluationPeriodModel.findById(periodId);
    if (!period) return false;
    const now = new Date();
    return (
      period.status === 'active' &&
      now >= period.startDate &&
      now <= period.endDate
    );
  }

  /**
   * Kiểm tra học sinh đã đánh giá chưa (trong đợt đánh giá hoặc class)
   */
  async hasStudentEvaluated(
    studentId: string,
    teacherId: string,
    evaluationPeriodId?: string,
    classId?: string,
  ): Promise<boolean> {
    const query: any = {
      studentId: new Types.ObjectId(studentId),
      teacherId: new Types.ObjectId(teacherId),
      status: 'submitted',
    };
    if (evaluationPeriodId) {
      query.evaluationPeriodId = new Types.ObjectId(evaluationPeriodId);
    }
    if (classId) {
      query.classId = new Types.ObjectId(classId);
    }
    const existing = await this.model.findOne(query);
    return !!existing;
  }

  // ==================== FEEDBACK METHODS ====================

  async create(user: UserDocument, dto: CreateFeedbackDto) {
    // Validate: học sinh chỉ có thể đánh giá giáo viên của lớp mình
    if (user.role === UserRole.Student) {
      const { valid, classes } = await this.validateStudentCanEvaluateTeacher(
        user._id.toString(),
        dto.teacherId,
      );
      if (!valid) {
        throw new ForbiddenException(
          'Bạn chỉ có thể đánh giá giáo viên của lớp mình đang học',
        );
      }

      // Nếu có evaluationPeriodId, kiểm tra đợt đánh giá còn hiệu lực
      if (dto.evaluationPeriodId) {
        const isActive = await this.isEvaluationPeriodActive(
          dto.evaluationPeriodId,
        );
        if (!isActive) {
          throw new BadRequestException(
            'Đợt đánh giá đã kết thúc hoặc chưa mở',
          );
        }
      }

      // Kiểm tra đã đánh giá chưa
      const hasEvaluated = await this.hasStudentEvaluated(
        user._id.toString(),
        dto.teacherId,
        dto.evaluationPeriodId,
        dto.classId,
      );
      if (hasEvaluated) {
        throw new BadRequestException('Bạn đã đánh giá giáo viên này rồi');
      }

      // Auto-assign classId nếu không có
      if (!dto.classId && classes.length === 1) {
        dto.classId = classes[0]._id.toString();
      }
    }

    const doc = new this.model({
      ...dto,
      teacherId: new Types.ObjectId(dto.teacherId),
      studentId: user._id,
      classId: dto.classId ? new Types.ObjectId(dto.classId) : undefined,
      evaluationPeriodId: dto.evaluationPeriodId
        ? new Types.ObjectId(dto.evaluationPeriodId)
        : undefined,
      anonymous: dto.anonymous ?? true,
      status: dto.status || 'submitted',
      submittedAt: dto.status === 'submitted' ? new Date() : undefined,
    });
    return doc.save();
  }

  /**
   * Lấy danh sách giáo viên mà học sinh cần đánh giá
   */
  async getPendingEvaluations(user: UserDocument) {
    // Lấy tất cả lớp mà học sinh đang học
    const studentClasses = (await this.classModel
      .find({
        studentIds: { $in: [new Types.ObjectId(user._id)] },
        status: 'active',
      })
      .populate('teacherId', 'name email avatar')
      .populate('branchId', 'name')
      .exec()) as unknown as PopulatedClass[];

    if (studentClasses.length === 0) {
      return { activePeriods: [], pendingEvaluations: [] };
    }

    // Lấy các đợt đánh giá đang active cho các lớp/branch của học sinh
    const now = new Date();
    const classIds = studentClasses.map((c) => c._id);
    const branchIds = [
      ...new Set(
        studentClasses
          .map((c) => {
            const br = c.branchId;
            return br?._id?.toString();
          })
          .filter((id): id is string => !!id && Types.ObjectId.isValid(id)),
      ),
    ];

    // Build query conditions
    const orConditions: any[] = [{ classIds: { $in: classIds } }];
    if (branchIds.length > 0) {
      orConditions.push({
        branchId: {
          $in: branchIds.map((id) => new Types.ObjectId(id)),
        },
      });
    }
    // Also include periods with no branchId (applies to all branches)
    orConditions.push({ branchId: { $exists: false } });
    orConditions.push({ branchId: null });

    const activePeriods = (await this.evaluationPeriodModel
      .find({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: orConditions,
      })
      .populate('branchId', 'name')
      .exec()) as unknown as PopulatedPeriod[];

    // Lấy các feedback đã submit (theo từng đợt đánh giá)
    const result: {
      period: EvaluationPeriodDocument;
      evaluations: {
        classId: any;
        className: string;
        teacher: any;
        evaluated: boolean;
      }[];
    }[] = [];

    for (const period of activePeriods) {
      // Lọc lớp thuộc đợt đánh giá
      const periodClasses = studentClasses.filter((c) => {
        // Nếu đợt đánh giá có chỉ định classIds cụ thể
        if (period.classIds && period.classIds.length > 0) {
          return period.classIds.some(
            (pid) => pid.toString() === c._id.toString(),
          );
        }
        // Nếu đợt không có branchId (null/undefined) = tất cả cơ sở
        if (!period.branchId) {
          return true; // Cho phép tất cả lớp
        }
        // So sánh branchId
        const classBranchId = c.branchId?._id?.toString();
        const periodBranchId = period.branchId?._id?.toString();
        return classBranchId === periodBranchId;
      });

      // Kiểm tra đã đánh giá chưa trong đợt này
      const submittedFeedbacks = await this.model
        .find({
          studentId: user._id,
          evaluationPeriodId: period._id,
          status: 'submitted',
        })
        .exec();

      const submittedMap = new Map(
        submittedFeedbacks.map((f) => [`${f.teacherId}-${f.classId}`, true]),
      );

      const evaluations = periodClasses
        .filter((c) => c.teacherId)
        .map((c) => ({
          classId: c._id,
          className: c.name,
          teacher: c.teacherId,
          evaluated: submittedMap.has(`${c.teacherId._id}-${c._id}`),
        }));

      result.push({
        period: period as any, // Cast back to satisfy result type or adjust result type
        evaluations,
      });
    }

    return {
      activePeriods: result.map((r) => ({
        _id: r.period._id,
        name: r.period.name,
        description: r.period.description,
        startDate: r.period.startDate,
        endDate: r.period.endDate,
        branchName: (r.period.branchId as any)?.name,
      })),
      pendingEvaluations: result.flatMap((r) =>
        r.evaluations
          .filter((e) => !e.evaluated)
          .map((e) => ({
            ...e,
            periodId: r.period._id,
            periodName: r.period.name,
          })),
      ),
    };
  }

  /**
   * Lấy điểm đánh giá của giáo viên (ẩn danh - không có thông tin học sinh)
   */
  async getMyRatings(teacherId: string) {
    const feedbacks = await this.model
      .find({
        teacherId: new Types.ObjectId(teacherId),
        status: 'submitted',
      })
      .populate('classId', 'name')
      .populate('evaluationPeriodId', 'name')
      .select('-studentId') // Ẩn studentId
      .sort({ createdAt: -1 })
      .exec();

    // Tính điểm trung bình theo từng tiêu chí
    const stats = this.calculateAverageRatings(feedbacks);

    return {
      feedbacks: feedbacks.map((f) => ({
        _id: f._id,
        rating: f.rating,
        criteria: f.criteria,
        comment: f.comment,
        className: (f.classId as any)?.name,
        periodName: (f.evaluationPeriodId as any)?.name,
        createdAt: (f as any).createdAt,
      })),
      stats,
      totalFeedbacks: feedbacks.length,
    };
  }

  /**
   * Tính điểm trung bình
   */
  private calculateAverageRatings(feedbacks: FeedbackDocument[]) {
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        averageCriteria: null as {
          teachingQuality: number;
          communication: number;
          punctuality: number;
          materialPreparation: number;
          studentInteraction: number;
        } | null,
      };
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRating / feedbacks.length;

    // Tính trung bình theo tiêu chí
    const feedbacksWithCriteria = feedbacks.filter((f) => f.criteria);
    let averageCriteria: {
      teachingQuality: number;
      communication: number;
      punctuality: number;
      materialPreparation: number;
      studentInteraction: number;
    } | null = null;

    if (feedbacksWithCriteria.length > 0) {
      const count = feedbacksWithCriteria.length;
      averageCriteria = {
        teachingQuality:
          feedbacksWithCriteria.reduce(
            (sum, f) => sum + (f.criteria?.teachingQuality || 0),
            0,
          ) / count,
        communication:
          feedbacksWithCriteria.reduce(
            (sum, f) => sum + (f.criteria?.communication || 0),
            0,
          ) / count,
        punctuality:
          feedbacksWithCriteria.reduce(
            (sum, f) => sum + (f.criteria?.punctuality || 0),
            0,
          ) / count,
        materialPreparation:
          feedbacksWithCriteria.reduce(
            (sum, f) => sum + (f.criteria?.materialPreparation || 0),
            0,
          ) / count,
        studentInteraction:
          feedbacksWithCriteria.reduce(
            (sum, f) => sum + (f.criteria?.studentInteraction || 0),
            0,
          ) / count,
      };
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      averageCriteria,
    };
  }

  /**
   * Admin: Xem chi tiết feedback (bao gồm tên học sinh)
   */
  async listAll(filters?: {
    teacherId?: string;
    periodId?: string;
    branchId?: string;
    classId?: string;
  }) {
    const query: any = {};
    if (filters?.teacherId) {
      query.teacherId = new Types.ObjectId(filters.teacherId);
    }
    if (filters?.periodId) {
      query.evaluationPeriodId = new Types.ObjectId(filters.periodId);
    }
    if (filters?.classId) {
      query.classId = new Types.ObjectId(filters.classId);
    }

    // Nếu filter theo branch, lấy tất cả class của branch đó
    if (filters?.branchId && !filters?.classId) {
      const classesInBranch = await this.classModel
        .find({ branchId: new Types.ObjectId(filters.branchId) })
        .select('_id')
        .exec();
      query.classId = { $in: classesInBranch.map((c) => c._id) };
    }

    return this.model
      .find(query)
      .populate('teacherId', 'name email avatar')
      .populate('studentId', 'name email avatar')
      .populate('classId', 'name branchId')
      .populate('evaluationPeriodId', 'name branchId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Admin: Thống kê tổng hợp theo branch
   */
  async getStatistics(filters?: { periodId?: string; branchId?: string }) {
    const matchStage: any = { status: 'submitted' };
    if (filters?.periodId) {
      matchStage.evaluationPeriodId = new Types.ObjectId(filters.periodId);
    }

    // Nếu filter theo branch, lấy tất cả class của branch đó
    if (filters?.branchId) {
      const classesInBranch = await this.classModel
        .find({ branchId: new Types.ObjectId(filters.branchId) })
        .select('_id')
        .exec();
      matchStage.classId = { $in: classesInBranch.map((c) => c._id) };
    }

    const stats = await this.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$teacherId',
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
          avgTeachingQuality: { $avg: '$criteria.teachingQuality' },
          avgCommunication: { $avg: '$criteria.communication' },
          avgPunctuality: { $avg: '$criteria.punctuality' },
          avgMaterialPreparation: { $avg: '$criteria.materialPreparation' },
          avgStudentInteraction: { $avg: '$criteria.studentInteraction' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: '$teacher' },
      {
        $project: {
          teacherId: '$_id',
          teacherName: '$teacher.name',
          teacherEmail: '$teacher.email',
          teacherAvatar: '$teacher.avatar',
          averageRating: { $round: ['$averageRating', 1] },
          totalFeedbacks: 1,
          avgTeachingQuality: { $round: ['$avgTeachingQuality', 1] },
          avgCommunication: { $round: ['$avgCommunication', 1] },
          avgPunctuality: { $round: ['$avgPunctuality', 1] },
          avgMaterialPreparation: { $round: ['$avgMaterialPreparation', 1] },
          avgStudentInteraction: { $round: ['$avgStudentInteraction', 1] },
        },
      },
      { $sort: { averageRating: -1 } },
    ]);

    return stats;
  }

  /**
   * Admin: Thống kê chi tiết theo lớp
   */
  async getStatisticsByClass(filters?: {
    periodId?: string;
    branchId?: string;
  }) {
    const classQuery: any = { status: 'active' };
    if (filters?.branchId) {
      classQuery.branchId = new Types.ObjectId(filters.branchId);
    }

    const classes = await this.classModel
      .find(classQuery)
      .populate('teacherId', 'name email avatar')
      .populate('branchId', 'name')
      .exec();

    const feedbackQuery: any = { status: 'submitted' };
    if (filters?.periodId) {
      feedbackQuery.evaluationPeriodId = new Types.ObjectId(filters.periodId);
    }

    const result = await Promise.all(
      classes.map(async (cls) => {
        const classFeedbacks = await this.model
          .find({
            ...feedbackQuery,
            classId: cls._id,
          })
          .populate('studentId', 'name email avatar')
          .exec();

        const totalStudents = cls.studentIds?.length || 0;
        const totalEvaluated = classFeedbacks.length;
        const avgRating =
          totalEvaluated > 0
            ? classFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
              totalEvaluated
            : 0;

        return {
          classId: cls._id,
          className: cls.name,
          branchId: (cls.branchId as any)?._id,
          branchName: (cls.branchId as any)?.name,
          teacherId: (cls.teacherId as any)?._id,
          teacherName: (cls.teacherId as any)?.name,
          teacherAvatar: (cls.teacherId as any)?.avatar,
          totalStudents,
          totalEvaluated,
          evaluationRate:
            totalStudents > 0
              ? Math.round((totalEvaluated / totalStudents) * 100)
              : 0,
          averageRating: Math.round(avgRating * 10) / 10,
          feedbacks: classFeedbacks.map((f) => ({
            _id: f._id,
            rating: f.rating,
            criteria: f.criteria,
            comment: f.comment,
            studentId: (f.studentId as any)?._id,
            studentName: (f.studentId as any)?.name,
            createdAt: (f as any).createdAt,
          })),
        };
      }),
    );

    return result.filter((r) => r.totalStudents > 0);
  }

  listForTeacher(teacherId: string) {
    return this.model.find({ teacherId }).exec();
  }

  // ==================== EVALUATION PERIOD METHODS ====================

  async createEvaluationPeriod(
    user: UserDocument,
    dto: CreateEvaluationPeriodDto,
  ) {
    const doc = new this.evaluationPeriodModel({
      ...dto,
      branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
      classIds: dto.classIds?.map((id) => new Types.ObjectId(id)) || [],
      teacherIds: dto.teacherIds?.map((id) => new Types.ObjectId(id)) || [],
      createdBy: user._id,
    });
    return doc.save();
  }

  async listEvaluationPeriods(branchId?: string) {
    const query: any = {};
    if (branchId) {
      // If filtering by branch, also include periods with no branch (applies to all)
      query.$or = [
        { branchId: new Types.ObjectId(branchId) },
        { branchId: { $exists: false } },
        { branchId: null },
      ];
    }
    return this.evaluationPeriodModel
      .find(query)
      .populate('branchId', 'name')
      .populate('classIds', 'name')
      .populate('teacherIds', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getEvaluationPeriod(id: string) {
    const period = await this.evaluationPeriodModel
      .findById(id)
      .populate('branchId', 'name')
      .populate('classIds', 'name')
      .populate('teacherIds', 'name email')
      .populate('createdBy', 'name')
      .exec();
    if (!period) throw new NotFoundException('Đợt đánh giá không tồn tại');
    return period;
  }

  async updateEvaluationPeriod(id: string, dto: UpdateEvaluationPeriodDto) {
    const data: any = { ...dto };
    // Handle branchId: empty string or undefined means "all branches"
    if (dto.branchId === '' || dto.branchId === undefined) {
      data.branchId = null;
    } else if (dto.branchId) {
      data.branchId = new Types.ObjectId(dto.branchId);
    }
    if (dto.classIds) {
      data.classIds = dto.classIds.map((id) => new Types.ObjectId(id));
    }
    if (dto.teacherIds) {
      data.teacherIds = dto.teacherIds.map((id) => new Types.ObjectId(id));
    }

    const updated = await this.evaluationPeriodModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('branchId', 'name')
      .populate('classIds', 'name')
      .populate('teacherIds', 'name email')
      .populate('createdBy', 'name')
      .exec();

    if (!updated) throw new NotFoundException('Đợt đánh giá không tồn tại');
    return updated;
  }

  async deleteEvaluationPeriod(id: string) {
    // Xóa tất cả feedbacks liên quan đến đợt đánh giá này
    const deletedFeedbacks = await this.model.deleteMany({
      evaluationPeriodId: new Types.ObjectId(id),
    });
    console.log(
      `Deleted ${deletedFeedbacks.deletedCount} feedbacks for period ${id}`,
    );

    const result = await this.evaluationPeriodModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Đợt đánh giá không tồn tại');
    return {
      message: 'Xóa đợt đánh giá thành công',
      deletedFeedbacks: deletedFeedbacks.deletedCount,
    };
  }

  /**
   * Lấy đợt đánh giá đang active
   */
  async getActiveEvaluationPeriods() {
    const now = new Date();
    return this.evaluationPeriodModel
      .find({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }
}
