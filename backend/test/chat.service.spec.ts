import { MessageGateway } from "@/gateway/message.gateway";
import { ChatService } from "@/service/chat.service";
import { PrismaService } from "@/service/prisma.service";
import { Test, TestingModule } from "@nestjs/testing";
import { connect } from "http2";

describe('ChatService', () => {
    let service: ChatService;
    let prisma: PrismaService;
    let gateway: MessageGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                {
                    provide: PrismaService,
                    useValue: {
                        chat: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                            create: jest.fn(),
                            findFirst: jest.fn()
                        },
                        user: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                        },
                        deletedChat: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                            findFirst: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn()
                        },
                        content: {
                            create: jest.fn()
                        }
                    }
                },
                {
                    provide: MessageGateway,
                    useValue: {
                        sendChat: jest.fn(),
                        sendMessage: jest.fn(),

                    }
                }
            ]
        }).compile();

        service = module.get<ChatService>(ChatService);
        prisma = module.get<PrismaService>(PrismaService);
        gateway = module.get<MessageGateway>(MessageGateway)

    });

    const user = { sub: "1" };

    const createChatDto = {
        name: "Chat Teste",
        participant: "2"
    };

    const createGroupDto = {
        name: "Grupo Teste",
        participants: ["2", "3"]
    };

    const mockUser = { id: "2", name: "Outro Usuário" };

    const mockChatIndividual = {
        id: "123",
        name: createChatDto.name,
        createId: user.sub,
        active: true,
        type: "INDIVIDUAL",
        participantIds: [createChatDto.participant],
        createdAt: new Date()
    };

    const mockChatGroup = {
        id: "456",
        name: createGroupDto.name,
        createId: user.sub,
        active: true,
        type: "GROUP",
        participantIds: createGroupDto.participants,
        createdAt: new Date()
    };

    const mockMessageStart = {
        id: "msg-1",
        chatId: mockChatIndividual.id,
        authorId: user.sub,
        message: "entrou no chat",
        createdAt: new Date(),
        status: "USER",
        seenStatus: "USER",
    };

    const mockMessageEnd = {
        id: "msg-2",
        chatId: mockChatIndividual.id,
        authorId: user.sub,
        message: "saiu do chat",
        createdAt: new Date(),
        status: "USER",
        seenStatus: "USER"
    };


    // Create Chat
    it("deve criar um chat individual", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.chat.create as jest.Mock).mockResolvedValue(mockChatIndividual);

        const sendChat = jest.spyOn(gateway, "sendChat");

        const result = await service.createChat(user, createChatDto)

        expect(result).toEqual(mockChatIndividual);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "2" } });
        expect(prisma.chat.create).toHaveBeenCalled();
        expect(sendChat).toHaveBeenCalledTimes(2);
    });

    it("deve criar um chat em grupo", async () => {
        (prisma.chat.create as jest.Mock).mockResolvedValue(mockChatGroup);
        const sendChat = jest.spyOn(gateway, "sendChat").mockImplementation(() => { });

        const result = await service.createGroupChat(user, createGroupDto);

        expect(result).toEqual(mockChatGroup);
        expect(prisma.chat.create).toHaveBeenCalled();
        expect(sendChat).toHaveBeenCalledTimes(3);
    });

    // Buscar chats
    it("deve retornar o chat existente entre dois usuários e reativar se estava deletado", async () => {
        (prisma.chat.findFirst as jest.Mock).mockResolvedValue(mockChatIndividual);
        (prisma.deletedChat.findFirst as jest.Mock).mockResolvedValue(mockChatIndividual);
        (prisma.deletedChat.update as jest.Mock).mockResolvedValue({});
        (prisma.content.create as jest.Mock).mockResolvedValue(mockMessageStart);

        const sendMessage = jest.spyOn(gateway, "sendMessage").mockImplementation(() => { });

        const result = await service.findBetweenUsers({ sub: user.sub }, { participant: mockUser.id, name: mockUser.name });

        expect(result).toEqual(mockChatIndividual);
        expect(prisma.deletedChat.update).toHaveBeenCalledWith({
            where: { id: mockChatIndividual.id },
            data: { active: false }
        });
        expect(prisma.content.create).toHaveBeenCalled();
        expect(sendMessage).toHaveBeenCalledTimes(2);
    });

    it("deve retornar todos os chats ativos do usuario", async () => {
        const mockChats = [
            mockChatGroup,
            mockChatIndividual
        ];

        (prisma.chat.findMany as jest.Mock).mockResolvedValue(mockChats);
        (prisma.deletedChat.findMany as jest.Mock).mockResolvedValue([mockChats[0].id]);

        const result = await service.findChat({ sub: mockUser.id });

        expect(result).toEqual(mockChats);
        expect(prisma.chat.findMany).toHaveBeenCalled();
        expect(prisma.deletedChat.findMany).toHaveBeenCalledWith({
            where: { userId: mockUser.id, active: true },
            select: { chatId: true }
        })
    });

    // Atualiza o chat ou grupo
    it("deve atualizar o nome e participantes do grupo", async () => {
        const UpdateGroupDTO = {
            id: mockChatGroup.id,
            name: "Novo nome",
            participants: ["4", "5"]
        };

        const updateGroup = {
            id: mockChatGroup.id,
            name: UpdateGroupDTO.name,
            participants: ["2", "3", "4", "5"]
        };

        (prisma.chat.findUnique as jest.Mock).mockResolvedValue(mockChatGroup);
        (prisma.chat.update as jest.Mock).mockResolvedValue(updateGroup);

        const result = await service.updateGroupChat(UpdateGroupDTO.id, UpdateGroupDTO);

        expect(result).toEqual(updateGroup);
        expect(prisma.chat.update).toHaveBeenCalledWith({
            where: { id: mockChatGroup.id },
            data: {
                name: UpdateGroupDTO.name,
                participants: {
                    connect: UpdateGroupDTO.participants.map(id => ({ id }))
                }
            }
        })
    });

    it("deve remover participantes e desativar o grupo caso todos sairem", async () => {
        const participantsToRemove = ["2", "3"];

        const mockChat = {
            id: mockChatGroup.id,
            name: createGroupDto.name,
            createId: user.sub,
            active: true,
            type: "GROUP",
            participantIds: [],
            createdAt: mockChatGroup.createId
        };

        const mockDeleted = [
            { userId: user.sub }
        ];

        (prisma.chat.findUnique as jest.Mock).mockResolvedValue(mockChatGroup);
        (prisma.chat.update as jest.Mock).mockResolvedValueOnce(mockChat);
        (prisma.deletedChat.findMany as jest.Mock).mockResolvedValueOnce(mockDeleted);
        (prisma.chat.update as jest.Mock).mockResolvedValueOnce({});

        const gatewaySpy = jest.spyOn(gateway, "sendMessage").mockImplementation(() => { });

        const result = await service.removeParticipantsByGroup(mockChatGroup.id, participantsToRemove);


        expect(result).toEqual(mockChat);
        expect(gatewaySpy).toHaveBeenCalled();
    });

    // Remover chat 
    it("deve marcar chat como deletado para o usuario e desativar caso todos sairem", async () => {
        (prisma.chat.findUnique as jest.Mock).mockResolvedValue(mockChatGroup);
        (prisma.deletedChat.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.deletedChat.create as jest.Mock).mockResolvedValue({});
        (prisma.deletedChat.findMany as jest.Mock).mockResolvedValue([
            { userId: user.sub },
            { userId: mockUser.id }
        ]);
        (prisma.chat.update as jest.Mock).mockResolvedValue({});
        (prisma.content.create as jest.Mock).mockResolvedValue(mockMessageEnd);

        const sendMessageSpy = jest.spyOn(gateway, 'sendMessage').mockImplementation(() => { });

        const result = await service.deleteChatForUser(user, mockChatGroup.id);

        expect(result).toEqual(mockChatGroup);
        expect(sendMessageSpy).toHaveBeenCalled();

    })
})