import { Module } from '@nestjs/common';
import { UserController } from 'src/controller/user.controller';
import { UserService } from 'src/service/user.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { EnvModule } from 'src/env/env.module';


@Module({
  imports: [PrismaModule, AuthModule, EnvModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
