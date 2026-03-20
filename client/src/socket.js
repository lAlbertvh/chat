import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

export const createSocket = (token) => {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'] // принудительно используем WebSocket, избегаем polling
  });
};
