export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Message {
    sender: string;
    content: string;
    timestamp: string;
}


export interface ChatProps {
    id: string;
    name: string;
    participants: User[];
    type: string
}