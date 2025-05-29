import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { PrivateRoute } from './PrivateRoute';
import Login from './pages/login';
import Chat from './pages/chat';
import Register from './pages/register';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
