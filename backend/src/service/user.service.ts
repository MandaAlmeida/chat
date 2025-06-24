import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDTO, LoginUserDTO } from '@/contracts/user.dto';
import { PrismaService } from './prisma.service';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private jwt: JwtService,         // Serviço para geração de tokens JWT
    private prisma: PrismaService    // Serviço para operações no banco via Prisma
  ) { }

  // Criação de um novo usuário
  async create(createUserDto: CreateUserDTO) {
    const { name, email, birth, password, passwordConfirmation } = createUserDto;

    // Verifica se já existe usuário com o mesmo email
    const existUser = await this.prisma.user.findUnique({ where: { email } });
    if (existUser) throw new ConflictException("Esse usuario já existe");

    // Verifica se as senhas coincidem
    if (password !== passwordConfirmation) throw new ConflictException("As senhas precisam ser iguais");

    // Gera hash da senha
    const hashPassword = await hash(password, 8);

    // Cria objeto para inserção
    const newUser = {
      name,
      email,
      birth,
      password: hashPassword
    };

    // Cria o usuário no banco
    return await this.prisma.user.create({ data: newUser });
  }

  // Finaliza o registro de um usuário autenticado via OAuth
  async finishregisterOAuthUser(user: CreateUserDTO) {
    const { email, birth, name, provider } = user;

    // Busca usuário pelo email
    const existUser = await this.prisma.user.findUnique({ where: { email } });

    // Atualiza os dados do usuário com informações complementares
    const updateUser = await this.prisma.user.update({
      where: { id: existUser?.id },
      data: {
        email,
        birth,
        name,
        provider,
      },
    });

    // Gera token JWT
    const accessToken = this.jwt.sign({ sub: updateUser.id.toString() });
    return accessToken;
  }

  // Login tradicional com email e senha
  async login(user: LoginUserDTO) {
    const { email, password } = user;

    // Busca usuário pelo email
    const existUser = await this.prisma.user.findUnique({ where: { email } });
    if (!existUser || !existUser.password) throw new UnauthorizedException("Senha ou email incorretos");

    // Compara senhas
    const checkPassword = await compare(password, existUser.password);
    if (!checkPassword) throw new UnauthorizedException("Senha ou email incorretos");

    // Gera token de acesso
    const accessToken = this.jwt.sign({ sub: existUser.id.toString() });
    return { token: accessToken };
  }

  // Login via OAuth (Google, etc.)
  async oauthLogin(profile: { email: string; name: string }) {
    // Verifica se o usuário já existe
    const existUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!existUser) {
      // Cria novo usuário caso não exista
      const userData = {
        email: profile.email,
        name: profile.name,
        birth: "",
        provider: 'google',
      };

      const user = await this.prisma.user.create({ data: userData });

      // Gera token de acesso
      const accessToken = this.jwt.sign({ sub: user.id });
      return { token: accessToken, user, newUser: true };
    }

    // Usuário já existe: retorna token
    const accessToken = this.jwt.sign({ sub: existUser.id });
    return { token: accessToken };
  }

  // Retorna lista de todos os usuários exceto o logado
  async findAll(user: { sub: string }) {
    const existUsers = await this.prisma.user.findMany({
      where: { id: { not: user.sub } },
      select: {
        id: true,
        name: true,
        UserStatus: {
          select: {
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    if (!existUsers || existUsers.length === 0) {
      throw new ConflictException("Usuários não encontrados");
    }

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
      },
      where: { id: userId }
    });

    if (!existUser) throw new ConflictException("Usuario não encontrado");

    return existUser;
  }

  // Remove o usuário do sistema
  async removeUser(user: { sub: string }) {
    // Busca todos os chats que ele participa
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { id: user.sub } } },
      include: { participants: true }
    });

    // Processa cada chat
    for (const chat of chats) {
      if (chat.participants.length > 2) {
        // Em chats com mais de 2 participantes: apenas remove o usuário
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: { participants: { disconnect: { id: user.sub } } }
        });
      } else {
        // Em chats com 2 ou menos: desativa o chat
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: { active: false }
        });
      }
    }

    // Finalmente, exclui o usuário
    await this.prisma.user.delete({ where: { id: user.sub } });

    return ({ message: "Usuario deletado com sucesso" })
  }
}
