import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  send(@CurrentUser() user: UserDocument, @Body() dto: SendMessageDto) {
    return this.chatService.send(user, dto);
  }

  @Get('messages')
  list(@CurrentUser() user: UserDocument, @Query('with') withUserId?: string) {
    return this.chatService.list(user, withUserId);
  }
}
