import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { PrivateRoute } from './PrivateRoute';
import Login from './pages/login';
import Chat from './pages/chat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

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
