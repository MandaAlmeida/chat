// src/App.tsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import type { User } from '../types/types';
import UserList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import api from '../api';
import CreateChat from '../components/ChatCreate';
import ChatList from '../components/ChatList';



const socket = io('http://localhost:3333', {
    path: '/socket.io',
    transports: ['websocket'],
});

interface Chat {
    id: string;
    name: string;
}

function Chat() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<string[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('authToken', token);
            window.history.replaceState({}, document.title, '/');
        }

        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('authToken');

        if (!storedToken) {
            window.location.href = 'http://localhost:3333/user/google';
        } else if (storedToken && !storedUser) {
            fetchCurrentUser();
        } else if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('http://localhost:3333/user/me');
            if (!res) throw new Error('Erro ao buscar usuário');
            const user = await res.data;
            localStorage.setItem('currentUser', JSON.stringify(user));
            setCurrentUser(user);
        } catch (err) {
            console.error('Erro ao buscar usuário:', err);
            localStorage.removeItem('authToken');
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
            socket.emit('newMessage', currentUser.id);
        }
    }, [currentUser]);

    useEffect(() => {
        socket.on('chat', handleIncomingMessage);
        return () => {
            socket.off('chat', handleIncomingMessage);
        };
    }, []);

    const fetchUsers = async () => {
        const res = await api.get('http://localhost:3333/user');
        const data = res.data;
        if (currentUser) {
            setUsers(data.filter((u: User) => u.id !== currentUser.id));
        }
    };

    const handleIncomingMessage = (data: { sender: string; content: string; timestamp: string }) => {
        const newMsg = `De: ${data.sender} | ${data.content} | ${data.timestamp}`;
        setMessages(prev => [...prev, newMsg]);
    };

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        const res = await api.post('http://localhost:3333/chat/get-or-create', user.id);
        const chat = await res.data;
        setSelectedChatId(chat.id);
        setMessages([]);
    };

    const handleSendMessage = async () => {
        // if (!message || !selectedUser || !selectedChatId || !currentUser) return;
        const payload = {
            to: selectedUser?.id,
            message,
            chatId: selectedChatId,
        };
        const res = await api.post('http://localhost:3333/message/send-message', payload);

        console.log(res.data)
        socket.emit('sendMessage', payload);

        const displayMsg = `Você: ${message} | ${new Date().toISOString()}`;
        setMessages(prev => [...prev, displayMsg]);
        setMessage('');
    };

    if (!currentUser) return <p>Redirecionando para login...</p>;

    const handleChatCreated = (chat: Chat) => {
        setSelectedChat(chat);
    };

    return (

        <div className="flex h-screen">
            <div className="w-80 border-r border-gray-300 flex flex-col">
                <CreateChat onChatCreated={handleChatCreated} />
                <ChatList onSelectChat={setSelectedChat} />
            </div>

            {selectedUser && currentUser && (
                <ChatWindow
                    selectedUser={selectedUser}
                    currentUser={currentUser}
                    messages={messages}
                    message={message}
                    setMessage={setMessage}
                    handleSendMessage={handleSendMessage}
                />)}
        </div>

    );
}

export default Chat;
