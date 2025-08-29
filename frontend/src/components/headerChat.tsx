import { useChat } from "../context/ChatContext";
import { CaretLeftIcon } from "@phosphor-icons/react";

type Props = {
  name: string;
  status?: string;
  children?: React.ReactNode;
};

export function HeaderChat({ name, status, children }: Props) {
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
          <h2 className="text-xl font-bold">{name}</h2>
          <section className="flex items-center gap-2 h-[18px]">
            {status ? (
              <span className="w-2.5 h-2.5 bg-[#68D391] rounded-full flex"></span>
            ) : null}
            <p className="text-[12px]">{status}</p>
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
