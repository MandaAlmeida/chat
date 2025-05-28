import { io } from 'socket.io-client';

export const socket = io('http://localhost:3333'); // ou a URL de produção
console.log('📡 Tentando conectar ao servidor WebSocket...');


export const connectToSocket = (userId: string) => {
    socket.on('notification', (data: any) => {
        console.log('🔔 Nova notificação recebida:', data);
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Desconectado do servidor');
    });

    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor via socket');
        socket.emit('join', userId);
    });
};
