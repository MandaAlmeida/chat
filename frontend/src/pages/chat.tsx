import { useChat } from "../context/ChatContext";
import CreateChat from "../components/ChatCreate";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";

function Chat() {
  const { createNewChat, selectedChat } = useChat();

  return (
    <div className="flex h-screen w-full">
      <div
        className={`
          w-96 max-md:w-full border-r border-gray-300 flex flex-col h-screen
          ${selectedChat ? "max-md:hidden" : ""}
        `}
      >
        {createNewChat ? <CreateChat /> : <ChatList />}
      </div>

      {selectedChat && (
        <div className="flex-1 max-md:w-full max-md:flex max-md:absolute max-md:top-0 max-md:left-0 max-md:h-screen bg-white">
          <ChatWindow />
        </div>
      )}
    </div>
  );
}

export default Chat;
