import { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from '../api';
import CreateChat from '../components/ChatCreate';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import type { ChatProps, Message, User } from '../types/types';

export const socket = io('http://localhost:3333', {
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
            status: msg.status,
            seenStatus: msg.seenStatus,
            type: msg.type
        }));
        setMessages(newMsgs);

        const unreadIds = newMsgs
            .filter(message =>
                message.seenStatus === "SENT" &&
                message.sender !== currentUser?.id
            )
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
        const unreadIds = messages
            .filter(message =>
                message.seenStatus === "SENT" &&
                message.sender !== currentUser?.id
            )
            .map(message => message.id);
        markMessagesAsRead(unreadIds)
        setMessage('');
    };

    const createChat = async () => {
        try {
            if (selectedUsers.length === 0) {
                setError("Selecione pelo menos um usuário.");
                return;
            }

            if (selectedUsers.length > 1 && groupName) {
                await api.post<ChatProps>("/chat/create-group", {
                    name: groupName,
                    participants: selectedUsers,
                });
                fetchChats();
            } else {
                await api.post<ChatProps>("/chat/get-or-create", {
                    name: currentUser?.name,
                    participant: selectedUsers[0]
                });
                fetchChats();
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
        } catch (error) {
            console.error('Erro ao deletar a mensagem:', error);
        }
    };

    const deleteChat = async (id: string) => {
        const confirmed = window.confirm('Tem certeza que deseja deletar este chat?');
        if (!confirmed) return;

        try {
            await api.delete(`/chat/delete/${id}`);
            fetchChats();
            setSelectedChat(null)
        } catch (error) {
            console.error('Erro ao deletar o chat:', error);
        }
    };

    const markMessagesAsRead = async (ids: string[]) => {
        if (!ids.length) return;
        try {
            await api.patch(`/message/view-message`, { ids });
            setMessages(prev =>
                prev.map(msg =>
                    ids.includes(msg.id) ? { ...msg, status: "SEEN" } : msg
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

    const handleMessage = useCallback((data: Partial<Message> & { chatId: string }) => {
        console.log('Socket recebido:', data);

        if (selectedChat && data.chatId === selectedChat.id) {
            setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (exists) {
                    return prev.map(m => m.id === data.id ? { ...m, ...data } : m);
                }
                return [...prev, data as Message];
            });
        } else {
            console.log('Mensagem nova ou atualizada em outro chat:', data.chatId);
        }
    }, [selectedChat]);

    const handleChatUpdate = useCallback((data: ChatProps) => {
        console.log('Atualização de chat recebida:', data);

        setChats(prev => {
            const exists = prev.some(chat => chat.id === data.id);
            if (exists) {
                return prev.map(chat => chat.id === data.id ? { ...chat, ...data } : chat);
            }
            return [...prev, data];
        });
    }, []);


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
        socket.on('message', handleMessage);
        socket.on('chat', handleChatUpdate);

        return () => {
            socket.off('message', handleMessage);
            socket.off('chat', handleChatUpdate);
        };

    }, [handleMessage, handleChatUpdate]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        }
    }, [selectedChat]);

    return (
        <div className="flex h-screen">
            <div className="w-80 border-r border-gray-300 flex flex-col">
                <CreateChat
                    users={users}
                    createChat={createChat}
                    error={error}
                    groupName={groupName}
                    selectedUsers={selectedUsers}
                    setGroupName={setGroupName}
                    setSelectedUsers={setSelectedUsers}
                />
                <ChatList
                    onSelectChat={setSelectedChat}
                    currentUser={currentUser}
                    chats={chats}
                    onDeleteChat={deleteChat}
                />
            </div>
            {
                selectedChat && (
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
                )
            }
        </div >
    );
}

export default Chat;
