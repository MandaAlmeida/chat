import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDTO, UpdateMessageDTO } from '@/contracts/message.dto';
import { PrismaService } from './prisma.service';
import { Status, SeenStatus, $Enums, Content } from '@prisma/client';
import { MessageGateway } from '@/gateway/message.gateway';

@Injectable()
export class MessageService {
    constructor(
        private readonly prisma: PrismaService, // Serviço do Prisma para interagir com o banco de dados
        private readonly messageGateway: MessageGateway // Gateway para comunicação em tempo real via WebSocket
    ) { }


    // Envia uma nova mensagem
    async sendMessage(user: { sub: string }, newMessage: CreateMessageDTO) {
        const { message, chatId, recipients } = newMessage;

        // Cria a mensagem no banco
        const createdMessage = await this.prisma.content.create({
            data: {
                message,
                authorId: user.sub,
                chatId
            }
        });

        // Estrutura de payload para envio via WebSocket
        const chatPayload = {
            id: createdMessage.id,
            sender: user.sub,
            content: message,
            chatId: chatId,
            timestamp: createdMessage.createdAt,
            seenStatus: createdMessage.seenStatus
        };

        // Inclui remetente entre os destinatários
        const newRecipients = new Set([...recipients, user.sub]);

        // Envia a mensagem para todos os destinatários
        for (const userId of newRecipients) {
            this.messageGateway.sendMessage(userId, chatPayload);
        }

        return createdMessage;
    }

    // Busca mensagens de um chat específico
    async findMessage(user: { sub: string }, chatId: string) {
        // Verifica se o chat existe
        const existChat = await this.prisma.chat.findUnique({ where: { id: chatId } });
        if (!existChat) throw new NotFoundException(`Chat não encontrado`);

        // Verifica se o usuário deletou o chat
        const deletedChat = await this.prisma.deletedChat.findUnique({
            where: {
                userId_chatId: {
                    userId: user.sub,
                    chatId: chatId
                }
            }
        });

        const whereCondition: any = { chatId };

        // Se deletou, não retorna mensagens
        if (deletedChat) {
            if (deletedChat.active) {
                return [];
            } else if (deletedChat.deletedAt) {
                // Se foi marcado como deletado mas depois reativado, retorna apenas mensagens posteriores à reativação
                whereCondition.createdAt = { gt: deletedChat.updatedAt };
            }
        }

        // Busca as mensagens ordenadas pela data de criação
        const mensagens = await this.prisma.content.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'asc' }
        });

        return mensagens;
    }

    // Busca a  ultima mensagem de um chat específico
    async findLastMessagesForChats(user: { sub: string }, chatIds: string[]) {
        const results = await Promise.all(
            chatIds.map(async (chatId) => {
                // Verifica se o chat existe
                const existChat = await this.prisma.chat.findUnique({ where: { id: chatId } });
                if (!existChat) return null;

                // Verifica se o usuário deletou o chat
                const deletedChat = await this.prisma.deletedChat.findUnique({
                    where: {
                        userId_chatId: {
                            userId: user.sub,
                            chatId: chatId
                        }
                    }
                });

                const whereCondition: any = { chatId };

                if (deletedChat) {
                    if (deletedChat.active) return null;
                    else if (deletedChat.deletedAt) {
                        whereCondition.createdAt = { gt: deletedChat.updatedAt };
                    }
                }

                const lastMessage = await this.prisma.content.findFirst({
                    where: whereCondition,
                    orderBy: { createdAt: 'desc' },
                });

                return lastMessage;

            })
        );
        const filtered: Content[] = results.filter(
            (msg): msg is Content => msg !== null
        );
        return filtered;
    }

    // Atualiza uma mensagem
    async updateMessage(id: string, message: string) {
        // Verifica se a mensagem existe
        await this.checkMessageExist(id);

        // Atualiza o conteúdo da mensagem e define status como EDITED
        const newMessage = await this.prisma.content.update({
            where: { id },
            data: {
                message: message,
                status: Status.EDITED
            }
        });

        // Busca o chat relacionado à mensagem
        const chat = await this.prisma.chat.findUnique({
            where: { id: newMessage.chatId },
        });
        if (!chat) throw new NotFoundException('Chat não encontrado');

        // Lista de participantes que devem ser notificados (exclui autor da edição)
        const participants = [...(chat.participantIds ?? []), chat.createId];
        const newRecipients = new Set(
            participants.filter(userId => userId !== newMessage.authorId)
        );

        // Envia atualização para os participantes
        const chatPayload = {
            id: newMessage.id,
            sender: newMessage.authorId,
            content: message,
            chatId: newMessage.chatId,
            timestamp: newMessage.createdAt,
            status: newMessage.status,
            seenStatus: newMessage.seenStatus
        };

        for (const userId of newRecipients) {
            this.messageGateway.sendMessage(userId, chatPayload);
        }
    }

    // Marca mensagens como visualizadas
    async viewMessage(ids: string[]) {
        // Atualiza o status de visualização das mensagens
        await this.prisma.content.updateMany({
            where: { id: { in: ids } },
            data: { seenStatus: SeenStatus.SEEN }
        });

        // Busca as mensagens atualizadas
        const messages = await this.prisma.content.findMany({
            where: { id: { in: ids } }
        });

        // Notifica os participantes do chat sobre a atualização
        for (const msg of messages) {
            const payload = {
                id: msg.id,
                chatId: msg.chatId,
                seenStatus: SeenStatus.SEEN
            };

            const chat = await this.prisma.chat.findUnique({
                where: { id: msg.chatId }
            });

            const participants = [...(chat?.participantIds ?? []), chat?.createId].filter(Boolean) as string[];

            for (const participant of participants) {
                this.messageGateway.sendMessage(participant, payload);
            }
        }
    }

    // Exclui uma mensagem (soft delete)
    async deleteMessage(id: string) {
        // Verifica se a mensagem existe
        await this.checkMessageExist(id);

        // Marca a mensagem como excluída
        const deletedMessage = await this.prisma.content.update({
            where: { id },
            data: {
                status: Status.DELETE,
                message: 'Mensagem excluída'
            }
        });

        // Busca o chat relacionado
        const chat = await this.prisma.chat.findUnique({
            where: { id: deletedMessage.chatId },
        });
        if (!chat) throw new NotFoundException('Chat não encontrado');

        // Participantes do chat
        const participants = [...(chat.participantIds ?? []), chat.createId];
        const uniqueRecipients = new Set(participants);

        // Payload de notificação
        const chatPayload = {
            id: deletedMessage.id,
            sender: deletedMessage.authorId,
            content: 'Mensagem excluída',
            chatId: deletedMessage.chatId,
            timestamp: deletedMessage.createdAt,
            status: deletedMessage.status,
            seenStatus: deletedMessage.seenStatus
        };

        // Notifica os participantes
        for (const participantId of uniqueRecipients) {
            this.messageGateway.sendMessage(participantId, chatPayload);
        }

        console.log('Enviando para:', participants);
        console.log('Autor que excluiu:', deletedMessage.authorId);

        return deletedMessage;
    }

    // Verifica se uma mensagem existe
    private async checkMessageExist(id: string) {
        const existMessage = await this.prisma.content.findUnique({ where: { id } });
        if (!existMessage) throw new NotFoundException("Messagem não encontrada");
    }
}
