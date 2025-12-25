import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class TuitionService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly model: Model<InvoiceDocument>,
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

  async update(id: string, dto: UpdateInvoiceDto) {
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Invoice not found');
    return updated;
  }
}
