import { Module } from '@nestjs/common';
import { ChatController } from 'src/controller/chat.controller';
import { ChatService } from 'src/service/chat.service';
import { PrismaModule } from './prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule { }
