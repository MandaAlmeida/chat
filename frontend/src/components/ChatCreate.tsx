import { useNavigate } from "react-router-dom";

import { socket } from "../pages/chat";
import type { User } from "../types/types";


interface Props {
    users: User[];
    error: string;
    groupName: string;
    setGroupName: React.Dispatch<React.SetStateAction<string>>;
    selectedUsers: string[];
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
    createChat: () => Promise<void>;
}

export default function CreateChat({ users, error, groupName, setGroupName, selectedUsers, setSelectedUsers, createChat }: Props) {
    const navigate = useNavigate();

    const toggleUserSelection = (id: string) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        const disconnectSocket = () => {
            if (socket) {
                socket.disconnect();
                console.log('Socket desconectado pelo frontend');
            }
        };
        navigate('/');
    };

    return (
        <div className="p-4 border-b border-gray-300">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold mb-2">Criar Chat / Grupo</h2>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                    Sair
                </button>
            </div>

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
