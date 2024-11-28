<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useWebSocket } from '../compasobles/useWebSocket'

const { isConnected, messages, error, sendMessage } = useWebSocket()

const newMessage = ref('')
const chatContainer = ref<HTMLDivElement | null>(null)

const handleSend = () => {
  if (newMessage.value.trim()) {
    sendMessage(newMessage.value)
    newMessage.value = ''
    scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<template>
  <div class="chat-room">
    <div class="chat-status" :class="{ 'connected': isConnected }">
      {{ isConnected ? 'Подключено' : 'Отключено' }}
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>

    <div ref="chatContainer" class="chat-messages">
      <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.type">
        <div class="message-header">
          <span class="username">{{ msg.username || 'Система' }}</span>
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <div class="message-content">{{ msg.data }}</div>
      </div>
    </div>

    <div class="chat-input">
      <input v-model="newMessage" @keyup.enter="handleSend"
        :placeholder="isConnected ? 'Введите сообщение...' : 'Подключение...'" :disabled="!isConnected" />
      <button @click="handleSend" :disabled="!isConnected || !newMessage.trim()">
        Отправить
      </button>
    </div>
  </div>
</template>

<style scoped>
.message-content {
  color: #4caf50;
}

.chat-room {
  max-width: 800px;
  margin: 0 auto;
  height: 600px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chat-status {
  padding: 10px;
  background: #f44336;
  color: white;
  text-align: center;
  border-radius: 8px 8px 0 0;
}

.chat-status.connected {
  background: #4caf50;
}

.error-message {
  margin-left: 10px;
  font-size: 0.9em;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}

.message {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
  max-width: 80%;
}

.message.chat {
  background: #e3f2fd;
  margin-left: 20px;
}

.message.system {
  background: #fff3e0;
  margin: 10px auto;
  font-style: italic;
  text-align: center;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9em;
}

.username {
  font-weight: bold;
  color: #2196f3;
}

.timestamp {
  color: #757575;
}

.message-content {
  word-break: break-word;
}

.chat-input {
  display: flex;
  padding: 15px;
  background: #fff;
  border-top: 1px solid #eee;
  border-radius: 0 0 8px 8px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

button {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
</style>
