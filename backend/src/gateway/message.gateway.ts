import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: { origin: '*' },
    path: '/socket.io',
    serveClient: false,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log('Cliente conectado:', client.id);
    }

    handleDisconnect(client: Socket) {
        console.log('Cliente desconectado:', client.id);
    }

    // Envia dados de chat para um usuário específico
    sendChat(userId: string, chat: any) {
        this.server.to(userId).emit('chat', chat);
    }

    // Envia mensagem para um usuário específico, adicionando timestamp
    sendMessage(userId: string, message: any) {
        this.server.to(userId).emit('message', { ...message, timestamp: new Date().toISOString() });
    }

    // Adiciona o cliente na sala do usuário
    joinUserRoom(client: Socket, userId: string) {
        client.join(userId);
    }

    // Quando recebe um evento 'newMessage', associa o userId ao socket e o adiciona na sala
    @SubscribeMessage('newMessage')
    handleNewMessage(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        client.data.userId = userId;
        this.joinUserRoom(client, userId);
    }
}
