import type { ChatProps, User } from '../types/types';


interface Props {
    onSelectChat: (chat: ChatProps) => void;
    currentUser: User | null
    chats: ChatProps[]
}

export default function ChatList({ onSelectChat, currentUser, chats }: Props) {


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