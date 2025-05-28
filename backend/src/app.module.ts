import { Module } from '@nestjs/common';
import { UserModule } from './module/user.module';
import { ChatModule } from './module/chat.module';
import { PrismaModule } from './module/prisma.module';
import { EnvModule } from './env/env.module';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './module/message.module';


@Module({
  imports: [UserModule, ChatModule, PrismaModule, EnvModule, AuthModule, ChatModule, MessageModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
