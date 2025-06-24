import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from "@/service/prisma.service";
import { UserService } from "@/service/user.service"
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => Promise.resolve('hashPassword')),
}))

describe('UserService', () => {
    let service: UserService;
    let prisma: PrismaService;
    let jwt: JwtService;

    jest.mock('bcryptjs', () => ({
        compare: jest.fn(),
    }));

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: {
                        chat: {
                            findMany: jest.fn(),
                            update: jest.fn(),
                        },
                        user: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            delete: jest.fn()
                        }
                    }
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(() => 'fake-token'), // você pode mockar o que for necessário
                        verify: jest.fn(),
                    },
                },
            ]
        }).compile();

        service = module.get<UserService>(UserService);
        jwt = module.get<JwtService>(JwtService);
        prisma = module.get<PrismaService>(PrismaService);

    });

    const createUserDto = {
        name: "John Doe",
        email: "john@example.com",
        birth: new Date("1990-01-01").toString(),
        provider: "jwt",
        password: "123456",
        passwordConfirmation: "123456",
    }

    const mockUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        birth: new Date("1990-01-01").toString(),
    };

    const userDto = {
        email: "john@example.com",
        password: "123456"
    }

    // Create user
    it("deve criar um novo usuario com sucesso", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({
            id: 1,
            ...createUserDto,
            password: 'hashPassword',
        });

        const result = await service.create(createUserDto);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                birth: createUserDto.birth,

                password: 'hashPassword',
            }
        });
        expect(result).toHaveProperty("id");
    });

    it("deve lançar exceções se o usuário já existir", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: createUserDto.email });

        await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it("deve lançar exceções se as senhas fortem diferentes", async () => {
        await expect(service.create({ ...createUserDto, passwordConfirmation: "errada" })).rejects.toThrow(ConflictException)
    });

    // Login
    it("deve lançar UnauthorizedException se usuario nao existir", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it("deve lançar UnauthorizedException se a senha estiver diferente", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: userDto.email, password: 'hashed-pass' });

        (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

        await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it("deve retornar token se login for bem sucedido", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: userDto.email, password: userDto.password })

        jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

        const result = await service.login(userDto);

        expect(result).toEqual({ token: 'fake-token' });
        expect(jwt.sign).toHaveBeenCalledWith({ sub: "1" });
    });

    //Buscar usuario
    it("deve retornar a lista de usúarios exceto o logado", async () => {
        (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUser);

        const result = await service.findAll({ sub: "2" });

        expect(result).toEqual(mockUser);

        expect(prisma.user.findMany).toHaveBeenCalledWith({
            where: { id: { not: "2" } },
            select: {
                id: true,
                name: true,
                UserStatus: {
                    select: {
                        isOnline: true,
                        lastSeen: true
                    }
                }
            }
        })
    });

    it("deve retornar o usuario logado", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        const result = await service.findOne({ sub: mockUser.id });

        expect(result).toEqual(mockUser);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: mockUser.id },
            select: {
                id: true,
                name: true,
                email: true
            }
        })
    });

    it("deve lancar excecao se nenhum usuario for encontrado", async () => {
        (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

        await expect(service.findAll({ sub: '1' })).rejects.toThrow(ConflictException);
    })

    it("deve lancar excecao se o usuario nao for encontrado", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(service.findOne({ sub: '1' })).rejects.toThrow(ConflictException);
    })

    // Excluir usuario
    it("deve excluir o usuario selecionado", async () => {

        const mockChats = [{
            id: "1",
            participants: [{ id: mockUser.id }, { id: "2" }]
        },
        {
            id: "2",
            participants: [{ id: mockUser.id }, { id: "2" }, { id: " 3" }]
        },
        ];

        (prisma.chat.findMany as jest.Mock).mockResolvedValue(mockChats);
        (prisma.chat.update as jest.Mock).mockResolvedValue({});
        (prisma.user.delete as jest.Mock).mockResolvedValue({});

        const result = await service.removeUser({ sub: mockUser.id });

        expect(result).toEqual({ message: 'Usuario deletado com sucesso' });
        expect(prisma.chat.findMany).toHaveBeenCalledWith({
            where: { participants: { some: { id: mockUser.id } } },
            include: { participants: true }
        })
        expect(prisma.chat.update).toHaveBeenCalledWith({
            where: { id: "1" },
            data: { active: false }
        });
        expect(prisma.chat.update).toHaveBeenCalledWith({
            where: { id: "2" },
            data: { participants: { disconnect: { id: mockUser.id } } }
        });
        expect(prisma.user.delete).toHaveBeenCalledWith({
            where: { id: mockUser.id }
        });
    })
})