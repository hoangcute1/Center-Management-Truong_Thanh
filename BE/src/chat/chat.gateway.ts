import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('No token provided, disconnecting client');
        client.disconnect();
        return;
      }

      console.log('Attempting to verify token...');
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        console.log('User not found, disconnecting client');
        client.disconnect();
        return;
      }

      client.userId = (user as any)._id.toString();
      client.user = user;
      this.connectedUsers.set((user as any)._id.toString(), client.id);

      console.log(`User ${user.name} connected with socket ${client.id}`);
      
      // Join user to their personal room
      client.join(`user_${(user as any)._id}`);
      
      // Notify user is online
      client.broadcast.emit('userOnline', { userId: (user as any)._id, name: user.name });
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected`);
      
      // Notify user is offline
      client.broadcast.emit('userOffline', { userId: client.userId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      // Save message to database
      const message = await this.chatService.send(client.user, data);
      
      // Populate sender and receiver info
      const populatedMessage = await message.populate([
        { path: 'senderId', select: 'name role' },
        { path: 'receiverId', select: 'name role' }
      ]);

      // Send to receiver if online
      this.server.to(`user_${data.receiverId}`).emit('newMessage', {
        _id: populatedMessage._id,
        senderId: populatedMessage.senderId,
        receiverId: populatedMessage.receiverId,
        content: populatedMessage.content,
        createdAt: (populatedMessage as any).createdAt,
      });

      // Send back to sender for confirmation
      client.emit('messageSent', {
        _id: populatedMessage._id,
        senderId: populatedMessage.senderId,
        receiverId: populatedMessage.receiverId,
        content: populatedMessage.content,
        createdAt: (populatedMessage as any).createdAt,
      });

      return { success: true };
    } catch (error) {
      console.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { otherUserId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;
    
    const roomName = this.getConversationRoom(client.userId, data.otherUserId);
    client.join(roomName);
    
    return { success: true, room: roomName };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { otherUserId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;
    
    const roomName = this.getConversationRoom(client.userId, data.otherUserId);
    client.leave(roomName);
    
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { receiverId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;
    
    this.server.to(`user_${data.receiverId}`).emit('userTyping', {
      userId: client.userId,
      userName: client.user?.name,
      isTyping: data.isTyping,
    });
  }

  private getConversationRoom(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}