export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    status: string;
    seenStatus: string
    type: string
}


export interface ChatProps {
    id: string;
    createId: string;
    name: string;
    participants: User[];
    type: string;
    deletedFor: string[]
}