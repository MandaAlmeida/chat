import { Module } from '@nestjs/common';
import { UserModule } from '@/module/user.module';
import { ChatModule } from '@/module/chat.module';
import { PrismaModule } from '@/module/prisma.module';
import { EnvModule } from '@/env/env.module';
import { AuthModule } from '@/auth/auth.module';
import { MessageModule } from '@/module/message.module';
import { LoggerModule } from 'nestjs-pino';
//  import { CustomLogger } from './logs/custom.logger';


@Module({
  imports: [
    UserModule,
    ChatModule,
    PrismaModule,
    EnvModule,
    AuthModule,
    MessageModule,

    // Config Logger
    // LoggerModule.forRoot({ pinoHttp: { level: 'trace' } }),

  ],
  // providers: [CustomLogger],
  // exports: [CustomLogger],
})
export class AppModule { }
