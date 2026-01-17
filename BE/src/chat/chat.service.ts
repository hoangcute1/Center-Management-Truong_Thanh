import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import type { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/role.enum';

export interface ChatMessageResponse {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly model: Model<MessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async send(user: UserDocument, dto: SendMessageDto): Promise<ChatMessageResponse> {
    const receiver = (await this.usersService.findById(
      dto.receiverId,
    )) as UserDocument;

    this.ensureTeacherConversation(user, receiver);

    const doc = await this.model.create({
      senderId: new Types.ObjectId(user._id),
      receiverId: new Types.ObjectId(dto.receiverId),
      content: dto.content.trim(),
    });

    return this.sanitizeMessage(doc);
  }

  async list(
    user: UserDocument,
    otherUserId?: string,
  ): Promise<ChatMessageResponse[]> {
    if (otherUserId) {
      const receiver = (await this.usersService.findById(
        otherUserId,
      )) as UserDocument;
      this.ensureTeacherConversation(user, receiver);
      const otherObjectId = new Types.ObjectId(otherUserId);

      const docs = await this.model
        .find({
          $or: [
            { senderId: user._id, receiverId: otherObjectId },
            { senderId: otherObjectId, receiverId: user._id },
          ],
        })
        .sort({ createdAt: 1 })
        .lean();

      return docs.map((doc) => this.sanitizeMessage(doc as any));
    }

    const docs = await this.model
      .find({ $or: [{ senderId: user._id }, { receiverId: user._id }] })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => this.sanitizeMessage(doc as any));
  }

  private sanitizeMessage(
    message: MessageDocument | (Message & { _id: Types.ObjectId }),
  ): ChatMessageResponse {
    const plain: any =
      typeof (message as any).toObject === 'function'
        ? (message as MessageDocument).toObject()
        : message;

    return {
      id: plain._id?.toString?.() ?? plain.id,
      senderId: plain.senderId?.toString?.() ?? plain.senderId,
      receiverId: plain.receiverId?.toString?.() ?? plain.receiverId,
      content: plain.content,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    } as ChatMessageResponse;
  }

  private ensureTeacherConversation(
    sender: UserDocument,
    receiver: UserDocument,
  ) {
    const allowedRoles = new Set<UserRole>([
      UserRole.Teacher,
      UserRole.Parent,
      UserRole.Student,
    ]);

    if (!allowedRoles.has(sender.role as UserRole)) {
      throw new ForbiddenException('Vai trò của bạn không được phép chat.');
    }

    if (!allowedRoles.has(receiver.role as UserRole)) {
      throw new ForbiddenException('Người nhận không hợp lệ để chat.');
    }

    if (
      sender.role !== UserRole.Teacher &&
      receiver.role !== UserRole.Teacher
    ) {
      throw new ForbiddenException(
        'Cuộc trò chuyện phải có ít nhất một giáo viên.',
      );
    }
  }
}
