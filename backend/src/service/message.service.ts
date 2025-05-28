import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDTO, UpdateMessageDTO } from 'src/contracts/message.dto';
import { PrismaService } from './prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class MessageService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(user: { sub: string }, newMessage: CreateMessageDTO) {
        const { message, chatId } = newMessage;
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
                createdAt: 'asc'
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
