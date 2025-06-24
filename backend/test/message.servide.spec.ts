import { MessageGateway } from "@/gateway/message.gateway";
import { MessageService } from "@/service/message.service"
import { PrismaService } from "@/service/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SeenStatus, Status } from "@prisma/client";
import { create } from "domain";

describe("MessageService", () => {
    let service: MessageService;
    let prisma: PrismaService;
    let gateway: MessageGateway;


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessageService,
                {
                    provide: PrismaService,
                    useValue: {
                        content: {
                            create: jest.fn(),
                            update: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn(),
                            findFirst: jest.fn(),
                            findUnique: jest.fn()
                        },
                        chat: {
                            findUnique: jest.fn()
                        },
                        deletedChat: {
                            findUnique: jest.fn()
                        }
                    }
                },
                {
                    provide: MessageGateway,
                    useValue: {
                        sendMessage: jest.fn(),
                    }
                }
            ]
        }).compile();

        service = module.get<MessageService>(MessageService);
        prisma = module.get<PrismaService>(PrismaService);
        gateway = module.get<MessageGateway>(MessageGateway);
    });

    const user = { sub: "1" };
    const chatId = "1";
    const contentId = "1";

    //criar mensagem
    it("deve enviar uma mensagem e noticar os participantes", async () => {
        const message = {
            message: "Ola",
            chatId,
            recipients: ["2"]
        };

        const createdMessage = {
            id: contentId,
            message: message.message,
            authorId: user.sub,
            chatId,
            createdAt: new Date(),
            seenStatus: SeenStatus.SENT
        };

        (prisma.content.create as jest.Mock).mockResolvedValue(createdMessage);

        const result = await service.sendMessage(user, message);

        expect(gateway.sendMessage).toHaveBeenCalledTimes(2);
        expect(result).toEqual(createdMessage);
    });

    //Busca a mensagem
    it('deve retornar mensagens de um chat ativo', async () => {
        (prisma.chat.findUnique as jest.Mock).mockResolvedValue({ id: chatId });
        (prisma.deletedChat.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.content.findMany as jest.Mock).mockResolvedValue([{ id: contentId, chatId }]);

        const result = await service.findMessage(user, chatId);
        expect(result).toHaveLength(1);
    });

    it('deve lançar exceção se chat não existir', async () => {
        (prisma.chat.findUnique as jest.Mock).mockResolvedValue(null);
        await expect(service.findMessage(user, chatId)).rejects.toThrow(NotFoundException);
    });

    it('deve retornar [] se chat foi deletado e ainda está inativo', async () => {
        (prisma.chat.findUnique as jest.Mock).mockResolvedValue({ id: chatId });
        (prisma.deletedChat.findUnique as jest.Mock).mockResolvedValue({ active: true });

        const result = await service.findMessage(user, chatId);
        expect(result).toEqual([]);
    });

    //Atualiza a mensagem
    it('deve atualizar o conteúdo da mensagem e notificar os membros', async () => {
        (prisma.content.findUnique as jest.Mock).mockResolvedValue({ id: contentId });
        (prisma.content.update as jest.Mock).mockResolvedValue({
            id: contentId,
            chatId,
            message: 'editado',
            authorId: user.sub,
            createdAt: new Date(),
            status: Status.EDITED,
            seenStatus: SeenStatus.SENT
        });

        (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
            id: chatId,
            createId: 'user-2',
            participantIds: ['user-3']
        });

        await service.updateMessage(contentId, 'editado');

        expect(prisma.content.update).toHaveBeenCalled();
        expect(gateway.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('deve atualizar o conteúdo da mensagem e notificar os membros', async () => {
        (prisma.content.findUnique as jest.Mock).mockResolvedValue({ id: contentId });
        (prisma.content.update as jest.Mock).mockResolvedValue({
            id: contentId,
            chatId,
            message: 'editado',
            authorId: user.sub,
            createdAt: new Date(),
            status: Status.EDITED,
            seenStatus: SeenStatus.SENT
        });

        (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
            id: chatId,
            createId: 'user-2',
            participantIds: ['user-3']
        });

        await service.updateMessage(contentId, 'editado');

        expect(prisma.content.update).toHaveBeenCalled();
        expect(gateway.sendMessage).toHaveBeenCalledTimes(2);
    });

    // deleta a mensagem
    it('deve marcar a mensagem como deletada e notificar os participantes', async () => {
        (prisma.content.findUnique as jest.Mock).mockResolvedValue({ id: contentId });
        (prisma.content.update as jest.Mock).mockResolvedValue({
            id: contentId,
            chatId,
            authorId: user.sub,
            createdAt: new Date(),
            status: Status.DELETE,
            seenStatus: SeenStatus.SEEN
        });
        (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
            id: chatId,
            createId: 'user-2',
            participantIds: ['user-3']
        });

        const result = await service.deleteMessage(contentId);

        expect(prisma.content.update).toHaveBeenCalled();
        expect(gateway.sendMessage).toHaveBeenCalledTimes(2);
        expect(result.status).toEqual(Status.DELETE);
    });
})