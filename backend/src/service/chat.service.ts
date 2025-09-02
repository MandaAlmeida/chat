import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateChatDTO,
  CreateGroupDTO,
  UpdateGroupChatDTO,
} from '@/contracts/chat.dto';
import { SeenStatus, Status, TypeChat } from '@prisma/client';
import { MessageGateway } from '@/gateway/message.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService, // Serviço para interagir com o banco via Prisma
    private readonly chatGateway: MessageGateway, // Gateway para enviar mensagens em tempo real via WebSocket
  ) {}

  // Busca um chat entre dois usuários
  async findBetweenUsers(user: { sub: string }, createChat: CreateChatDTO) {
    const userId = createChat.participant;

    const chat = await this.prisma.chat.findFirst({
      where: {
        type: 'INDIVIDUAL',
        OR: [
          { createId: user.sub, participantIds: { has: userId } },
          { createId: userId, participantIds: { has: user.sub } },
        ],
      },
      include: { DeletedChat: true, participants: true, Content: true },
    });

    if (!chat) return null;

    // Corrigido: evita erro se DeletedChat estiver vazio
    if (chat.DeletedChat?.[0]?.active) {
      await this.prisma.deletedChat.update({
        where: { id: chat.DeletedChat[0].id },
        data: { active: false },
      });

      const systemMessage = await this.prisma.content.create({
        data: {
          type: 'SYSTEM',
          chatId: chat.id,
          authorId: user.sub,
          message: 'entrou no chat',
          status: Status.USER,
          seenStatus: SeenStatus.USER,
        },
      });

      const chatPayload = {
        id: systemMessage.id,
        sender: systemMessage.authorId,
        content: systemMessage.message,
        chatId: systemMessage.chatId,
        timestamp: systemMessage.createdAt,
        status: systemMessage.status,
        seenStatus: systemMessage.seenStatus,
        type: 'SYSTEM',
      };

      const recipients = new Set([...chat.participantIds, chat.createId]);
      for (const recipientId of recipients) {
        this.chatGateway.sendMessage(recipientId, chatPayload);
      }
    }

    return chat;
  }

  // Cria um chat individual
  async createChat(user: { sub: string }, createChat: CreateChatDTO) {
    const { name, participant } = createChat;

    // Valida se usuário existe
    const existUser = await this.prisma.user.findUnique({
      where: { id: participant },
    });

    if (!existUser) throw new NotFoundException('Usuário não encontrado');

    // Cria o chat no banco
    const newChat = await this.prisma.chat.create({
      data: {
        name,
        createId: user.sub,
        active: true,
        type: TypeChat.INDIVIDUAL,
        participantIds: [participant],
        participants: { connect: [{ id: participant }] },
      },
      include: { DeletedChat: true, participants: true, Content: true },
    });

    // Payload para notificar participantes
    const chatPayload = {
      id: newChat.id,
      sender: newChat.createId,
      timestamp: newChat.createdAt,
      name: newChat.name,
      type: newChat.type,
      participants: newChat.participantIds,
    };

    const newRecipients = new Set([...newChat.participantIds, user.sub]);

    // Envia notificação via gateway
    for (const userId of newRecipients) {
      this.chatGateway.sendChat(userId, chatPayload);
    }

    return newChat;
  }

  // Cria um chat em grupo
  async createGroupChat(userId: { sub: string }, createGroup: CreateGroupDTO) {
    const { name, participants } = createGroup;

    // Impede criar grupo com si mesmo
    if (participants.includes(userId.sub)) {
      throw new NotFoundException(
        'Você não pode criar chat com seu próprio usuário',
      );
    }

    const newChat = await this.prisma.chat.create({
      data: {
        name,
        createId: userId.sub,
        active: true,
        type: TypeChat.GROUP,
        participantIds: participants,
        participants: {
          connect: participants.map((participantId) => ({ id: participantId })),
        },
      },
    });

    const chatPayload = {
      id: newChat.id,
      sender: newChat.createId,
      timestamp: newChat.createdAt,
      name: newChat.name,
      type: newChat.type,
      participants: newChat.participantIds,
    };

    const newRecipients = new Set([...newChat.participantIds, userId.sub]);

    // Notifica todos os membros
    for (const userId of newRecipients) {
      this.chatGateway.sendChat(userId, chatPayload);
    }

    return newChat;
  }

  // Lista todos os chats do usuário, exceto os deletados
  async findChats(user: { sub: string }, search?: string) {
    // Busca todos os chats ativos em que o usuário é criador ou participante
    const allChats = await this.prisma.chat.findMany({
      where: {
        active: true,
        OR: [
          { createId: user.sub },
          { participants: { some: { id: user.sub } } },
        ],
      },
      include: { participants: true },
    });

    // Busca chats que o usuário deletou
    const deletedChats = await this.prisma.deletedChat.findMany({
      where: { userId: user.sub, active: true },
      select: { chatId: true },
    });

    const deletedChatIds = deletedChats.map((dc) => dc.chatId);

    // Filtra os chats excluídos
    let chats = allChats.filter((chat) => !deletedChatIds.includes(chat.id));

    // Se houver termo de busca, aplica filtro adicional
    if (search) {
      const searchLower = search.toLowerCase();
      chats = chats.filter((chat) => {
        const nameMatches = chat.name.toLowerCase().includes(searchLower);

        return nameMatches;
      });
    }

    return chats;
  }

  // Atualiza informações de um chat em grupo
  async updateGroupChat(id: string, updateGroup: UpdateGroupChatDTO) {
    const { name, participants } = updateGroup;

    await this.checkChatExist(id); // Valida existência

    return await this.prisma.chat.update({
      where: { id },
      data: {
        name,
        participants: {
          connect: participants.map((participantId) => ({ id: participantId })),
        },
      },
    });
  }

  // Remove participantes de um grupo
  async removeParticipantsByGroup(id: string, participants: string[]) {
    await this.checkChatExist(id);
    const deleteChat = await this.prisma.chat.update({
      where: { id },
      data: {
        participants: {
          disconnect: participants.map((participantId) => ({
            id: participantId,
          })),
        },
      },
    });

    const allUserIds = new Set([
      ...deleteChat.participantIds,
      deleteChat.createId,
    ]);

    // Verifica se todos saíram do grupo
    const deletedChats = await this.prisma.deletedChat.findMany({
      where: { chatId: id },
    });

    const deletedUserIds = new Set(deletedChats.map((dc) => dc.userId));

    const allLeft = Array.from(allUserIds).every((id) =>
      deletedUserIds.has(id),
    );

    // Se todos saíram, desativa o chat
    if (allLeft) {
      await this.prisma.chat.update({
        where: { id },
        data: { active: false },
      });
    }

    const payload = {
      type: 'SYSTEM',
      chatId: deleteChat.id,
      userId: participants,
      message: 'saiu do chat',
      timestamp: new Date().toISOString(),
    };

    const newRecipients = new Set([
      ...deleteChat.participantIds,
      deleteChat.createId,
    ]);

    // Notifica os demais membros
    for (const userId of newRecipients) {
      this.chatGateway.sendMessage(userId, payload);
    }
    return deleteChat;
  }

  // Deleta o chat apenas para o usuário (soft delete)
  async deleteChatForUser(userId: { sub: string }, chatId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException('Chat não encontrado');

    // Verifica se já há uma exclusão marcada
    const existingDeleted = await this.prisma.deletedChat.findUnique({
      where: { userId_chatId: { userId: userId.sub, chatId: chatId } },
    });

    if (existingDeleted) {
      await this.prisma.deletedChat.update({
        where: { id: existingDeleted.id },
        data: { active: true },
      });
    } else {
      await this.prisma.deletedChat.create({
        data: { userId: userId.sub, chatId: chatId, active: true },
      });
    }

    const allUserIds = new Set([...chat.participantIds, chat.createId]);

    const deletedChats = await this.prisma.deletedChat.findMany({
      where: { chatId, active: true },
    });

    const deletedUserIds = new Set(deletedChats.map((dc) => dc.userId));

    const allLeft = Array.from(allUserIds).every((id) =>
      deletedUserIds.has(id),
    );

    // Se todos saíram, desativa o chat
    if (allLeft) {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { active: false, updatedAt: new Date() },
      });
    }

    // Cria mensagem de sistema informando saída
    const message = {
      type: 'SYSTEM',
      chatId: chat.id,
      authorId: userId.sub,
      message: 'saiu do chat',
      status: Status.USER,
      seenStatus: SeenStatus.USER,
    };

    const newMessage = await this.prisma.content.create({ data: message });

    const chatPayload = {
      id: newMessage.id,
      sender: newMessage.authorId,
      content: 'saiu do chat',
      chatId: newMessage.chatId,
      timestamp: newMessage.createdAt,
      status: newMessage.status,
      seenStatus: newMessage.seenStatus,
      type: 'SYSTEM',
    };

    const newRecipients = new Set([...chat.participantIds, chat.createId]);

    // Notifica todos
    for (const recipientId of newRecipients) {
      this.chatGateway.sendMessage(recipientId, chatPayload);
    }

    return chat;
  }

  // Valida existência do chat
  private async checkChatExist(id: string) {
    const existChat = await this.prisma.chat.findUnique({ where: { id } });

    if (!existChat) throw new NotFoundException('Chat não encontrado');
  }
}
