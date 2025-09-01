import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDTO, LoginUserDTO } from '@/contracts/user.dto';
import { PrismaService } from './prisma.service';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnvService } from '@/env/env.service';
import { AuthService } from '@/auth/auth.service';
import { MessageGateway } from '@/gateway/message.gateway';

@Injectable()
export class UserService {
  constructor(
    private jwt: JwtService, // Serviço para geração de tokens JWT
    private prisma: PrismaService, // Serviço para operações no banco via Prisma
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private config: EnvService,
    private authService: AuthService,
    private readonly userGateway: MessageGateway,
  ) {}

  // Criação de um novo usuário
  async create(createUserDto: CreateUserDTO) {
    const { name, email, birth, password, passwordConfirmation } =
      createUserDto;

    // Verifica se já existe usuário com o mesmo email
    const existUser = await this.prisma.user.findUnique({ where: { email } });
    if (existUser) throw new ConflictException('Esse usuario já existe');

    // Verifica se as senhas coincidem
    if (password !== passwordConfirmation)
      throw new ConflictException('As senhas precisam ser iguais');

    // Gera hash da senha
    const hashPassword = await hash(password, 8);

    // Cria objeto para inserção
    const newUser = {
      name,
      email,
      birth,
      password: hashPassword,
    };

    // Cria o usuário no banco
    return await this.prisma.user.create({ data: newUser });
  }

  // Finaliza o registro de um usuário autenticado via OAuth
  async finishregisterOAuthUser(user: CreateUserDTO) {
    const { email, birth, name, provider } = user;

    const existUser = await this.prisma.user.findUnique({ where: { email } });

    const updateUser = await this.prisma.user.update({
      where: { id: existUser?.id },
      data: {
        email,
        birth,
        name,
        provider,
      },
    });

    const tokens = await this.authService.generateTokens(
      updateUser.id.toString(),
    );

    return tokens;
  }

  // Login tradicional com email e senha
  async login(user: LoginUserDTO) {
    const { email, password } = user;

    const existUser = await this.prisma.user.findUnique({
      where: { email },
      include: { Chat: true },
    });
    if (!existUser || !existUser.password) {
      throw new UnauthorizedException('Senha ou email incorretos');
    }

    const checkPassword = await compare(password, existUser.password);
    if (!checkPassword) {
      throw new UnauthorizedException('Senha ou email incorretos');
    }

    // Atualiza UserStatus para true
    await this.prisma.user.update({
      where: { id: existUser.id },
      data: { UserStatus: true },
    });

    // Cria lista de todos os participantes
    const newRecipients =
      existUser.Chat?.flatMap((chat) => chat.participantIds ?? []) ?? [];

    // Envia atualização de status para todos os participantes
    for (const recipientId of newRecipients) {
      this.userGateway.sendUser(recipientId, {
        userId: existUser.id,
        userStatus: true,
      });
    }

    const tokens = await this.authService.generateTokens(
      existUser.id.toString(),
    );
    return tokens;
  }

  async logout(user: { sub: string }) {
    // Busca o usuário e seus chats
    const existUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { Chat: true },
    });

    if (!existUser) {
      throw new NotFoundException(`User with id ${user.sub} not found.`);
    }

    // Atualiza o status do usuário
    await this.prisma.user.update({
      where: { id: user.sub },
      data: { UserStatus: false },
    });

    // Pega o primeiro createId de algum chat, se existir
    const userCreateId = existUser.Chat?.find(
      (chat) => chat.createId,
    )?.createId;

    // Cria lista de todos os participantes
    const newRecipients =
      existUser.Chat?.flatMap((chat) => chat.participantIds ?? []) ?? [];

    // Envia atualização de status para todos os participantes
    for (const recipientId of newRecipients) {
      this.userGateway.sendUser(recipientId, {
        userId: existUser.id,
        userStatus: false,
      });
    }

    return { message: 'User logged out successfully', userId: userCreateId };
  }

  // Login via OAuth (Google, etc.)
  async oauthLogin(profile: { email: string; name: string }) {
    const existUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!existUser) {
      const userData = {
        email: profile.email,
        name: profile.name,
        birth: '',
        provider: 'google',
      };

      const user = await this.prisma.user.create({ data: userData });

      const tokens = await this.authService.generateTokens(user.id.toString());
      return { ...tokens, user, newUser: true };
    }

    const tokens = await this.authService.generateTokens(
      existUser.id.toString(),
    );
    return tokens;
  }

  // Retorna lista de todos os usuários exceto o logado
  async findUsers(user: { sub: string }, search?: string) {
    const existUsers = await this.prisma.user.findMany({
      where: {
        id: { not: user.sub },
        ...(search &&
          search.trim() !== '' && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        UserStatus: true,
      },
    });

    return existUsers;
  }

  // Retorna dados do usuário logado
  async findOne(user: { sub: string }) {
    const userId = user.sub;

    // Busca o usuário, omitindo a senha
    const existUser = await this.prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        UserStatus: true,
      },
      where: { id: userId },
    });

    if (!existUser) throw new ConflictException('Usuario não encontrado');

    return existUser;
  }

  // Remove o usuário do sistema
  async removeUser(user: { sub: string }) {
    // Busca todos os chats que ele participa
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { id: user.sub } } },
      include: { participants: true },
    });

    // Processa cada chat
    for (const chat of chats) {
      if (chat.participants.length > 2) {
        // Em chats com mais de 2 participantes: apenas remove o usuário
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: { participants: { disconnect: { id: user.sub } } },
        });
      } else {
        // Em chats com 2 ou menos: desativa o chat
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: { active: false },
        });
      }
    }

    // Finalmente, exclui o usuário
    await this.prisma.user.delete({ where: { id: user.sub } });

    return { message: 'Usuario deletado com sucesso' };
  }
}
