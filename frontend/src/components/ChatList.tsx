import React, { useEffect, useState } from 'react';
import api from '../api';

interface Chat {
    id: string;
    name: string; // nome do grupo ou do outro participante
    // pode ter outras propriedades, adapte ao seu schema
}

interface Props {
    onSelectChat: (chat: Chat) => void;
}

export default function ChatList({ onSelectChat }: Props) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/chat')
            .then(res => {
                setChats(res.data);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    if (loading) return <p>Carregando chats...</p>;

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
                        {chat.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}