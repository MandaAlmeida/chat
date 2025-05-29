import { Module } from '@nestjs/common';
import { MessageController } from 'src/controller/message.controller';
import { MessageGateway } from 'src/gateway/message.gateway';
import { MessageService } from 'src/service/message.service';
import { PrismaModule } from './prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageGateway]
})
export class MessageModule { }
