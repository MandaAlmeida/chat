import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  connectSocket,
  getSocket,
  setupSocketListeners,
  removeSocketListeners,
} from "../sockets";
import api from "../api";
import type { ChatProps, Message, User } from "../types/types";
import { useNavigate } from "react-router-dom";

type ChatContextType = {
  currentUser: User;
  users: User[];
  message: string;
  messages: Message[];
  lastMessages: Record<string, Message>;
  chats: ChatProps[];
  selectedChat: ChatProps | null;
  createNewChat: boolean;
  error: string;
  groupName: string;
  selectedUsers: string[];
  usersSearch: User[];
  usersStatus: UserStatus[];
  accessToken: string | null;
  refreshToken: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setChats: React.Dispatch<React.SetStateAction<ChatProps[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<ChatProps | null>>;
  setCreateNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setGroupName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  createChat: () => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  deleteMessage: (ids: string[]) => Promise<void>;
  handleSendMessage: () => Promise<void>;
  fetchUsers: (search?: string) => Promise<void>;
  handleLogout: () => void;
  fetchChats: (search?: string) => Promise<void>;
  markMessagesAsRead: (ids: string[]) => Promise<void>;
};

export type UserStatus = {
  userId: string;
  userStatus: boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>({
    id: "",
    email: "",
    name: "",
    UserStatus: false,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [usersSearch, setUsersSearch] = useState<User[]>([]);
  const [usersStatus, setUsersStatus] = useState<UserStatus[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [selectedChat, setSelectedChat] = useState<ChatProps | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [chats, setChats] = useState<ChatProps[]>([]);
  const [createNewChat, setCreateNewChat] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // === FUNÇÕES ===
  const fetchUser = async () => {
    const res = await api.get("/user/me");
    setCurrentUser(res.data);
  };

  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch (err) {
      console.error("Erro no logout:", err);
    } finally {
      // Limpa tokens e desconecta sockets
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      removeSocketListeners();

      // Navega para a tela de login
      navigate("/", { replace: true });
    }
  };

  const fetchUsers = async (search: string = "") => {
    try {
      const res = await api.get("/user", {
        params: { search },
      });

      setUsersSearch(res.data);
      if (search === "") setUsers(res.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const fetchChats = async (search?: string) => {
    try {
      const res = await api.get("/chat", {
        params: { search },
      });
      setChats(res.data);
    } catch (err) {
      console.error("Erro ao buscar chats:", err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const res = await api.get(`/message/${chatId}`);
    const newMsgs: Message[] = res.data.map((msg: any) => ({
      id: msg.id,
      authorId: msg.authorId,
      content: msg.message,
      timestamp: msg.createdAt,
      status: msg.status,
      seenStatus: msg.seenStatus,
      type: msg.type,
      chatId: msg.chatId,
    }));
    setMessages(newMsgs);
    const messagesRead = messages
      .filter((msg) => msg.seenStatus === "SENT" && msg.status !== "DELETE")
      .map((msg) => msg.id);

    markMessagesAsRead(messagesRead);
  };

  const markMessagesAsRead = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await api.patch(`/message/view-message`, { ids });
      setMessages((prev) =>
        prev.map((msg) =>
          ids.includes(msg.id) && msg.status !== "DELETE"
            ? { ...msg, status: "SEEN" }
            : msg
        )
      );
    } catch (err) {
      console.error("Erro ao marcar mensagens como lidas:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !currentUser) return;

    const recipients = [
      ...selectedChat.participants.map((p) => p.id),
      selectedChat.createId,
    ];
    const uniqueRecipients = Array.from(new Set(recipients));

    const payload = {
      recipients: uniqueRecipients,
      message,
      chatId: selectedChat.id,
    };
    await api.post("/message/send-message", payload);

    const messagesRead = messages
      .filter((msg) => msg.seenStatus === "SENT" && msg.status !== "DELETE")
      .map((msg) => msg.id);

    setMessage("");
    markMessagesAsRead(messagesRead);
  };

  const createChat = async () => {
    try {
      if (selectedUsers.length === 0) {
        setError("Selecione pelo menos um usuário.");
        return;
      }

      let response: { data: ChatProps };

      // Chat em grupo
      if (selectedUsers.length > 1 || groupName.trim()) {
        response = await api.post<ChatProps>("/chat/create-group", {
          name: groupName || "Novo Grupo",
          participants: selectedUsers,
        });

        // Seleciona o chat criado
        setSelectedChat(response.data);
      } else {
        // Chat individual
        response = await api.post<ChatProps>("/chat/get-or-create", {
          name: currentUser?.name,
          participant: selectedUsers[0],
        });

        // Seleciona o chat criado ou retornado
        setSelectedChat(response.data);
      }

      // Atualiza lista de chats
      await fetchChats();

      // Reset do estado
      setSelectedUsers([]);
      setGroupName("");
      setError("");
      setCreateNewChat(false);
    } catch (err) {
      console.error("Erro ao criar chat:", err);
      setError("Erro ao criar chat.");
    }
  };

  const deleteMessage = async (ids: string[]) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar esta mensagem?"
    );
    if (!confirmed) return;
    try {
      await api.delete(`/message/${ids}`);
    } catch (err) {
      console.error("Erro ao deletar a mensagem:", err);
    }
  };

  const deleteChat = async (id: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este chat?"
    );
    if (!confirmed) return;
    try {
      await api.delete(`/chat/delete/${id}`);
      fetchChats();
      setSelectedChat(null);
    } catch (err) {
      console.error("Erro ao deletar o chat:", err);
    }
  };

  const handleMessage = useCallback(
    (data: Message) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);

          return exists
            ? prev.map((m) => (m.id === data.id ? { ...m, ...data } : m))
            : [...prev, data];
        });
      }

      setLastMessages((prev) => {
        const lastMessage = prev[data.chatId];
        const isNewer =
          !lastMessage ||
          new Date(data.createdAt) > new Date(lastMessage.timestamp) ||
          (new Date(data.timestamp) > new Date(lastMessage.timestamp) &&
            data.seenStatus === "SENT");

        if (!isNewer) return prev;

        return {
          ...prev,
          [data.chatId]: data,
        };
      });
    },
    [selectedChat]
  );

  const handleUser = useCallback((data: UserStatus) => {
    setUsersStatus((prev) => {
      const exists = prev.some((m) => m.userId === data.userId);
      return exists
        ? prev.map((m) => (m.userId === data.userId ? { ...m, ...data } : m))
        : [...prev, data];
    });
  }, []);

  const handleChatUpdate = useCallback((data: ChatProps) => {
    setChats((prev) => {
      const exists = prev.some((chat) => chat.id === data.id);
      return exists
        ? prev.map((chat) =>
            chat.id === data.id ? { ...chat, ...data } : chat
          )
        : [...prev, data];
    });
  }, []);

  const fetchLastMessages = async (chatIds: string[]) => {
    try {
      const res = await api.post("/message/last-messages", { chatIds });

      setLastMessages((prev) => {
        const updated = { ...prev };

        res.data.forEach((msg: any) => {
          if (msg?.chatId) {
            updated[msg.chatId] = {
              id: msg.id,
              chatId: msg.chatId, // obrigatório
              authorId: msg.authorId,
              content: msg.message, // campo usado no frontend
              type: msg.type || "TEXT", // precisa ter tipo
              timestamp: msg.createdAt,
              seenStatus: msg.seenStatus,
              status: msg.status || null,
              createdAt: msg.createdAt, // se o tipo exigir
              updatedAt: msg.updatedAt || msg.createdAt, // se o tipo exigir
            } as Message;
          }
        });

        return updated;
      });
    } catch (err) {
      console.error("Erro ao buscar últimas mensagens:", err);
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    // Redireciona somente se o usuário já estiver logado
    if (accessToken && refreshToken) {
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      navigate("/chat");
    }
  }, [navigate]);

  useEffect(() => {
    if (refreshToken) fetchChats();
  }, [refreshToken]);
  useEffect(() => {
    if (refreshToken) {
      fetchUser();
      fetchUsers();
    }
  }, [refreshToken]);
  useEffect(() => {
    // Conecta o socket
    connectSocket(currentUser.id);
    const socket = getSocket();

    socket.emit("newMessage", currentUser.id);

    setupSocketListeners(handleMessage, handleChatUpdate, handleUser);

    return () => {
      removeSocketListeners();
    };
  }, [currentUser, handleMessage, handleChatUpdate, handleUser]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat.id);
  }, [selectedChat]);
  useEffect(() => {
    if (!currentUser?.id) return;
    if (chats.length > 0) fetchLastMessages(chats.map((c) => c.id));
  }, [chats]);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        users,
        message,
        messages,
        lastMessages,
        chats,
        selectedChat,
        createNewChat,
        error,
        groupName,
        selectedUsers,
        usersSearch,
        usersStatus,
        accessToken,
        refreshToken,
        setCurrentUser,
        setUsers,
        setChats,
        setMessages,
        setMessage,
        setSelectedChat,
        setCreateNewChat,
        setGroupName,
        setSelectedUsers,
        createChat,
        deleteChat,
        deleteMessage,
        handleSendMessage,
        fetchUsers,
        handleLogout,
        fetchChats,
        markMessagesAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat precisa estar dentro do ChatProvider");
  return ctx;
};
