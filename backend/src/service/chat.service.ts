import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateChatDTO, CreateGroupDTO, UpdateGroupChatDTO } from 'src/contracts/chat.dto';
import { TypeChat } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async findBetweenUsers(user: { sub: string }, createChat: CreateChatDTO) {
        const userId = createChat.participant

        const chats = await this.prisma.chat.findFirst({
            where: {
                OR: [
                    { createId: user.sub, participants: { some: { id: userId } } },
                    { createId: userId, participants: { some: { id: user.sub } } }
                ]
            }
        });

        if (chats?.type === "GROUP") return;

        return chats
    }


    async createChat(user: { sub: string }, createChat: CreateChatDTO) {
        const { name, participant } = createChat;

        const existUser = await this.prisma.user.findUnique({
            where: { id: participant },
        });

        if (!existUser) throw new NotFoundException('Usuário não encontrado');

        return await this.prisma.chat.create({
            data: {
                name,
                createId: user.sub,
                active: true,
                type: TypeChat.INDIVIDUAL,
                participants: {
                    connect: [{ id: participant }]
                }
            }
        });
    }

    async createGroupChat(userId: { sub: string }, createGroup: CreateGroupDTO) {
        const { name, participants } = createGroup

        const userParticipant = participants.map(participant => participant === userId.sub)

        if (!userParticipant) throw new NotFoundException('Você não pode criar chat com seu usuário');

        return await this.prisma.chat.create({
            data: {
                name,
                createId: userId.sub,
                active: true,
                type: TypeChat.GROUP,
                participants: {
                    connect: participants.map(participantId => ({ id: participantId }))
                }
            }
        });
    }

    async findChat(userId: { sub: string }) {
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [
                    { createId: userId.sub },
                    { participants: { some: { id: userId.sub } } }
                ]
            },
            include: {
                participants: true
            }
        });

        return chats
    }


    async updateGroupChat(id: string, updateGroup: UpdateGroupChatDTO) {
        const { name, participants } = updateGroup
        await this.checkChatExist(id)

        return await this.prisma.chat.update({
            where: { id },
            data: {
                name,
                participants: {
                    connect: participants.map(participantId => ({ id: participantId }))
                }
            }
        });
    }

    async removeParticipantsByGroup(id: string, participants: string[]) {
        await this.checkChatExist(id)

        return await this.prisma.chat.update({
            where: { id },
            data: {
                participants: {
                    disconnect: participants.map(participantId => ({ id: participantId }))
                }
            }
        });
    }

    async deleteChatForUser(userId: { sub: string }, chatId: string) {
        await this.prisma.chat.update({
            where: { id: chatId },
            data: {
                deletedFor: { push: userId.sub }
            }
        });
    }

    private async checkChatExist(id: string) {
        const existChat = await this.prisma.chat.findUnique({ where: { id } });

        if (!existChat) throw new NotFoundException("Chat não encontrada")
    }
}

