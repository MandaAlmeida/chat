import { Module } from '@nestjs/common';
import { MessageController } from '@/controller/message.controller';
import { MessageGateway } from '@/gateway/message.gateway';
import { MessageService } from '@/service/message.service';
import { PrismaModule } from './prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageGateway]
})
export class MessageModule { }
