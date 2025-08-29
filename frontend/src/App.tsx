import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { PrivateRoute } from "./PrivateRoute";
import Login from "./pages/login";
import Chat from "./pages/chat";
import Register from "./pages/register";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
        </Routes>
      </ChatProvider>{" "}
    </Router>
  );
}

export default App;
