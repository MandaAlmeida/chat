import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user-decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CreateChatDTO, CreateGroupDTO, UpdateGroupChatDTO } from '@/contracts/chat.dto';
import { ChatService } from '@/service/chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) { }

  @Post()
  async createChat(@CurrentUser() user: { sub: string }, @Body() createChat: CreateChatDTO) {
    return this.chatService.createChat(user, createChat);
  }

  @Post('get-or-create')
  async getOrCreateChat(@CurrentUser() user: { sub: string }, @Body() createChat: CreateChatDTO) {
    let chat = await this.chatService.findBetweenUsers(user, createChat);

    if (!chat) {
      chat = await this.chatService.createChat(user, createChat);
    }

    return chat;
  }

  @Post('create-group')
  async createGroupChat(@CurrentUser() user: { sub: string }, @Body() createGroup: CreateGroupDTO) {
    return await this.chatService.createGroupChat(user, createGroup);
  }

  @Get()
  async findChat(@CurrentUser() user: { sub: string }) {
    return await this.chatService.findChat(user);
  }

  @Put('update-group/:id')
  async updateGroupChat(@Param("id") id: string, @Body() updateGroup: UpdateGroupChatDTO) {
    return await this.chatService.updateGroupChat(id, updateGroup);
  }

  @Patch('remove-participant-group/:id')
  async removeParticipantsByGroup(@Param("id") id: string, @Body() participants: string[]) {
    return await this.chatService.removeParticipantsByGroup(id, participants);
  }

  @Delete('delete/:id')
  async deleteChatForUser(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return await this.chatService.deleteChatForUser(user, id);
  }

}

