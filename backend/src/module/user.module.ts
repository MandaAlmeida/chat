import { Module } from '@nestjs/common';
import { UserController } from '@/controller/user.controller';
import { UserService } from '@/service/user.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { EnvModule } from '@/env/env.module';


@Module({
  imports: [PrismaModule, AuthModule, EnvModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
