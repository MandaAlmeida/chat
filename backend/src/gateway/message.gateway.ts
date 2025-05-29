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
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    },
    path: '/socket.io',
    serveClient: false,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor() { }

    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log('Cliente conectado:', client.id);
    }

    handleDisconnect(client: Socket) {
        console.log('Cliente desconectado:', client.id);
    }

    sendChat(userId: string, chat: any) {
        this.server.to(userId).emit('chat', { ...chat, timestamp: new Date().toISOString() });
    }

    joinUserRoom(client: Socket, userId: string) {
        client.join(userId);
    }

    @SubscribeMessage('newMessage')
    handleNewMessage(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        client.data.userId = userId;
        this.joinUserRoom(client, userId);
    }


    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: { to: string[]; message: string; chatId: string },
        @ConnectedSocket() client: Socket
    ) {
        const senderId = client.data?.userId;

        if (!senderId) {
            console.warn('Usuário não autenticado no socket');
            return;
        }

        const chat = {
            sender: senderId,
            content: data.message,
            chatId: data.chatId
        };

        // Cria um Set para eliminar duplicatas
        const recipients = new Set([...data.to, senderId]);

        for (const userId of recipients) {
            this.sendChat(userId, chat);
        }
    }

}
