
import { useEffect, useRef } from 'react';
import type { User } from '../types/types';

interface Props {
    selectedUser: User;
    currentUser: User;
    messages: string[];
    message: string;
    setMessage: (msg: string) => void;
    handleSendMessage: () => void;
}

export default function ChatWindow({
    selectedUser,
    messages,
    message,
    setMessage,
    handleSendMessage
}: Props) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Chat com {selectedUser.name}</h3>
            <div className="border border-gray-300 h-72 overflow-y-auto p-2 rounded bg-gray-100">
                {messages.map((msg, idx) => (
                    <div key={idx} className="mb-1 text-sm">
                        {msg}
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