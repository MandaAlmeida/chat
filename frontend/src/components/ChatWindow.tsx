import { CheckIcon, ChecksIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import type { ChatProps, Message, User } from '../types/types';
import { formatDateGroup } from '../utils/formatDateGroup';
import { HeaderChat } from './headerChat';

interface Props {
    selectedChat: ChatProps;
    messages: Message[];
    message: string;
    setMessage: (msg: string) => void;
    handleSendMessage: () => void;
    users: User[];
    currentUser: User;
    deleteMessage: (id: string) => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatPropsWindow({
    selectedChat,
    messages,
    message,
    setMessage,
    handleSendMessage,
    setMessages,
    currentUser,
    users
}: Props) {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // const startEditingMessage = (msg: Message) => {
    //     setEditingMessageId(msg.id);
    //     setEditingText(msg.content);
    // };

    const handleEditConfirm = async () => {
        if (!editingMessageId || !editingText.trim()) return;
        try {
            await api.put(`/message/${editingMessageId}`, { message: editingText });
            setMessages(prev =>
                prev.map(msg =>
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

    // Agrupar mensagens por data
    const groupedMessages = messages.reduce((acc: Record<string, Message[]>, msg) => {
        const groupKey = formatDateGroup(new Date(msg.timestamp));
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(msg);
        return acc;
    }, {});

    const isUserInChat = (userId: string, selectedChat: ChatProps) => {
        const isCreator = selectedChat.createId === userId;
        const isParticipant = selectedChat.participants.some(p => p.id === userId);

        return isCreator || isParticipant;
    };

    const user = users.find(u => isUserInChat(u.id, selectedChat));

    const status = user?.UserStatus.isOnline;

    return (
        <div className="w-full h-screen flex flex-col">
            <HeaderChat name={selectedChat.type !== 'GROUP'
                ? selectedChat.participants?.find(p => p.id !== currentUser?.id)?.name || selectedChat.name
                : selectedChat.name} status={status === true ? "Online" : "Offline"} />

            <div className="flex-1 overflow-y-auto p-2 rounded">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-gray-500 my-4">{date}</div>
                        {msgs.map((msg, id) => {
                            const isOwnMessage = msg.sender === currentUser?.id;

                            return (
                                <div
                                    key={id}
                                    className={`mb-1 text-sm flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[45%] px-3 py-2 rounded-2xl flex gap-4 items-end ${isOwnMessage ? 'bg-[#615EF0] text-right text-white' : 'bg-[#F1F1F1] text-left'
                                            }`}
                                    >
                                        <p className="break-words text-start">
                                            {msg.content}
                                            {msg.status === 'EDITED' && (
                                                <span className="text-gray-500 italic ml-1">(editada)</span>
                                            )}
                                        </p>
                                        <div className="flex justify-end items-center gap-1 mt-1 text-xs text-gray-600">
                                            <span className={`${isOwnMessage ? 'text-right text-white' : 'text-left'
                                                }`}>
                                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })}
                                            </span>
                                            {isOwnMessage &&
                                                (msg.seenStatus === 'SEEN' ? (
                                                    <ChecksIcon size={14} className="text-[#3e3ca0]" />
                                                ) : (msg.seenStatus === 'DELIVERED') ? (
                                                    <ChecksIcon size={14} className="text-gray-300" />
                                                ) : (
                                                    <CheckIcon size={14} className="text-white" />
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                <div ref={messagesEndRef}></div>
            </div>

            <div className="mt-2 flex items-center border border-gray-300 rounded  m-5 h-[50px]">
                <input
                    value={editingMessageId ? editingText : message}
                    onChange={e =>
                        editingMessageId ? setEditingText(e.target.value) : setMessage(e.target.value)
                    }
                    placeholder="Mensagem"
                    className="flex-1 p-2 outline-none"
                />
                {editingMessageId ? (
                    <>
                        <button
                            onClick={handleEditConfirm}
                            className="px-4 py-2 bg-[#615EF0] text-white rounded hover:bg-[#3e3ca0] mr-2"
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
                    message.trim() && <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 text-[#615EF0] rounded hover:text-[#3e3ca0] cursor-pointer"
                    >
                        <PaperPlaneTiltIcon size={32} weight="fill" />
                    </button>
                )}
            </div>
        </div>
    );
}
