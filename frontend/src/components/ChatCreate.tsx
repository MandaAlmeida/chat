import { useState } from "react";
import api from "../api";
import type { ChatProps, User } from "../types/types";


interface Props {
    onChatCreated: (chat: ChatProps) => void;
    users: User[];
    currentUser: User | null;
}

export default function CreateChat({ onChatCreated, users, currentUser }: Props) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");


    const toggleUserSelection = (id: string) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
        );
    };

    const createChat = async () => {
        try {
            if (selectedUsers.length === 0) {
                setError("Selecione pelo menos um usuário.");
                return;
            }

            if (selectedUsers.length === 1 && groupName.trim()) {
                const res = await api.post<ChatProps>("/chat/create-group", {
                    name: groupName,
                    participants: selectedUsers,
                });
                onChatCreated(res.data);
            } else {
                const res = await api.post<ChatProps>("/chat/get-or-create", {
                    name: currentUser?.name,
                    participants: selectedUsers[0]
                });
                onChatCreated(res.data);
            }

            // Resetar seleção
            setSelectedUsers([]);
            setGroupName("");
            setError("");
        } catch (err) {
            setError("Erro ao criar chat.");
        }
    };

    return (
        <div className="p-4 border-b border-gray-300">
            <h2 className="font-bold mb-2">Criar Chat / Grupo</h2>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Nome do grupo (se criar grupo)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full p-1 border rounded"
                />
            </div>

            <div className="max-h-40 overflow-y-auto mb-2 border rounded p-2">
                {users.map((user) => (
                    <label key={user.id} className="block mb-1 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="mr-2"
                        />
                        {user.name}
                    </label>
                ))}
            </div>

            <button
                onClick={createChat}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
                Criar
            </button>
        </div>
    );
}
