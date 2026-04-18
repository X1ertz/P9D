import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import GameTable from './components/GameTable';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // In production the server serves both client & API from the same origin
    const serverUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:4000';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleLoginSuccess = (user) => {
    setUsername(user);
  };

  if (!username) {
    return <Login socket={socket} onLoginSuccess={handleLoginSuccess} />;
  }

  return <GameTable socket={socket} username={username} />;
}

export default App;
