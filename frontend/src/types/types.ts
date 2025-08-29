export interface User {
  id: string;
  name: string;
  email: string;
  UserStatus: boolean;
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  status: string;
  seenStatus: string;
  type: string;
  chatId: string;
  createdAt: string;
}

export interface ChatProps {
  id: string;
  createId: string;
  name: string;
  participants: User[];
  type: string;
  deletedFor: string[];
  message: Message[];
}
