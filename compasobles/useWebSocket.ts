import { ref } from 'vue';

export interface ChatMessage {
  type: 'chat' | 'system';
  data: string;
  username?: string;
  timestamp: string;
}

export function useWebSocket() {
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const messages = ref<ChatMessage[]>([]);
  const error = ref<string | null>(null);

  // Используем useState из Nuxt для сохранения состояния между страницами
  const messageHistory = useState<ChatMessage[]>('messageHistory', () => []);

  const connect = () => {
    const wsUrl = 'ws://localhost:3001';
    try {
      socket.value = new WebSocket(wsUrl);

      socket.value.onopen = () => {
        isConnected.value = true;
        error.value = null;
        console.log('WebSocket соединение установлено');
      };

      socket.value.onmessage = (event: MessageEvent) => {
        try {
          const message: ChatMessage = JSON.parse(event.data);
          messages.value.push(message);
          messageHistory.value.push(message);
          // Ограничиваем историю последними 100 сообщениями
          if (messageHistory.value.length > 100) {
            messageHistory.value.shift();
          }
        } catch (e) {
          console.error('Ошибка при парсинге сообщения:', e);
        }
      };

      socket.value.onerror = (event: Event) => {
        error.value = 'Произошла ошибка с WebSocket соединением';
        console.error('WebSocket ошибка:', event);
      };

      socket.value.onclose = () => {
        isConnected.value = false;
        console.log('WebSocket соединение закрыто');
        // Попытка переподключения через 5 секунд
        setTimeout(connect, 5000);
      };
    } catch (e) {
      error.value = 'Не удалось установить WebSocket соединение';
      console.error('Ошибка при создании WebSocket:', e);
    }
  };

  const disconnect = () => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.close();
    }
  };

  const sendMessage = (message: string) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(
        JSON.stringify({
          type: 'chat',
          data: message,
        })
      );
    } else {
      error.value = 'WebSocket не подключен';
    }
  };

  // Автоматическое подключение при клиентском рендеринге
  if (process.client) {
    onMounted(() => {
      connect();
    });

    onUnmounted(() => {
      disconnect();
    });
  }

  return {
    isConnected,
    messages: messageHistory,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}
