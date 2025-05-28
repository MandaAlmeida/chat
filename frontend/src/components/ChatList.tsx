import { useEffect, useState } from 'react';
import api from '../api';
import type { ChatProps, User } from '../types/types';


interface Props {
    onSelectChat: (chat: ChatProps) => void;
    currentUser: User | null
}

export default function ChatList({ onSelectChat, currentUser }: Props) {
    const [chats, setChats] = useState<ChatProps[]>([]);
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await api.get('/chat/');

                setChats(response.data);
            } catch (error) {
                console.error('Erro ao buscar chats:', error);
            }
        };

        fetchChats();
    }, []);

    return (
        <div className="p-2 overflow-y-auto h-screen">
            <h2 className="font-bold text-lg mb-2">Seus chats</h2>
            {chats.length === 0 && <p>Nenhum chat encontrado</p>}
            <ul>
                {chats.map(chat => (
                    <li
                        key={chat.id}
                        className="cursor-pointer p-2 hover:bg-gray-200 rounded"
                        onClick={() => onSelectChat(chat)}
                    >
                        {chat.type !== "GROUP" ? chat.participants.find(participant => participant.id !== currentUser?.id)?.name || chat.name : chat.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}