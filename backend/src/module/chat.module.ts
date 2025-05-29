import { Module } from '@nestjs/common';
import { ChatController } from 'src/controller/chat.controller';
import { ChatService } from 'src/service/chat.service';
import { PrismaModule } from './prisma.module';
import { MessageModule } from './message.module';


@Module({
  imports: [PrismaModule, MessageModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule { }
