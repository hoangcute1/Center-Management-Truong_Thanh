import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private model: Model<SessionDocument>,
  ) {}

  async create(user: UserDocument, dto: CreateSessionDto) {
    const doc = new this.model({
      ...dto,
      classId: new Types.ObjectId(dto.classId),
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      createdBy: user._id,
    });
    return doc.save();
  }

  findByClass(classId: string) {
    return this.model.find({ classId }).exec();
  }

  findAll() {
    return this.model.find().exec();
  }

  async update(id: string, dto: UpdateSessionDto, approver?: UserDocument) {
    const updatePayload: any = { ...dto };
    if (dto.status && approver) updatePayload.approvedBy = approver._id;
    const updated = await this.model
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Session not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Session not found');
  }
}
