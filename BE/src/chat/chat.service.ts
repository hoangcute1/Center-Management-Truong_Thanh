import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly model: Model<MessageDocument>,
  ) {}

  async send(user: UserDocument, dto: SendMessageDto) {
    const doc = new this.model({
      senderId: user._id,
      receiverId: new Types.ObjectId(dto.receiverId),
      content: dto.content,
    });
    return doc.save();
  }

  list(user: UserDocument, otherUserId?: string) {
    if (otherUserId) {
      return this.model
        .find({
          $or: [
            { senderId: user._id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user._id },
          ],
        })
        .sort({ createdAt: 1 })
        .exec();
    }
    return this.model
      .find({ $or: [{ senderId: user._id }, { receiverId: user._id }] })
      .sort({ createdAt: -1 })
      .exec();
  }
}
