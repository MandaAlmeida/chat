import { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";


export interface User {
    id: string;
    userName: string;
}

interface Chat {
    id: string;
    name: string;
}

interface Props {
    onChatCreated: (chat: Chat) => void;
}

export default function CreateChat({ onChatCreated }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get<User[]>("http://localhost:3333/user").then((res) => {
            setUsers(res.data);
        });
    }, []);

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

            if (selectedUsers.length === 1) {
                const res = await api.post<Chat>("http://localhost:3333/chat/get-or-create", {
                    participantId: selectedUsers[0],
                });
                onChatCreated(res.data);
            } else {
                if (!groupName.trim()) {
                    setError("Digite o nome do grupo.");
                    return;
                }
                const res = await api.post<Chat>("http://localhost:3333/chat/create-group", {
                    name: groupName,
                    participantIds: selectedUsers,
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
                        {user.userName}
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
