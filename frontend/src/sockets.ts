// src/socket.ts
import { io, Socket } from 'socket.io-client';
import { apiUrl } from './api';
import type { ChatProps, Message } from './types/types';

let socket: Socket;

export const connectSocket = (userId: string) => {
    if (!socket || !socket.connected) {
        socket = io(apiUrl, {
            path: '/socket.io',
            transports: ['websocket'],
            query: { userId }
        });
    }
};

export const getSocket = (): Socket => {
    if (!socket) {
        throw new Error('Socket not connected. Call connectSocket(userId) first.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};

export const setupSocketListeners = (
    onMessage: (msg: Partial<Message> & { chatId: string }) => void,
    onChatUpdate: (chat: ChatProps) => void
) => {
    if (!socket) return;

    socket.on('message', onMessage);
    socket.on('chat', onChatUpdate);
};

export const removeSocketListeners = () => {
    if (!socket) return;

    socket.off('message');
    socket.off('chat');
};
