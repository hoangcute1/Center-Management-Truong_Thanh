import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const doc = new this.model({
      ...dto,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });
    return doc.save();
  }

  listForUser(user: UserDocument) {
    if (user.role === UserRole.Admin) return this.model.find().sort({ createdAt: -1 }).exec();
    return this.model
      .find({ $or: [{ userId: user._id }, { userId: null }] })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markRead(id: string) {
    const updated = await this.model
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async markAllRead(user: UserDocument) {
    // Đánh dấu tất cả thông báo của user là đã đọc
    const filter = user.role === UserRole.Admin 
      ? {} 
      : { $or: [{ userId: user._id }, { userId: null }] };
    
    await this.model.updateMany(filter, { isRead: true }).exec();
    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
  }
}
