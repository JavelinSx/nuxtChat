import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';

interface ChatMessage {
  type: 'chat' | 'system';
  data: string;
  username?: string;
  timestamp: string;
}

interface Client {
  ws: WebSocket;
  username: string;
}

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Хранение клиентов с их именами пользователей
const clients: Client[] = [];

const broadcast = (message: ChatMessage, exclude?: WebSocket) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(({ ws }) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
};

wss.on('connection', (ws) => {
  const username = `User${Math.floor(Math.random() * 1000)}`;
  clients.push({ ws, username });

  // Отправляем приветственное сообщение
  ws.send(
    JSON.stringify({
      type: 'system',
      data: `Добро пожаловать, ${username}!`,
      timestamp: new Date().toISOString(),
    })
  );

  // Оповещаем всех о новом пользователе
  broadcast(
    {
      type: 'system',
      data: `${username} присоединился к чату`,
      timestamp: new Date().toISOString(),
    },
    ws
  );

  ws.on('message', (rawMessage: string) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      const chatMessage: ChatMessage = {
        type: 'chat',
        data: message.data,
        username,
        timestamp: new Date().toISOString(),
      };

      broadcast(chatMessage);
    } catch (e) {
      console.error('Ошибка при обработке сообщения:', e);
    }
  });

  ws.on('close', () => {
    const index = clients.findIndex((client) => client.ws === ws);
    if (index !== -1) {
      const { username } = clients[index];
      clients.splice(index, 1);
      broadcast({
        type: 'system',
        data: `${username} покинул чат`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket ошибка:', error);
    const index = clients.findIndex((client) => client.ws === ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// REST эндпоинты
app.get('/api/users', (_, res) => {
  const usersList = clients.map((client) => client.username);
  res.json({ users: usersList });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
