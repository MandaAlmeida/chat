import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user-decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CreateMessageDTO, UpdateMessageDTO } from "src/contracts/message.dto";
import { MessageService } from "src/service/message.service";

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
    constructor(private messageService: MessageService) { }

    @Post('send-message')
    async sendMessage(@CurrentUser() user: { sub: string }, @Body() newMessage: CreateMessageDTO) {
        return this.messageService.sendMessage(user, newMessage);
    }

    @Get(":id")
    async findMessage(@Param('id') chatId: string) {
        return this.messageService.findMessage(chatId);
    }

    @Put(":id")
    async updateMessage(@Param('id') id: string, @Body() message: UpdateMessageDTO) {
        return this.messageService.updateMessage(id, message);
    }

    @Patch(":id")
    async viewMessage(@Param('id') id: string) {
        return this.messageService.viewMessage(id);
    }

    @Delete(":id")
    async deleteMessage(@Param('id') id: string) {
        return this.messageService.deleteMessage(id);
    }

}
