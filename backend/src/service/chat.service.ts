import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateChatDTO, UpdateGroupChatDTO } from 'src/contracts/chat.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async findBetweenUsers(user: { sub: string }, userId: string) {
        return this.prisma.chat.findFirst({
            where: {
                OR: [
                    { createId: user.sub, participants: { some: { id: userId } } },
                    { createId: userId, participants: { some: { id: user.sub } } }
                ]
            }
        });
    }


    async createChat(user: { sub: string }, userId: string) {
        const existUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existUser) throw new NotFoundException('Usuário não encontrado');

        return this.prisma.chat.create({
            data: {
                name: existUser.name,
                createId: user.sub,
                active: true,
                participants: {
                    connect: [{ id: userId }]
                }
            }
        });
    }

    async createGroupChat(userId: { sub: string }, createGroup: CreateChatDTO) {
        const { name, participants } = createGroup

        return this.prisma.chat.create({
            data: {
                name,
                createId: userId.sub,
                active: true,
                participants: {
                    connect: participants.map(participantId => ({ id: participantId }))
                }
            }
        });
    }

    async findChat(userId: { sub: string }) {
        console.log(userId.sub)

        return this.prisma.chat.findMany({
            where: {
                OR: [{ createId: userId.sub, participants: { some: { id: userId.sub } } }]
            }
        });
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

