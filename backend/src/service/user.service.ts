import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from 'src/contracts/user.dto';
import { PrismaService } from './prisma.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { GoogleStrategy } from 'src/auth/google.strategy';
import { randomBytes } from 'crypto';


@Injectable()
export class UserService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private google: GoogleStrategy
  ) { }
  async create(createUserDto: CreateUserDTO) {
    const { userName, name, email, birth, password, passwordConfirmation } = createUserDto

    const existUser = await this.prisma.user.findUnique({ where: { email } })

    if (existUser) throw new ConflictException("Esse usuario já existe")

    if (password !== passwordConfirmation) throw new ConflictException("As senhas precisam ser iguais")

    const hashPassword = await hash(password, 8)

    const newUser = {
      userName,
      name,
      email,
      birth,
      password: hashPassword
    }

    return await this.prisma.user.create({ data: newUser })

  }

  async finishregisterOAuthUser(user: CreateUserDTO) {
    const { email, birth, name, userName, provider } = user;

    const existUser = await this.prisma.user.findUnique({ where: { email } })
    const updateUser = await this.prisma.user.update({
      where: { id: existUser?.id },
      data: {
        email,
        userName,
        birth,
        name,
        provider,
      },
    });

    const accessToken = this.jwt.sign({ sub: updateUser.id.toString() });
    return accessToken;
  }

  async login(user: LoginUserDTO) {
    const { email, password } = user;

    const existUser = await this.prisma.user.findUnique({ where: { email } })
    if (!existUser || !existUser.password) throw new UnauthorizedException("Senha ou email incorretos");

    const checkPassword = await compare(password, existUser.password);
    if (!checkPassword) throw new UnauthorizedException("Senha ou email incorretos");

    const accessToken = this.jwt.sign({ sub: existUser.id.toString() });

    return { token: accessToken }
  }

  async oauthLogin(profile: { email: string; name: string }) {
    const existUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    const userName = 'user_' + randomBytes(4).toString('hex');

    if (!existUser) {

      const userData = {
        email: profile.email,
        name: profile.name,
        userName,
        birth: "",
        provider: 'google',
      };

      const user = await this.prisma.user.create({
        data: userData
      });
      const accessToken = this.jwt.sign({ sub: user.id });
      return { token: accessToken, user, newUser: true };
    }

    const accessToken = this.jwt.sign({ sub: existUser.id });
    return { token: accessToken };
  }

  async findAll() {
    const existUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        userName: true,
      }
    })

    if (!existUsers) throw new ConflictException("Úsuario não encontrado")

    return existUsers;
  }

  async findOne(user: { sub: string }) {
    const userId = user.sub;
    const existUser = await this.prisma.user.findUnique({
      omit: {
        password: true
      },
      where: { id: userId }
    })

    if (!existUser) throw new ConflictException("Úsuario não encontrado")

    return existUser;
  }

  // update(id: string, updateUserDto: UpdateUserDTO) {
  //   return `This action updates a #${id} user`;
  // }

  async removeUser(user: { sub: string }) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: { some: { id: user.sub } }
      },
      include: { participants: true }
    });

    for (const chat of chats) {
      if (chat.participants.length > 2) {
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: {
            participants: {
              disconnect: { id: user.sub }
            }
          }
        });
      } else {
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: { active: false }
        });
      }
    }


    await this.prisma.user.delete({
      where: { id: user.sub }
    });
  }
}
