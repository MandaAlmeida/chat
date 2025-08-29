import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDTO, UpdateMessageDTO } from '@/contracts/message.dto';
import { PrismaService } from './prisma.service';
import { Status, SeenStatus, $Enums, Content } from '@prisma/client';
import { MessageGateway } from '@/gateway/message.gateway';
import { stat } from 'fs';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService, // Serviço do Prisma para interagir com o banco de dados
    private readonly messageGateway: MessageGateway, // Gateway para comunicação em tempo real via WebSocket
  ) {}

  // Envia uma nova mensagem
  async sendMessage(user: { sub: string }, newMessage: CreateMessageDTO) {
    const { message, chatId, recipients } = newMessage;

    // Busca o chat com DeletedChat incluso
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { DeletedChat: true },
    });

    if (!chat) throw new NotFoundException(`Chat não encontrado`);

    const newRecipients = new Set([...recipients, user.sub]);

    // Verifica se é chat individual e se foi deletado
    const deletedRecord = chat.DeletedChat?.[0]; // pode ser undefined
    if (
      deletedRecord &&
      deletedRecord.active === true &&
      chat.type === 'INDIVIDUAL'
    ) {
      // Reativa o chat
      await this.prisma.deletedChat.update({
        where: { id: deletedRecord.id },
        data: { active: false },
      });

      // Payload para notificar participantes
      const chatPayload = {
        id: chat.id,
        authorId: chat.createId,
        timestamp: chat.createdAt,
        name: chat.name,
        type: chat.type,
        participants: chat.participantIds,
      };

      for (const userId of newRecipients) {
        this.messageGateway.sendChat(userId, chatPayload);
      }
    }

    // Cria a mensagem real do usuário
    const createdMessage = await this.prisma.content.create({
      data: {
        message,
        authorId: user.sub,
        chatId,
      },
    });

    // Payload da mensagem
    const messagePayload = {
      id: createdMessage.id,
      authorId: user.sub,
      content: message,
      chatId: chatId,
      timestamp: createdMessage.createdAt,
      seenStatus: createdMessage.seenStatus,
      status: createdMessage.status,
    };

    // Envia para todos
    for (const userId of newRecipients) {
      this.messageGateway.sendMessage(userId, messagePayload);
    }

    return createdMessage;
  }

  // Busca mensagens de um chat específico
  async findMessage(user: { sub: string }, chatId: string) {
    // Verifica se o chat existe
    const existChat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!existChat) throw new NotFoundException(`Chat não encontrado`);

    // Verifica se o usuário deletou o chat
    const deletedChat = await this.prisma.deletedChat.findUnique({
      where: {
        userId_chatId: {
          userId: user.sub,
          chatId: chatId,
        },
      },
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
      orderBy: { createdAt: 'asc' },
    });

    return mensagens;
  }

  // Busca a  ultima mensagem de um chat específico
  async findLastMessagesForChats(user: { sub: string }, chatIds: string[]) {
    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        // Verifica se o chat existe
        const existChat = await this.prisma.chat.findUnique({
          where: { id: chatId },
        });
        if (!existChat) return null;

        // Verifica se o usuário deletou o chat
        const deletedChat = await this.prisma.deletedChat.findUnique({
          where: {
            userId_chatId: {
              userId: user.sub,
              chatId: chatId,
            },
          },
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
      }),
    );
    const filtered: Content[] = results.filter(
      (msg): msg is Content => msg !== null,
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
        status: Status.EDITED,
      },
    });

    // Busca o chat relacionado à mensagem
    const chat = await this.prisma.chat.findUnique({
      where: { id: newMessage.chatId },
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');

    // Lista de participantes que devem ser notificados (exclui autor da edição)
    const participants = [...(chat.participantIds ?? []), chat.createId];
    const newRecipients = new Set(
      participants.filter((userId) => userId !== newMessage.authorId),
    );

    // Envia atualização para os participantes
    const chatPayload = {
      id: newMessage.id,
      sender: newMessage.authorId,
      content: message,
      chatId: newMessage.chatId,
      timestamp: newMessage.createdAt,
      status: newMessage.status,
      seenStatus: newMessage.seenStatus,
    };

    for (const userId of newRecipients) {
      this.messageGateway.sendMessage(userId, chatPayload);
    }
  }

  // Marca mensagens como visualizadas
  async viewMessage(ids: string[]) {
    if (!ids.length) return;

    // Atualiza o status de visualização das mensagens que estão como SENT, exceto deletadas
    await this.prisma.content.updateMany({
      where: {
        id: { in: ids },
      },
      data: { seenStatus: SeenStatus.SEEN },
    });

    // Busca as mensagens atualizadas
    const messages = await this.prisma.content.findMany({
      where: {
        id: { in: ids },
      },
    });

    // Notifica os participantes do chat sobre a atualização
    for (const msg of messages) {
      const payload = {
        id: msg.id,
        chatId: msg.chatId,
        seenStatus: SeenStatus.SEEN,
        status: msg.status,
      };

      const chat = await this.prisma.chat.findUnique({
        where: { id: msg.chatId },
      });

      const participants = [
        ...(chat?.participantIds ?? []),
        chat?.createId,
      ].filter(Boolean) as string[];

      for (const participant of participants) {
        this.messageGateway.sendMessage(participant, payload);
      }
    }
  }

  // Exclui uma mensagem (soft delete)
  async deleteMessage(ids: string[] | string) {
    const idsArray =
      typeof ids === 'string' ? ids.split(',').map((id) => id.trim()) : ids;

    await this.checkMessagesExists(idsArray);

    // Marca as mensagens como excluídas
    await this.prisma.content.updateMany({
      where: { id: { in: idsArray } },
      data: { status: Status.DELETE, message: 'Mensagem excluída' },
    });

    // Busca as mensagens atualizadas
    const updatedMessages = await this.prisma.content.findMany({
      where: { id: { in: idsArray } },
    });

    for (const deletedMessage of updatedMessages) {
      const chat = await this.prisma.chat.findUnique({
        where: { id: deletedMessage.chatId },
      });
      if (!chat) throw new NotFoundException('Chat não encontrado');

      const participants = [...(chat.participantIds ?? []), chat.createId];
      const uniqueRecipients = new Set(participants);

      const payload = {
        ...deletedMessage,
        content: 'Mensagem excluída',
      };

      // Envia via WebSocket para todos os participantes
      for (const userId of uniqueRecipients) {
        this.messageGateway.sendMessage(userId, payload);
      }
    }

    return updatedMessages;
  }

  // Verifica se uma mensagem existe
  private async checkMessageExist(id: string) {
    const existMessage = await this.prisma.content.findUnique({
      where: { id },
    });
    if (!existMessage) throw new NotFoundException('Mensagem não encontrada');
  }

  private async checkMessagesExists(ids: string | string[]) {
    // Se receber uma string com IDs separados por vírgula, transforma em array
    const idsArray =
      typeof ids === 'string' ? ids.split(',').map((id) => id.trim()) : ids;

    const existMessages = await this.prisma.content.findMany({
      where: {
        id: {
          in: idsArray,
        },
      },
    });

    if (existMessages.length === 0)
      throw new NotFoundException('Nenhuma mensagem encontrada');

    return existMessages;
  }
}
