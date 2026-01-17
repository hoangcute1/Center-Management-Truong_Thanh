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
    try {
      const doc = new this.model({
        senderId: user._id,
        receiverId: new Types.ObjectId(dto.receiverId),
        content: dto.content,
        isRead: false,
      });
      
      const savedMessage = await doc.save();
      console.log('Message saved successfully:', savedMessage._id);
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async list(user: UserDocument, otherUserId?: string) {
    console.log('Chat service list - user:', (user as any)._id, 'otherUserId:', otherUserId);
    
    const query = otherUserId
      ? {
          $or: [
            { senderId: (user as any)._id, receiverId: new Types.ObjectId(otherUserId) },
            { senderId: new Types.ObjectId(otherUserId), receiverId: (user as any)._id },
          ],
        }
      : { $or: [{ senderId: (user as any)._id }, { receiverId: (user as any)._id }] };

    console.log('Query:', JSON.stringify(query, null, 2));

    const messages = await this.model
      .find(query)
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role')
      .sort({ createdAt: otherUserId ? 1 : -1 })
      .exec();

    console.log('Found messages:', messages.length);
    return messages;
  }

  async getConversations(user: UserDocument) {
    // Get all unique conversations for the user
    const conversations = await this.model.aggregate([
      {
        $match: {
          $or: [{ senderId: user._id }, { receiverId: user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', user._id] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', user._id] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      {
        $unwind: '$otherUser',
      },
      {
        $project: {
          otherUser: {
            _id: 1,
            name: 1,
            role: 1,
          },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    return conversations;
  }
}
