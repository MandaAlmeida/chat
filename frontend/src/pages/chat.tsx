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
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");
    const [chats, setChats] = useState<ChatProps[]>([]);

    useEffect(() => {
        fetchChats();
    }, []);

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
        const handleChat = (data: Message & { chatId: string; status?: string; timestamp?: string }) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setMessages(prev => {
                    const exists = prev.some(m =>
                        m.sender === data.sender &&
                        m.content === data.content &&
                        m.timestamp === data.timestamp
                    );
                    if (exists) return prev;
                    return [...prev, { ...data, status: 'SENT' }];
                });

                // Marcar como lida se for mensagem de outro usuário
                if (data.sender !== currentUser?.id) {
                    markMessagesAsRead([data.id]);
                }
            } else {
                console.log('Mensagem nova em outro chat:', data.chatId);
            }
        };

        socket.on('chat', handleChat);
        return () => {
            socket.off('chat', handleChat);
        };
    }, [selectedChat, currentUser]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        }
    }, [selectedChat]);

    const fetchUser = async () => {
        const res = await api.get('/user/me');
        setCurrentUser(res.data);
    };

    const fetchUsers = async () => {
        const res = await api.get('/user');
        setUsers(res.data);
    };

    const fetchMessages = async (chatId: string) => {
        const res = await api.get(`/message/${chatId}`);
        const newMsgs: Message[] = res.data.map((msg: any) => ({
            id: msg.id,
            sender: msg.authorId,
            content: msg.message,
            timestamp: msg.createdAt,
            status: msg.status
        }));
        setMessages(newMsgs);

        const unreadIds = newMsgs
            .filter(message => message.status !== "SENT" && message.sender !== currentUser?.id)
            .map(message => message.id);

        if (unreadIds.length > 0) {
            await markMessagesAsRead(unreadIds);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedChat || !currentUser) return;

        const recipients = [
            ...selectedChat.participants.map(p => p.id),
            selectedChat.createId
        ];

        const uniqueRecipients = Array.from(new Set(recipients));

        const payload = {
            recipients: uniqueRecipients,
            message,
            chatId: selectedChat.id,
        };

        await api.post('/message/send-message', payload);
        setMessage('');
    };

    const createChat = async () => {
        try {
            if (selectedUsers.length === 0) {
                setError("Selecione pelo menos um usuário.");
                return;
            }

            if (selectedUsers.length === 1 && groupName.trim()) {
                const res = await api.post<ChatProps>("/chat/create-group", {
                    name: groupName,
                    participants: selectedUsers,
                });
                setSelectedChat(res.data);
                fetchChats();
            } else {
                const res = await api.post<ChatProps>("/chat/get-or-create", {
                    name: currentUser?.name,
                    participant: selectedUsers[0]
                });
                setSelectedChat(res.data);
            }

            setSelectedUsers([]);
            setGroupName("");
            setError("");
        } catch (err) {
            setError("Erro ao criar chat.");
        }
    };

    const deleteMessage = async (id: string) => {
        const confirmed = window.confirm('Tem certeza que deseja deletar esta mensagem?');
        if (!confirmed) return;

        try {
            await api.delete(`/message/${id}`);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== id));
        } catch (error) {
            console.error('Erro ao deletar a mensagem:', error);
        }
    };

    const markMessagesAsRead = async (ids: string[]) => {
        if (!ids.length) return;
        try {
            await api.patch(`/message/view-message`, { ids });
            setMessages(prev =>
                prev.map(msg =>
                    ids.includes(msg.id) ? { ...msg, status: "SENT" } : msg
                )
            );
            console.log('Mensagens marcadas como lidas.');
        } catch (error) {
            console.error('Erro ao marcar mensagens como lidas:', error);
        }
    };

    const fetchChats = async () => {
        try {
            const response = await api.get('/chat');

            setChats(response.data);
        } catch (error) {
            console.error('Erro ao buscar chats:', error);
        }
    };

    return (
        <div className="flex h-screen">
            <div className="w-80 border-r border-gray-300 flex flex-col">
                <CreateChat users={users} createChat={createChat} error={error} groupName={groupName} selectedUsers={selectedUsers} setGroupName={setGroupName} setSelectedUsers={setSelectedUsers} />
                <ChatList onSelectChat={setSelectedChat} currentUser={currentUser} chats={chats} />
            </div>

            {selectedChat && (
                <ChatWindow
                    setMessages={setMessages}
                    selectedChat={selectedChat}
                    messages={messages}
                    message={message}
                    setMessage={setMessage}
                    handleSendMessage={handleSendMessage}
                    users={users}
                    currentUser={currentUser}
                    deleteMessage={deleteMessage}
                />
            )}
        </div>
    );
}

export default Chat;
