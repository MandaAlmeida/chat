import { TrashIcon } from '@phosphor-icons/react';
import type { ChatProps, User } from '../types/types';


interface Props {
    onSelectChat: (chat: ChatProps) => void;
    onDeleteChat: (chatId: string) => void;
    currentUser: User | null
    chats: ChatProps[]
}

export default function ChatList({ onSelectChat, onDeleteChat, currentUser, chats }: Props) {
    return (
        <div className="p-2 overflow-y-auto h-screen">
            <h2 className="font-bold text-lg mb-2">Seus chats</h2>
            {chats.length === 0 && <p>Nenhum chat encontrado</p>}
            <ul>
                {chats.map(chat => (
                    <li
                        key={chat.id}
                        className="flex items-center"

                    >
                        <button
                            onClick={() => onSelectChat(chat)}
                            className="flex-1 text-start cursor-pointer hover:bg-gray-200 p-2 rounded"
                        >
                            <p>
                                {chat.type !== "GROUP"
                                    ? chat.participants?.find(participant => participant.id !== currentUser?.id)?.name || chat.name
                                    : chat.name}
                            </p>
                        </button>
                        <button onClick={() => onDeleteChat(chat.id)} className='text-red-500 hover:text-red-700 cursor-pointer'><TrashIcon size={16} /></button>
                    </li>
                ))}
            </ul>
        </div>
    );
}