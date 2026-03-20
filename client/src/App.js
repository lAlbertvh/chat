import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import { createSocket } from './socket';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(null);

  // При загрузке проверяем localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Когда появился токен, создаём сокет
  useEffect(() => {
    if (token) {
      const newSocket = createSocket(token);
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [token]);

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (socket) socket.disconnect();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // ВОТ ЗДЕСЬ ВСТАВЛЯЕТЕ СТРОКУ С token
  return <Chat user={user} socket={socket} onLogout={handleLogout} token={token} />;
}

export default App;
