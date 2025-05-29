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
    async findMessage(@CurrentUser() user: { sub: string }, @Param('id') chatId: string) {
        return this.messageService.findMessage(user, chatId);
    }

    @Put(":id")
    async updateMessage(@Param('id') id: string, @Body("message") message: string) {
        return this.messageService.updateMessage(id, message);
    }

    @Patch("view-message")
    async viewMessage(@Body('ids') ids: string[]) {
        return this.messageService.viewMessage(ids);
    }

    @Delete(":id")
    async deleteMessage(@Param('id') id: string) {
        return this.messageService.deleteMessage(id);
    }

}
