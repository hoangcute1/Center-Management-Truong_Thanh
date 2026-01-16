import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ClassEntity,
  ClassDocument,
} from '../classes/schemas/class.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ClassEntity.name) private classModel: Model<ClassDocument>,
  ) {}

  async create(studentId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Validate student
    const student = await this.userModel.findById(studentId);
    if (!student) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    // 2. Validate và lấy thông tin classes
    const classIds = dto.classIds.map((id) => new Types.ObjectId(id));
    const classes = await this.classModel.find({ _id: { $in: classIds } });

    if (classes.length === 0) {
      throw new BadRequestException('Không có lớp học nào hợp lệ');
    }

    if (classes.length !== dto.classIds.length) {
      throw new BadRequestException('Một số lớp học không tồn tại');
    }

    // 3. Validate student thuộc các classes
    for (const cls of classes) {
      const studentInClass = cls.studentIds?.some(
        (sid) => sid.toString() === studentId,
      );
      if (!studentInClass) {
        throw new BadRequestException(
          `Học sinh không thuộc lớp ${cls.name}`,
        );
      }
    }

    // 4. Tính toán pricing
    const items = classes.map((cls) => ({
      classId: cls._id as Types.ObjectId,
      className: cls.name,
      classSubject: cls.subject,
      classFee: (cls as any).fee || 0,
    }));

    const baseAmount = items.reduce((sum, item) => sum + item.classFee, 0);

    // Lấy học bổng từ student
    const scholarshipPercent = student.hasScholarship
      ? student.scholarshipPercent || 0
      : 0;
    const scholarshipType = student.scholarshipType;

    const discountAmount = Math.floor(
      (baseAmount * scholarshipPercent) / 100,
    );
    const finalAmount = Math.max(baseAmount - discountAmount, 0);

    // 5. Tạo order
    const order = new this.orderModel({
      studentId: new Types.ObjectId(studentId),
      studentName: student.name,
      studentCode: student.studentCode,
      items,
      baseAmount,
      scholarshipPercent,
      scholarshipType,
      discountAmount,
      finalAmount,
      currency: 'VND',
      status:
        finalAmount === 0 ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT,
      paidAt: finalAmount === 0 ? new Date() : undefined,
      note: dto.note,
    });

    return order.save();
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).populate('studentId');
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async findByStudent(
    studentId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const query: any = { studentId: new Types.ObjectId(studentId) };
    if (status) {
      query.status = status;
    }
    return this.orderModel.find(query).sort({ createdAt: -1 });
  }

  async findAll(options?: {
    status?: OrderStatus;
    limit?: number;
    skip?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const query: any = {};
    if (options?.status) {
      query.status = options.status;
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 50)
        .skip(options?.skip || 0)
        .populate('studentId', 'name email studentCode'),
      this.orderModel.countDocuments(query),
    ]);

    return { orders, total };
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { paidAt?: Date; cancelReason?: string },
  ): Promise<Order> {
    const update: any = { status };
    if (extra?.paidAt) update.paidAt = extra.paidAt;
    if (extra?.cancelReason) {
      update.cancelReason = extra.cancelReason;
      update.cancelledAt = new Date();
    }

    const order = await this.orderModel.findByIdAndUpdate(orderId, update, {
      new: true,
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async cancel(orderId: string, reason?: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Không thể hủy đơn hàng này');
    }

    return this.updateStatus(orderId, OrderStatus.CANCELLED, {
      cancelReason: reason,
    });
  }
}
