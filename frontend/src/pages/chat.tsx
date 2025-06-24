import { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import api, { apiUrl } from '../api';
import CreateChat from '../components/ChatCreate';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import type { ChatProps, LastMessage, Message, User } from '../types/types';
import { FunnelIcon, PlusIcon } from '@phosphor-icons/react';

export const socket = io(apiUrl, {
    path: '/socket.io',
    transports: ['websocket']
});

function Chat() {
    const [currentUser, setCurrentUser] = useState<User>({
        id: "",
        email: "",
        name: "",
        isOnline: false
    });
    const [users, setUsers] = useState<User[]>([]);
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [lastMessage, setLastMessage] = useState<LastMessage[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatProps | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");
    const [chats, setChats] = useState<ChatProps[]>([]);
    const [createNewChat, setCreateNewChat] = useState(false);

    useEffect(() => {
        const socket = io('http://localhost:3333', {
            query: { userId: currentUser?.id }
        });
    }, [currentUser]);

    console.log(users)

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
            type: msg.type,
            chatId: msg.chatId
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

            if (selectedUsers.length >= 1 && groupName) {
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
        setChats(prev => {
            const exists = prev.some(chat => chat.id === data.id);
            if (exists) {
                return prev.map(chat => chat.id === data.id ? { ...chat, ...data } : chat);
            }
            return [...prev, data];
        });
    }, []);

    async function fetchLastMessages(chatIds: string[]) {
        try {
            const response = await api.post('/message/last-messages', { chatIds });
            return setLastMessage(response.data);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            return [];
        }
    }

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

    useEffect(() => {
        if (chats && chats.length > 0) {
            const chatIds = chats.map(chat => chat.id);
            fetchLastMessages(chatIds);
        }
    }, [chats]);

    return (
        <div className="flex h-screen">

            <div className="w-96 border-r border-gray-300 flex flex-col h-screen">
                <header className="flex h-[95px] items-center justify-between p-6 border-b border-gray-300">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold">Messagens</h2>
                        <div className="bg-[#EDF2F7] w-8 rounded-3xl text-center"><text className="text-sm font-bold">{chats.length}</text></div>
                    </div>

                    <div className="flex items-center justify-end gap-5">
                        <button onClick={() => setCreateNewChat(!createNewChat)} className="bg-[#615EF0] w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"><PlusIcon size={20} color="white" /></button>
                        <button className="w-6 h-6 flex items-center justify-center cursor-pointer"><FunnelIcon size={20} color="#615EF0" /></button>
                    </div>
                </header>
                {createNewChat ? <CreateChat
                    users={users}
                    createChat={createChat}
                    error={error}
                    groupName={groupName}
                    selectedUsers={selectedUsers}
                    setGroupName={setGroupName}
                    setSelectedUsers={setSelectedUsers}
                /> : <ChatList
                    onSelectChat={setSelectedChat}
                    currentUser={currentUser}
                    chats={chats}
                    messages={lastMessage}
                    selectedChat={selectedChat}
                />}
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
