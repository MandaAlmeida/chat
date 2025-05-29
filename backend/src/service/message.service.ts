import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDTO, UpdateMessageDTO } from 'src/contracts/message.dto';
import { PrismaService } from './prisma.service';
import { Status } from '@prisma/client';
import { MessageGateway } from 'src/gateway/message.gateway';

@Injectable()
export class MessageService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly messageGateway: MessageGateway
    ) { }

    async sendMessage(user: { sub: string }, newMessage: CreateMessageDTO) {
        const { message, chatId, recipients } = newMessage;

        const createdMessage = await this.prisma.content.create({
            data: {
                message,
                authorId: user.sub,
                chatId,
                status: Status.SENT
            }
        });

        // Prepara o payload a ser enviado
        const chatPayload = {
            id: createdMessage.id,
            sender: user.sub,
            content: message,
            chatId: chatId,
            timestamp: createdMessage.createdAt,
            status: createdMessage.status
        };

        // Cria um Set para eliminar duplicatas
        const newRecipients = new Set([...recipients, user.sub]);

        for (const userId of newRecipients) {
            this.messageGateway.sendChat(userId, chatPayload);
        }
        return createdMessage;
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

    async updateMessage(id: string, message: string) {
        await this.checkMessageExist(id)

        return await this.prisma.content.update({
            where: { id },
            data: {
                message: message,
                status: Status.EDITED
            }
        });
    }

    async viewMessage(ids: string[]) {
        console.log(ids)
        await this.checkMessagesExist(ids);

        return await this.prisma.content.updateMany({
            where: { id: { in: ids } },
            data: {
                status: Status.SEEN
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


    private async checkMessagesExist(ids: string[]) {
        const count = await this.prisma.content.count({
            where: { id: { in: ids } }
        });

        if (count !== ids.length) {
            throw new NotFoundException('Uma ou mais mensagens não encontradas.');
        }
    }

}
