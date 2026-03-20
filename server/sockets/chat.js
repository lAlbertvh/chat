const jwt = require('jsonwebtoken');
const { User, Message } = require('../models');

// Хранилище подключений (в production лучше использовать Redis)
const onlineUsers = new Map(); // userId -> socketId

function setupSocketHandlers(io) {
  // Middleware для аутентификации сокетов через JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      socket.userId = decoded.id;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`👤 Пользователь ${socket.userId} подключился`);

    // Сохраняем в онлайн
    onlineUsers.set(socket.userId, socket.id);
    
    // Обновляем статус в БД
    User.update({ online: true, lastSeen: new Date() }, {
      where: { id: socket.userId }
    });

    // Оповещаем всех о новом онлайн-пользователе
    socket.broadcast.emit('user-online', socket.userId);

    // Получение списка всех пользователей
    socket.on('get-users', async () => {
    console.log(`📥 Получен запрос get-users от ${socket.userId}`);
      try {
        const users = await User.findAll({
          attributes: ['id', 'username', 'online', 'lastSeen']
        });
        console.log(`📤 Отправляем users-list (${users.length} пользователей)`);
        socket.emit('users-list', users);
      } catch (err) {
        console.error('Ошибка получения пользователей:', err);
      }
    });

    // Личное сообщение
    socket.on('private-message', async (data) => {
      try {
        const { receiverId, content } = data;
        
        // Сохраняем в БД
        const message = await Message.create({
          senderId: socket.userId,
          receiverId: receiverId,
          content: content,
          type: 'text'
        });

        // Загружаем с информацией об отправителе
        const messageWithSender = await Message.findByPk(message.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
        });

        // Отправляем получателю, если он онлайн
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('private-message', messageWithSender);
        }
        
        // Отправляем подтверждение отправителю
        socket.emit('message-sent', messageWithSender);
        
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        socket.emit('error', 'Не удалось отправить сообщение');
      }
    });

    // Индикатор печатания
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });

    // Отключение
    socket.on('disconnect', async () => {
      console.log(`👋 Пользователь ${socket.userId} отключился`);
      onlineUsers.delete(socket.userId);
      
      await User.update({ online: false, lastSeen: new Date() }, {
        where: { id: socket.userId }
      });
      
      socket.broadcast.emit('user-offline', socket.userId);
    });
  });
}

module.exports = { setupSocketHandlers };
