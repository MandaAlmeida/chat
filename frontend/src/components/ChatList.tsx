import type { ChatProps, LastMessage, User } from '../types/types';
import { formatRelativeTime } from '../utils/formatRelativeTime';

interface Props {
    onSelectChat: (chat: ChatProps) => void;
    currentUser: User;
    chats: ChatProps[];
    messages: LastMessage[];
    selectedChat: ChatProps | null;
}

export default function ChatList({ onSelectChat, currentUser, chats, messages, selectedChat }: Props) {


    return (
        <div className="p-6 overflow-y-auto">
            {chats.length === 0 && <p>Nenhum chat encontrado</p>}
            <ul className='flex flex-col gap-2'>
                {chats.map(chat => {
                    const lastMessage = messages.find(msg => msg.chatId === chat.id);

                    return (
                        <li key={chat.id} className="flex items-center">
                            <button
                                onClick={() => onSelectChat(chat)}
                                className={`flex flex-1 justify-between items-center text-start cursor-pointer ${selectedChat?.id === chat.id ? "bg-gray-200" : "bg-transparent"} hover:bg-gray-200 p-2 rounded`}
                            >
                                <div>
                                    <p>
                                        {chat.type !== "GROUP"
                                            ? chat.participants?.find(p => p.id !== currentUser?.id)?.name || chat.name
                                            : chat.name}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                        {lastMessage?.message || ''}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                    {lastMessage?.createdAt && formatRelativeTime(new Date(lastMessage.createdAt))}
                                </p>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}