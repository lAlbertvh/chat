import React, { useState, useEffect } from 'react';
import UserList from './UserList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const Chat = ({ user, socket, onLogout, token }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Загрузка истории сообщений
  const loadMessages = async (otherUserId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/messages/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  };

  // При выборе собеседника загружаем историю
  useEffect(() => {
    if (selectedUser) {
      setMessages([]);
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Обработчики сокетов
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (
        (msg.senderId === selectedUser?.id && msg.receiverId === user.id) ||
        (msg.senderId === user.id && msg.receiverId === selectedUser?.id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('users-list', (usersList) => {
      console.log('📋 Получен список пользователей:', usersList);
      setUsers(usersList.filter(u => u.id !== user.id));
    });

    socket.on('private-message', handleNewMessage);

    socket.on('user-online', (userId) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, online: true } : u));
    });

    socket.on('user-offline', (userId) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, online: false } : u));
    });

    console.log('📤 Запрашиваем список пользователей (get-users)');
    socket.emit('get-users');

    return () => {
      socket.off('users-list');
      socket.off('private-message', handleNewMessage);
      socket.off('user-online');
      socket.off('user-offline');
    };
  }, [socket, user.id, selectedUser]);

  const sendMessage = (content) => {
    if (!selectedUser) return;
    socket.emit('private-message', {
      receiverId: selectedUser.id,
      content
    });
  };

  // Функция отправки файла – теперь внутри компонента, token доступен
  const sendFile = async (file, receiverId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', receiverId);

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка сервера:', errorData);
      } else {
        console.log('Файл успешно отправлен');
      }
    } catch (err) {
      console.error('Ошибка загрузки файла:', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 250, borderRight: '1px solid #ccc' }}>
        <div style={{ padding: 10 }}>
          <strong>{user.username}</strong>
          <button onClick={onLogout} style={{ marginLeft: 10 }}>Выйти</button>
        </div>
        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
              Чат с {selectedUser.username}
            </div>
            <MessageList messages={messages} currentUserId={user.id} />
            {/* Передаём обе функции */}
            <MessageInput onSend={sendMessage} onSendFile={sendFile} selectedUser={selectedUser} />
          </>
        ) : (
          <div style={{ padding: 20 }}>Выберите пользователя для начала чата</div>
        )}
      </div>
    </div>
  );
};

export default Chat;
