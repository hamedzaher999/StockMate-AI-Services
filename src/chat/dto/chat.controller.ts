import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { InternalServiceGuard } from 'src/core/guards/internal-service.guard';
import { IncomingMessageDto } from './incoming-message.dto';

@Controller('internal/chat')
@UseGuards(InternalServiceGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async message(@Body() dto: IncomingMessageDto) {
    return this.chatService.handleMessage(dto);
  }
}
