import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user-decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CreateMessageDTO } from '@/contracts/message.dto';
import { MessageService } from '@/service/message.service';

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private messageService: MessageService) {}

  @Post('send-message')
  async sendMessage(
    @CurrentUser() user: { sub: string },
    @Body() newMessage: CreateMessageDTO,
  ) {
    // this.logger.error('Error from MessageController sendMessage');
    return this.messageService.sendMessage(user, newMessage);
  }

  @Get(':id')
  async findMessage(
    @CurrentUser() user: { sub: string },
    @Param('id') chatId: string,
  ) {
    // this.logger.error('Error from MessageController findMessage');

    return this.messageService.findMessage(user, chatId);
  }

  @Post('last-messages')
  async findLastMessage(
    @CurrentUser() user: { sub: string },
    @Body('chatIds') chatIds: string[],
  ) {
    // this.logger.error('Error from MessageController findLastMessage');

    return this.messageService.findLastMessagesForChats(user, chatIds);
  }

  @Put(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body('message') message: string,
  ) {
    // this.logger.error('Error from MessageController updateMessage');

    return this.messageService.updateMessage(id, message);
  }

  @Patch('view-message')
  async viewMessage(
    @CurrentUser() user: { sub: string },
    @Body('ids') ids: string[],
  ) {
    // this.logger.error('Error from MessageController viewMessage');

    return this.messageService.viewMessage(ids);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') ids: string[]) {
    // this.logger.error('Error from MessageController deleteMessage');

    return this.messageService.deleteMessage(ids);
  }
}
