
import { useEffect, useRef } from 'react';
import type { ChatProps, Message, User } from '../types/types';

interface Props {
    selectedChat: ChatProps;
    messages: Message[];
    message: string;
    setMessage: (msg: string) => void;
    handleSendMessage: () => void;
    users: User[] | null
    currentUser: User | null

}

export default function ChatPropsWindow({
    selectedChat,
    messages,
    message,
    setMessage,
    handleSendMessage,
    users,
    currentUser
}: Props) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="w-full p-4">
            <h3 className="text-lg font-semibold mb-2">Chat com {selectedChat.type !== "GROUP" ? selectedChat.participants ? (selectedChat.participants.find(participant => participant.id !== currentUser?.id)?.name || selectedChat.name) : "Desconhecido" : selectedChat.name}</h3>
            <div className="border border-gray-300 h-72 overflow-y-auto p-2 rounded bg-gray-100">
                {messages && messages.map((msg, idx) => (
                    <div key={idx} className="mb-1 text-sm">
                        <p>
                            <strong>
                                {msg.sender === currentUser?.id
                                    ? 'Você'
                                    : users?.find(user => user.id === msg.sender)?.name || 'Desconhecido'}
                            </strong>: {msg.content}
                        </p>


                        <p>{msg.timestamp}</p>
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="mt-2 flex">
                <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Mensagem"
                    className="flex-1 p-2 border border-gray-300 rounded mr-2"
                />
                <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};