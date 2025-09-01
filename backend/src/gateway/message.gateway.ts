import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '@/service/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/socket.io',
  serveClient: false,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      client.disconnect(true);
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      client.disconnect(true); // Também é bom desconectar se o user não existir
      return;
    }

    // Atualiza o status do usuário para online no banco
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        UserStatus: true,
      },
    });

    console.log(`Usuario conectado: ${userId}`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) return;

    // Atualiza o status do usuário para offline no banco
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        UserStatus: false,
      },
    });

    console.log(`Usuario desconectado: ${userId}`);
  }
  // Envia dados de chat para um usuário específico
  sendChat(userId: string, chat: any) {
    this.server.to(userId).emit('chat', chat);
  }

  // Envia dados do usuario deslogado ou logado
  sendUser(userId: string, user: any) {
    this.server.to(userId).emit('user', user);
  }

  // Envia mensagem para um usuário específico, adicionando timestamp
  sendMessage(userId: string, message: any) {
    this.server
      .to(userId)
      .emit('message', { ...message, timestamp: new Date().toISOString() });
  }

  // Adiciona o cliente na sala do usuário
  joinUserRoom(client: Socket, userId: string) {
    client.join(userId);
  }

  // Quando recebe um evento 'newMessage', associa o userId ao socket e o adiciona na sala
  @SubscribeMessage('newMessage')
  handleNewMessage(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.data.userId = userId;
    this.joinUserRoom(client, userId);
  }
}
