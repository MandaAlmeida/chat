import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Chat from './pages/chat';
import { useEffect, useState } from 'react';
import { socket } from './socket/socketService';
import api from './api';
import type { User } from './components/ChatCreate';


function App() {
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    api.get<User>("/user").then((res) => {
      setUserId(res.data.id);
    });

    if (userId) {
      socket.emit('join', userId);
    }

  }, [userId]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
