import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from '../api';
import CreateChat from '../components/ChatCreate';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import type { ChatProps, Message, User } from '../types/types';

const socket = io('http://localhost:3333', {
    path: '/socket.io',
    transports: ['websocket']
});

function Chat() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatProps | null>(null);

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
            socket.emit('newMessage', currentUser.id);
        }
    }, [currentUser]);

    useEffect(() => {
        socket.on('chat', (data) => {
            setMessages(prev => [...prev, data]);
        });
        return () => {
            socket.off('chat');
        };
    }, []);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        }
    }, [selectedChat]);

    const fetchUser = async () => {
        const res = await api.get('/user/me');
        const data = res.data;
        setCurrentUser(data);
    };

    const fetchUsers = async () => {
        const res = await api.get('/user');
        setUsers(res.data);
    };

    const fetchMessages = async (chatId: string) => {
        const res = await api.get(`/message/${chatId}`);

        const newMsgs = res.data.map((msg: any) => ({
            sender: msg.authorId,
            content: msg.message,
            timestamp: msg.createdAt
        }));

        setMessages(newMsgs);
    };

    const handleSendMessage = async () => {
        if (!selectedChat || !currentUser) return;

        const recipients = selectedChat.participants
            .filter(p => p.id !== currentUser.id)
            .map(p => p.id);

        const payload = {
            to: recipients,
            message,
            chatId: selectedChat.id,
        };

        await api.post('/message/send-message', payload);
        socket.emit('sendMessage', payload);
        setMessage('');

    };

    const handleChatCreated = (chat: ChatProps) => {
        setSelectedChat(chat);
    };

    return (
        <div className="flex h-screen">
            <div className="w-80 border-r border-gray-300 flex flex-col">
                <CreateChat users={users} onChatCreated={handleChatCreated} currentUser={currentUser} />
                <ChatList onSelectChat={setSelectedChat} currentUser={currentUser} />
            </div>

            {selectedChat && (
                <ChatWindow
                    selectedChat={selectedChat}
                    messages={messages}
                    message={message}
                    setMessage={setMessage}
                    handleSendMessage={handleSendMessage}
                    users={users}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}

export default Chat;
