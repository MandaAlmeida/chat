import { useChat } from "../context/ChatContext";
import { CaretLeftIcon } from "@phosphor-icons/react";

type Props = {
  name: string;
  participants?: string[];
  email?: string;
  status?: string;
  children?: React.ReactNode;
};

export function HeaderChat({
  name,
  email,
  status,
  participants,
  children,
}: Props) {
  const { deleteChat, selectedChat, setSelectedChat } = useChat();

  return (
    <header className="flex items-center justify-between p-6 border-b border-gray-300">
      <div className="flex gap-6 items-center">
        <button
          onClick={() => setSelectedChat(null)}
          className="cursor-pointer"
        >
          <CaretLeftIcon size={26} color="#615EF0" />
        </button>
        <div className="flex flex-col">
          <section className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{name}</h2>
            {email && (
              <>
                <span>-</span>
                <span className="text-sm">{email}</span>
              </>
            )}
          </section>

          <section className="flex items-center gap-2 h-[18px]">
            {status ? (
              // Mostra o status com bolinha
              <>
                <span
                  className={`w-2.5 h-2.5 ${
                    status === "Online" ? "bg-[#68D391]" : "bg-red-600"
                  } rounded-full flex`}
                ></span>
                <p className="text-[12px]">{status}</p>
              </>
            ) : (
              // Lista de participantes
              <p className="text-sm text-gray-700">
                {Array.isArray(participants) && participants.length > 0
                  ? participants.length === 1
                    ? participants[0] // Apenas um participante
                    : participants.slice(0, -1).join(", ") +
                      " e " +
                      participants.slice(-1)
                  : "Sem participantes"}
              </p>
            )}
          </section>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={() => deleteChat(selectedChat!.id)}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800 cursor-pointer"
        >
          Excluir chat
        </button>
      </div>
    </header>
  );
}
