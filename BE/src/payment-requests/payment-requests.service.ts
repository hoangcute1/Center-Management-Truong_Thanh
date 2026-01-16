import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ClassPaymentRequest,
  ClassPaymentRequestDocument,
  ClassPaymentRequestStatus,
} from './schemas/class-payment-request.schema';
import {
  StudentPaymentRequest,
  StudentPaymentRequestDocument,
  StudentPaymentRequestStatus,
} from './schemas/student-payment-request.schema';
import { CreateClassPaymentRequestDto } from './dto/create-class-payment-request.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ClassEntity,
  ClassDocument,
} from '../classes/schemas/class.schema';

@Injectable()
export class PaymentRequestsService {
  constructor(
    @InjectModel(ClassPaymentRequest.name)
    private classRequestModel: Model<ClassPaymentRequestDocument>,
    @InjectModel(StudentPaymentRequest.name)
    private studentRequestModel: Model<StudentPaymentRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ClassEntity.name) private classModel: Model<ClassDocument>,
  ) {}

  // ==================== ADMIN METHODS ====================

  async createClassPaymentRequest(
    dto: CreateClassPaymentRequestDto,
    adminId: string,
  ): Promise<{ classRequest: ClassPaymentRequest; studentCount: number }> {
    // 1. Validate class
    const classEntity = await this.classModel.findById(dto.classId);
    if (!classEntity) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const studentIds = classEntity.studentIds || [];
    if (studentIds.length === 0) {
      throw new BadRequestException('Lớp học chưa có học sinh nào');
    }

    // 2. Lấy amount từ class.fee nếu không truyền
    const amount = dto.amount || (classEntity as any).fee || 0;
    if (amount <= 0) {
      throw new BadRequestException('Số tiền phải lớn hơn 0');
    }

    // 3. Tạo ClassPaymentRequest
    const classRequest = new this.classRequestModel({
      classId: new Types.ObjectId(dto.classId),
      title: dto.title,
      description: dto.description,
      amount,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      createdBy: new Types.ObjectId(adminId),
      className: classEntity.name,
      classSubject: classEntity.subject,
      totalStudents: studentIds.length,
      paidCount: 0,
      totalCollected: 0,
    });
    await classRequest.save();

    // 4. Lấy thông tin tất cả học sinh
    const students = await this.userModel.find({
      _id: { $in: studentIds },
    });

    // 5. Tạo StudentPaymentRequest cho từng học sinh
    const studentRequests = students.map((student) => {
      const scholarshipPercent =
        student.hasScholarship && student.scholarshipPercent
          ? student.scholarshipPercent
          : 0;
      const discountAmount = Math.floor((amount * scholarshipPercent) / 100);
      const finalAmount = Math.max(amount - discountAmount, 0);

      return {
        classPaymentRequestId: classRequest._id,
        classId: new Types.ObjectId(dto.classId),
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        className: classEntity.name,
        classSubject: classEntity.subject,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        baseAmount: amount,
        scholarshipPercent,
        scholarshipType: student.scholarshipType,
        discountAmount,
        finalAmount,
        status:
          finalAmount === 0
            ? StudentPaymentRequestStatus.PAID
            : StudentPaymentRequestStatus.PENDING,
        paidAt: finalAmount === 0 ? new Date() : undefined,
      };
    });

    await this.studentRequestModel.insertMany(studentRequests);

    // 6. Cập nhật paidCount nếu có miễn phí
    const freeCount = studentRequests.filter(
      (r) => r.status === StudentPaymentRequestStatus.PAID,
    ).length;
    if (freeCount > 0) {
      classRequest.paidCount = freeCount;
      await classRequest.save();
    }

    return { classRequest, studentCount: studentRequests.length };
  }

  async getClassPaymentRequests(
    classId?: string,
  ): Promise<ClassPaymentRequest[]> {
    const query: any = { status: ClassPaymentRequestStatus.ACTIVE };
    if (classId) {
      query.classId = new Types.ObjectId(classId);
    }
    return this.classRequestModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('classId', 'name subject')
      .populate('createdBy', 'name email');
  }

  async getClassPaymentRequestById(id: string): Promise<ClassPaymentRequest> {
    const request = await this.classRequestModel
      .findById(id)
      .populate('classId', 'name subject')
      .populate('createdBy', 'name email');
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }
    return request;
  }

  async getStudentsByClassRequest(classRequestId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    students: StudentPaymentRequest[];
  }> {
    const students = await this.studentRequestModel
      .find({ classPaymentRequestId: new Types.ObjectId(classRequestId) })
      .populate('studentId', 'name email studentCode')
      .sort({ studentName: 1 });

    const paid = students.filter(
      (s) => s.status === StudentPaymentRequestStatus.PAID,
    ).length;
    const pending = students.filter(
      (s) => s.status === StudentPaymentRequestStatus.PENDING,
    ).length;

    return {
      total: students.length,
      paid,
      pending,
      students,
    };
  }

  async cancelClassPaymentRequest(id: string): Promise<void> {
    const request = await this.classRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    // Hủy tất cả student requests chưa thanh toán
    await this.studentRequestModel.updateMany(
      {
        classPaymentRequestId: new Types.ObjectId(id),
        status: StudentPaymentRequestStatus.PENDING,
      },
      { status: StudentPaymentRequestStatus.CANCELLED },
    );

    request.status = ClassPaymentRequestStatus.CANCELLED;
    await request.save();
  }

  // ==================== STUDENT METHODS ====================

  async getStudentPaymentRequests(
    studentId: string,
    status?: StudentPaymentRequestStatus,
  ): Promise<StudentPaymentRequest[]> {
    const query: any = { studentId: new Types.ObjectId(studentId) };
    if (status) {
      query.status = status;
    } else {
      // Mặc định lấy pending và overdue
      query.status = {
        $in: [
          StudentPaymentRequestStatus.PENDING,
          StudentPaymentRequestStatus.OVERDUE,
        ],
      };
    }
    return this.studentRequestModel.find(query).sort({ dueDate: 1 });
  }

  async getAllStudentPaymentRequests(
    studentId: string,
  ): Promise<StudentPaymentRequest[]> {
    return this.studentRequestModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 });
  }

  async getStudentPaymentRequestById(id: string): Promise<StudentPaymentRequest> {
    const request = await this.studentRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }
    return request;
  }

  // ==================== PARENT METHODS ====================

  async getChildrenPaymentRequests(
    parentId: string,
  ): Promise<{ studentId: string; studentName: string; requests: StudentPaymentRequest[] }[]> {
    // Lấy parent
    const parent = await this.userModel.findById(parentId);
    if (!parent || !parent.childEmail) {
      return [];
    }

    // Tìm student theo childEmail
    const child = await this.userModel.findOne({ email: parent.childEmail });
    if (!child) {
      return [];
    }

    // Lấy requests của con
    const requests = await this.studentRequestModel
      .find({
        studentId: child._id,
      })
      .sort({ createdAt: -1 });

    return [
      {
        studentId: (child._id as Types.ObjectId).toString(),
        studentName: child.name,
        requests,
      },
    ];
  }

  // ==================== PAYMENT HELPERS ====================

  async markAsPaid(
    requestIds: string[],
    paymentId: Types.ObjectId,
  ): Promise<void> {
    const objectIds = requestIds.map((id) => new Types.ObjectId(id));

    // Update student requests
    await this.studentRequestModel.updateMany(
      { _id: { $in: objectIds } },
      {
        status: StudentPaymentRequestStatus.PAID,
        paidAt: new Date(),
        paymentId,
      },
    );

    // Update class request stats
    const requests = await this.studentRequestModel.find({
      _id: { $in: objectIds },
    });

    const classRequestIds = [
      ...new Set(requests.map((r) => r.classPaymentRequestId.toString())),
    ];

    for (const classRequestId of classRequestIds) {
      const paidRequests = await this.studentRequestModel.find({
        classPaymentRequestId: new Types.ObjectId(classRequestId),
        status: StudentPaymentRequestStatus.PAID,
      });

      const totalCollected = paidRequests.reduce(
        (sum, r) => sum + r.finalAmount,
        0,
      );

      await this.classRequestModel.findByIdAndUpdate(classRequestId, {
        paidCount: paidRequests.length,
        totalCollected,
      });
    }
  }

  async validateRequestsForPayment(
    requestIds: string[],
    studentId: string,
  ): Promise<{ requests: StudentPaymentRequest[]; totalAmount: number }> {
    const requests = await this.studentRequestModel.find({
      _id: { $in: requestIds.map((id) => new Types.ObjectId(id)) },
      studentId: new Types.ObjectId(studentId),
      status: {
        $in: [
          StudentPaymentRequestStatus.PENDING,
          StudentPaymentRequestStatus.OVERDUE,
        ],
      },
    });

    if (requests.length !== requestIds.length) {
      throw new BadRequestException(
        'Một số yêu cầu không hợp lệ hoặc đã được thanh toán',
      );
    }

    const totalAmount = requests.reduce((sum, r) => sum + r.finalAmount, 0);

    return { requests, totalAmount };
  }
}
