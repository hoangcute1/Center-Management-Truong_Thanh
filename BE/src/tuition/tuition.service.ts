import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';
import { User, UserDocument as UserDoc } from '../users/schemas/user.schema';

@Injectable()
export class TuitionService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly model: Model<InvoiceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDoc>,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const doc = new this.model({
      ...dto,
      studentId: new Types.ObjectId(dto.studentId),
    });
    return doc.save();
  }

  listForUser(user: UserDocument) {
    if (user.role === UserRole.Admin) return this.model.find().exec();
    return this.model.find({ studentId: user._id }).exec();
  }

  // Lấy học phí của học sinh theo ID
  async getStudentTuition(studentId: string) {
    return this.model
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('studentId', 'name fullName email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Lấy học phí của các con (dành cho phụ huynh)
  async getChildrenTuition(parent: UserDocument) {
    // Lấy danh sách con từ childEmail hoặc studentIds
    const childEmail = (parent as any).childEmail;
    const studentIds = (parent as any).studentIds || [];
    
    const childIdList: Types.ObjectId[] = [];
    
    // Nếu có childEmail, tìm student theo email
    if (childEmail) {
      const child = await this.userModel.findOne({ 
        email: childEmail, 
        role: UserRole.Student 
      }).exec();
      if (child) {
        childIdList.push(child._id as Types.ObjectId);
      }
    }
    
    // Thêm các studentIds đã có
    for (const sid of studentIds) {
      childIdList.push(new Types.ObjectId(sid));
    }
    
    if (childIdList.length === 0) {
      return [];
    }
    
    return this.model
      .find({ studentId: { $in: childIdList } })
      .populate('studentId', 'name fullName email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Invoice not found');
    return updated;
  }
}
