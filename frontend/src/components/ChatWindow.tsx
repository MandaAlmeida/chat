import {
  CheckIcon,
  ChecksIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import api from "../api";
import { formatDateGroup } from "../utils/formatDateGroup";
import { HeaderChat } from "./headerChat";
import { useChat } from "../context/ChatContext";

export default function ChatWindow() {
  const {
    selectedChat,
    messages,
    message,
    currentUser,
    users,
    usersStatus,
    setMessage,
    setMessages,
    handleSendMessage,
    deleteMessage,
  } = useChat();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEditConfirm = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    try {
      await api.put(`/message/${editingMessageId}`, { message: editingText });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId
            ? { ...msg, content: editingText.trim(), status: "EDITED" }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditingText("");
      setMessage("");
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
    }
  };

  if (!selectedChat || !currentUser) return <p>Selecione um chat</p>;

  const groupedMessages = messages.reduce(
    (acc: Record<string, typeof messages>, msg) => {
      const groupKey = formatDateGroup(new Date(msg.timestamp));
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(msg);
      return acc;
    },
    {}
  );

  const toggleMessageSelect = (msgId: string) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) newSet.delete(msgId);
      else newSet.add(msgId);

      // Ativa/desativa o modo seleção
      setSelectionMode(newSet.size > 0);

      return newSet;
    });
  };

  // Escolhe o outro usuário
  const otherUser =
    selectedChat.type !== "GROUP"
      ? selectedChat.participants.find((p) => p.id !== currentUser?.id)
      : null;

  // Define nome do chat
  const chatName =
    selectedChat.type !== "GROUP"
      ? otherUser?.name || selectedChat.name
      : selectedChat.name;

  const otherUserId =
    selectedChat.type !== "GROUP"
      ? selectedChat.participants.find((p) => p.id !== currentUser?.id)?.id ||
        selectedChat.createId
      : null;

  const chatStatus =
    selectedChat.type !== "GROUP" && otherUserId
      ? usersStatus.find((u) => u.userId === otherUserId)?.userStatus
        ? "Online"
        : "Offline"
      : "";

  return (
    <div className="w-full h-screen flex flex-col">
      <HeaderChat name={chatName} status={chatStatus}>
        {selectedMessages.size > 0 && (
          <div className="flex gap-2">
            {selectedMessages.size === 1 && (
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-800 cursor-pointer"
                onClick={() => {
                  const msgId = Array.from(selectedMessages)[0];
                  const msg = messages.find((m) => m.id === msgId);
                  setSelectedMessages(new Set());
                  setSelectionMode(false);
                  if (msg) {
                    setEditingMessageId(msg.id);
                    setEditingText(msg.content);
                  }
                }}
              >
                Editar
              </button>
            )}

            <button
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-800 cursor-pointer"
              onClick={async () => {
                const idsToDelete = Array.from(selectedMessages);
                setMessages((prev) =>
                  prev.map((m) =>
                    idsToDelete.includes(m.id)
                      ? { ...m, status: "DELETE", content: "Mensagem excluída" }
                      : m
                  )
                );
                setSelectedMessages(new Set());
                setSelectionMode(false);
                await deleteMessage(idsToDelete);
              }}
            >
              Deletar Mensagem
            </button>
          </div>
        )}
      </HeaderChat>

      <div className="overflow-hidden overflow-y-auto p-2 rounded h-full">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Data */}
            <div className="text-center text-xs text-gray-500 my-4">{date}</div>

            {/* Mensagens */}
            {msgs
              .filter((msg) => msg.content && msg.content.trim() !== "")
              .map((msg) => {
                const isOwnMessage = msg.authorId === currentUser.id;
                const systemMessage = msg.type === "SYSTEM";
                const deletedMessage = msg.status === "DELETE";
                const isSelected = selectedMessages.has(msg.id);

                return systemMessage ? (
                  <div key={msg.id} className="text-center my-2">
                    <p className="text-sm text-gray-400">
                      {isOwnMessage
                        ? "Você"
                        : users.find((u) => u.id === msg.authorId)?.name ||
                          "Alguém"}{" "}
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className={`mb-1 text-sm flex ${
                      isOwnMessage ? "justify-end relative" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        max-w-[45%] px-3 py-2 rounded-2xl flex gap-2 items-center relative group
                        ${
                          isOwnMessage
                            ? "bg-[#9e9df0] text-white"
                            : "bg-[#F1F1F1] text-left"
                        }
                        ${selectionMode && !deletedMessage ? "mr-6" : ""}
                        ${!deletedMessage ? "hover:mr-6" : ""}
                      `}
                      onClick={() =>
                        !deletedMessage && toggleMessageSelect(msg.id)
                      }
                    >
                      {/* Conteúdo da mensagem */}
                      <p className="break-words text-start flex-1 flex flex-col">
                        {msg.content}
                        {msg.status === "EDITED" && (
                          <span
                            className={`${
                              isOwnMessage ? "text-[#ffffff]" : "text-[#949494]"
                            } italic ml-1`}
                          >
                            (editada)
                          </span>
                        )}
                      </p>

                      {/* Horário e status */}
                      <div className="flex justify-end items-center gap-1 mt-1 text-xs text-gray-600">
                        <span
                          className={`${
                            isOwnMessage ? "text-right text-white" : "text-left"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        {isOwnMessage && msg.seenStatus && (
                          <>
                            {msg.seenStatus === "SEEN" ? (
                              <ChecksIcon
                                size={14}
                                className="text-[#3e3ca0]"
                              />
                            ) : msg.seenStatus === "DELIVERED" ? (
                              <ChecksIcon size={14} className="text-gray-300" />
                            ) : (
                              <CheckIcon size={14} className="text-white" />
                            )}
                          </>
                        )}
                        {/* Checkbox para seleção */}
                        {!deletedMessage && (
                          <>
                            {/* Aparece se estiver em modo seleção ou já selecionada */}
                            {(selectionMode || isSelected) && isOwnMessage && (
                              <div className="absolute right-[-30px] top-1/2 -translate-y-1/2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMessageSelect(msg.id)}
                                />
                              </div>
                            )}

                            {/* Aparece no hover somente se não houver nada selecionado */}
                            {!selectionMode && !isSelected && isOwnMessage && (
                              <div className="absolute right-[-30px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                  type="checkbox"
                                  onChange={() => toggleMessageSelect(msg.id)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ))}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="mt-2 p-4  flex items-center border border-gray-300 rounded m-5">
        <input
          value={editingMessageId ? editingText : message}
          onChange={(e) =>
            editingMessageId
              ? setEditingText(e.target.value)
              : setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (editingMessageId) {
                handleEditConfirm();
              } else if (message.trim()) {
                handleSendMessage();
              }
            }
          }}
          placeholder="Mensagem"
          className="flex-1 outline-none"
        />
        {editingMessageId ? (
          <>
            <button
              onClick={handleEditConfirm}
              className="px-4 bg-[#615EF0] text-white rounded hover:bg-[#3e3ca0] mr-2"
            >
              OK
            </button>
            <button
              onClick={() => {
                setEditingMessageId(null);
                setEditingText("");
              }}
              className="px-4 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </>
        ) : (
          message.trim() && (
            <button
              onClick={() => {
                handleSendMessage();
              }}
              className="px-4 text-[#615EF0] rounded hover:text-[#3e3ca0] cursor-pointer"
            >
              <PaperPlaneTiltIcon size={24} weight="fill" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
