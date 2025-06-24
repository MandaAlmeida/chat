export interface User {
    id: string;
    name: string;
    email: string;
    isOnline: boolean;
}

export interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    status: string;
    seenStatus: string
    type: string;
    chatId: string;
}

export interface LastMessage {
    id: string;
    chatId: string;
    authorId: string;
    message: string;
    type: string;
    seenStatus: string;
    status: string | null;
    createdAt: string;
    updatedAt: string;
}


export interface ChatProps {
    id: string;
    createId: string;
    name: string;
    participants: User[];
    type: string;
    deletedFor: string[]
}