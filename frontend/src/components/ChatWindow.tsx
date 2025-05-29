
import { useEffect, useRef, useState } from 'react';
import type { ChatProps, Message, User } from '../types/types';
import { PencilIcon, TrashIcon } from '@phosphor-icons/react';
import api from '../api';

interface Props {
    selectedChat: ChatProps;
    messages: Message[];
    message: string;
    setMessage: (msg: string) => void;
    handleSendMessage: () => void;
    users: User[] | null
    currentUser: User | null
    deleteMessage: (id: string) => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

export default function ChatPropsWindow({
    selectedChat,
    messages,
    message,
    setMessage,
    handleSendMessage,
    deleteMessage,
    setMessages,
    users,
    currentUser
}: Props) {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startEditingMessage = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditingText(msg.content);
    };


    const handleEditConfirm = async () => {
        if (!editingMessageId || !editingText.trim()) return;

        try {
            await api.put(`/message/${editingMessageId}`, { message: editingText })
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === editingMessageId ? { ...msg, content: editingText.trim(), status: 'EDITED' } : msg
                )
            );
            setEditingMessageId(null);
            setEditingText('');
            setMessage('');
        } catch (error) {
            console.error('Erro ao editar mensagem:', error);
        }
    };


    return (
        <div className="w-full h-screen p-4">
            <h3 className="text-lg font-semibold mb-2">
                Chat com {selectedChat.type !== "GROUP"
                    ? selectedChat.participants
                        ? (selectedChat.participants.find(participant => participant.id !== currentUser?.id)?.name || selectedChat.name)
                        : "Desconhecido"
                    : selectedChat.name}
            </h3>

            <div className="border border-gray-300 min-h-72 overflow-y-auto p-2 rounded bg-gray-100">
                {messages && messages.map((msg, idx) => {
                    const isOwnMessage = msg.sender === currentUser?.id;
                    return (
                        <div key={idx} className={`mb-1 text-sm flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-2 rounded ${isOwnMessage ? 'bg-blue-200 text-right' : 'bg-gray-300 text-left'}`}>
                                <div className='flex justify-between items-center gap-3'>
                                    <p>
                                        <strong>
                                            {isOwnMessage ? 'Você' : users?.find(user => user.id === msg.sender)?.name || 'Desconhecido'}
                                        </strong>: {msg.content}
                                    </p>
                                    {isOwnMessage && (
                                        <div className="flex gap-1">
                                            <button
                                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                                onClick={() => deleteMessage(msg.id)}
                                                aria-label="Deletar mensagem"
                                                title="Deletar"
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                            <button
                                                className="cursor-pointer"
                                                onClick={() => startEditingMessage(msg)}
                                                aria-label="Editar mensagem"
                                                title="Editar"
                                            >
                                                <PencilIcon size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-600"> {new Date(msg.timestamp).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}</p>


                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef}></div>
            </div>

            <div className="mt-2 flex">
                <input
                    value={editingMessageId ? editingText : message}
                    onChange={e => editingMessageId ? setEditingText(e.target.value) : setMessage(e.target.value)}
                    placeholder="Mensagem"
                    className="flex-1 p-2 border border-gray-300 rounded mr-2"
                />

                {editingMessageId ? (
                    <>
                        <button
                            onClick={handleEditConfirm}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                        >
                            OK
                        </button>
                        <button
                            onClick={() => {
                                setEditingMessageId(null);
                                setEditingText('');
                            }}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Enviar
                    </button>
                )}

            </div>
        </div>
    );

};