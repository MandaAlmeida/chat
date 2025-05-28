import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDTO, UpdateMessageDTO } from 'src/contracts/message.dto';
import { PrismaService } from './prisma.service';
import { Status } from '@prisma/client';
import { MessageGateway } from 'src/gateway/message.gateway';


@Injectable()
export class MessageService {
    constructor(private prisma: PrismaService, private socket: MessageGateway) { }

    async sendMessage(user: { sub: string }, newMessage: CreateMessageDTO) {
        const { message, chatId } = newMessage;

        this.socket.sendChat(user.sub, {
            sender: user.sub,
            content: message,
            timestamp: new Date().toISOString()
        });

        return await this.prisma.content.create({
            data: {
                message,
                authorId: user.sub,
                chatId,
                status: Status.SENT
            }
        });
    }

    async findMessage(chatId: string) {
        const existChat = await this.prisma.chat.findUnique({ where: { id: chatId } })

        if (!existChat) throw new NotFoundException(`Chat não encontrado`);

        const messagens = await this.prisma.content.findMany({
            where: { chatId },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return messagens;
    }

    async updateMessage(id: string, message: UpdateMessageDTO) {
        await this.checkMessageExist(id)

        return await this.prisma.content.update({
            where: { id },
            data: {
                message: message.message,
                status: Status.EDITED
            }
        });
    }

    async viewMessage(id: string) {
        await this.checkMessageExist(id)

        return await this.prisma.content.update({
            where: { id },
            data: {
                status: Status.EDITED
            }
        });
    }

    async deleteMessage(id: string) {
        await this.checkMessageExist(id)

        const messagens = await this.prisma.content.deleteMany({
            where: { id },
        })

        return messagens;
    }

    private async checkMessageExist(id: string) {
        const existMessage = await this.prisma.content.findUnique({ where: { id } });

        if (!existMessage) throw new NotFoundException("Messagem não encontrada")
    }
}
