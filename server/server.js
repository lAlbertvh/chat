const { Op } = require('sequelize');
const authMiddleware = require('./middleware/auth');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { sequelize, User, Message } = require('./models');
const authRoutes = require('./routes/auth');
const { setupSocketHandlers } = require('./sockets/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // React dev server
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// HTTP Routes
app.use('/api/auth', authRoutes);

// Подключаем сокет-обработчики
setupSocketHandlers(io);

// ----- НАСТРОЙКА ЗАГРУЗКИ ФАЙЛОВ -----
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Эндпоинт загрузки файла
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
  console.log('📁 Запрос на загрузку файла');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  try {
    const { receiverId } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Сохраняем сообщение в БД
    const message = await Message.create({
      senderId: req.user.id,
      receiverId: receiverId || null,
      content: `/uploads/${file.filename}`,
      type: 'file'
    });

    // Загружаем сообщение с информацией об отправителе
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
    });

    // Отправляем получателю через сокет, если он онлайн
    // Пока закомментировано, так как onlineUsers не экспортируется из sockets/chat.js
    // if (receiverId) {
    //   const receiverSocketId = onlineUsers.get(receiverId);
    //   if (receiverSocketId) {
    //     io.to(receiverSocketId).emit('private-message', messageWithSender);
    //   }
    // }

    res.json({ message: messageWithSender });
  } catch (err) {
    console.error('Ошибка загрузки файла:', err);
    res.status(500).json({ error: err.message });
  }
});

// Раздача статических файлов (для разработки)
app.use('/uploads', express.static(uploadDir));

// ----- КОНЕЦ НАСТРОЙКИ ФАЙЛОВ -----

// Синхронизация с БД и запуск
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('📦 База данных синхронизирована');
  
  server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Ошибка подключения к БД:', err);
});

app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;
    
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId }
        ],
        roomId: null
      },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
