import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService, ChatMessageResponse } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import type { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

interface JoinPayload {
  withUserId: string;
}

@WebSocketGateway({
  cors: {
    origin:
      process.env.FRONTEND_URL?.split(',').map((item) => item.trim()) || '*',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticate(client);
      const userId = this.toUserId(user);
      client.join(this.userRoom(userId));
      this.trackSocket(userId, client.id);
      client.emit('chat:connected', { userId });
      this.logger.verbose(`Socket ${client.id} connected as ${userId}`);
    } catch (error) {
      this.logger.warn(`Socket rejected: ${error?.message}`);
      client.emit(
        'chat:error',
        'Không thể kết nối tới máy chủ chat. Vui lòng đăng nhập lại.',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    const user = await this.requireUser(client);
    if (!payload?.withUserId) {
      throw new WsException('withUserId is required');
    }

    const room = this.conversationRoom(user._id.toString(), payload.withUserId);
    client.join(room);

    const history = await this.chatService.list(user, payload.withUserId);
    client.emit('chat:history', history);
  }

  @SubscribeMessage('chat:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    const user = await this.requireUser(client);
    if (!payload?.withUserId) {
      return;
    }
    const room = this.conversationRoom(user._id.toString(), payload.withUserId);
    client.leave(room);
  }

  @SubscribeMessage('chat:message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const user = await this.requireUser(client);
    if (!payload?.receiverId || !payload?.content?.trim()) {
      throw new WsException('Thiếu thông tin tin nhắn');
    }

    const saved = await this.chatService.send(user, {
      ...payload,
      content: payload.content.trim(),
    });

    this.broadcastMessage(saved);
  }

  private broadcastMessage(message: ChatMessageResponse) {
    const room = this.conversationRoom(message.senderId, message.receiverId);
    this.server.to(room).emit('chat:message', message);

    // Đảm bảo cả 2 người dùng đều nhận được thông báo kể cả khi chưa join room cụ thể
    this.server.to(this.userRoom(message.receiverId)).emit('chat:message', message);
    this.server.to(this.userRoom(message.senderId)).emit('chat:message', message);
  }

  private async authenticate(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Unauthorized');
    }

    const secret = this.configService.get<string>('JWT_SECRET', 'secret');
    const payload = await this.jwtService.verifyAsync(token, { secret });
    const user = await this.usersService.findById(payload.sub);

    client.data.userId = this.toUserId(user);
    client.data.user = user;
    client.data.userRole = user.role;

    return user;
  }

  private async requireUser(client: Socket): Promise<UserDocument> {
    if (!client.data?.user) {
      return (await this.authenticate(client)) as UserDocument;
    }
    return client.data.user as UserDocument;
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const queryToken = client.handshake.query?.token;
    if (Array.isArray(queryToken)) {
      return queryToken[0];
    }
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(userA: string, userB: string) {
    return `conversation:${[userA, userB].sort().join(':')}`;
  }

  private trackSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private toUserId(user: UserDocument | any): string {
    return (
      user?._id?.toString?.() ||
      user?.id?.toString?.() ||
      user?.id ||
      user?._id ||
      ''
    );
  }
}
