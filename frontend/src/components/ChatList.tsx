import { useChat } from "../context/ChatContext";
import { formatRelativeDate } from "../utils/formatRelativeTime";
import Search from "./search";
import User from "./user";
import { FunnelIcon, PlusIcon } from "@phosphor-icons/react";

export default function ChatList() {
  const {
    chats,
    currentUser,
    lastMessages,
    selectedChat,
    createNewChat,
    setSelectedChat,
    setCreateNewChat,
    fetchChats,
  } = useChat();

  return (
    <div className="overflow-y-auto flex flex-col h-full">
      <header className="flex h-[95px] items-center justify-between p-6 border-b border-gray-300 relative">
        <div className="flex items-center gap-2.5 h-[46px]">
          <h2 className="text-xl font-bold">Mensagens</h2>
          <div className="bg-[#EDF2F7] w-8 rounded-3xl text-center">
            <span className="text-sm font-bold">{chats.length}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-5">
          <button
            onClick={() => setCreateNewChat(!createNewChat)}
            className="bg-[#615EF0] w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
          >
            <PlusIcon size={16} color="white" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <FunnelIcon size={20} color="#615EF0" />
          </button>
        </div>
      </header>
      <div className="px-6 py-4 flex flex-col gap-4">
        <Search onSearch={(value) => fetchChats(value)} />

        {chats.length === 0 && <p>Nenhum chat encontrado</p>}
      </div>
      <ul className="flex flex-col gap-2 px-6 py-4 flex-1">
        {chats.map((chat) => {
          const lastMsg = lastMessages[chat.id];

          const relativeTime = lastMsg?.timestamp
            ? formatRelativeDate(lastMsg.timestamp)
            : "";

          return (
            <li key={chat.id} className="flex items-center">
              <button
                onClick={() => setSelectedChat(chat)}
                className={`flex flex-1 justify-between items-center text-start cursor-pointer ${
                  selectedChat?.id === chat.id
                    ? "bg-gray-200"
                    : "bg-transparent"
                } hover:bg-gray-200 p-2 rounded`}
              >
                <div>
                  <p>
                    {chat.type !== "GROUP"
                      ? chat.participants?.find((p) => p.id !== currentUser?.id)
                          ?.name || chat.name
                      : chat.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate max-w-[200px]">
                    {lastMsg?.content || ""}
                  </p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {relativeTime}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      <User />
    </div>
  );
}
