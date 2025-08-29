import { useChat } from "../context/ChatContext";

export default function User() {
  const { currentUser, handleLogout } = useChat();

  return (
    <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
      <section className="flex flex-col gap-2">
        <h2>Conta Logada</h2>
        <span>{currentUser.name}</span>
      </section>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800 cursor-pointer"
      >
        Sair
      </button>
    </div>
  );
}
