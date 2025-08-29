import { CaretLeftIcon } from "@phosphor-icons/react";
import { useChat } from "../context/ChatContext";
import SearchUsers from "./search";
import User from "./user";

export default function CreateChat() {
  const {
    usersSearch,
    error,
    groupName,
    selectedUsers,
    createNewChat,
    setGroupName,
    setSelectedUsers,
    setCreateNewChat,
    createChat,
    fetchUsers,
  } = useChat();

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-4 h-full">
        <header className="flex w-full h-[95px] items-center p-6 border-b border-gray-300 relative">
          <button
            onClick={() => setCreateNewChat(!createNewChat)}
            className="cursor-pointer"
          >
            <CaretLeftIcon size={20} color="#615EF0" />
          </button>
          <h2 className="text-xl font-bold flex-1 text-center">
            Criar Chat / Grupo
          </h2>
        </header>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="px-6 flex flex-col gap-4 h-full flex-1 justify-between mb-4">
          <div className="flex flex-col gap-6">
            <SearchUsers onSearch={(value) => fetchUsers(value)} />

            <input
              type="text"
              placeholder="Nome do grupo (se criar grupo)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-1 border rounded"
            />

            <ul className="flex flex-col gap-2">
              {usersSearch.map((user) => {
                const isSelected = selectedUsers.includes(user.id);

                return (
                  <li
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex flex-1 justify-between items-center text-start cursor-pointer p-2 rounded transition-colors
               ${isSelected ? "bg-[#615EF0]" : "bg-gray-200"}
              hover:bg-[#4c4ab9]
              `}
                  >
                    <p
                      className={`${isSelected ? "text-white" : "text-black"}`}
                    >
                      {user.name}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            onClick={createChat}
            className="w-full bg-[#615EF0] text-white p-2 rounded hover:bg-[#3e3ca0] cursor-pointer"
          >
            Criar
          </button>
        </div>
      </div>
      <User />
    </div>
  );
}
