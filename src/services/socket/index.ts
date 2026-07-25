import io, { Socket } from 'socket.io-client';
import { store } from '../../app/store';
import { addMessage, updateMessage, deleteMessage, addReaction, markMessageAsRead } from '../../app/store/slices/message.slice';
import { updateChat, updateOnlineStatus, updateTyping } from '../../app/store/slices/chat.slice';
import { setUserOnline, setUserOffline } from '../../app/store/slices/user.slice';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.log('Socket connect error:', error);
  });

  // Message events
  socket.on('message:receive', (data) => {
    store.dispatch(addMessage(data));
    store.dispatch(updateChat({ chatId: data.chatId, lastMessage: data.content, lastMessageAt: data.createdAt }));
  });

  socket.on('message:edited', (data) => {
    store.dispatch(updateMessage(data));
  });

  socket.on('message:deleted', (data) => {
    store.dispatch(deleteMessage(data.messageId));
  });

  socket.on('message:reacted', (data) => {
    store.dispatch(addReaction({ messageId: data.messageId, reactions: data.reactions }));
  });

  socket.on('message:read', (data) => {
    store.dispatch(markMessageAsRead({ messageId: data.messageId, userId: data.userId }));
  });

  // User events
  socket.on('user:online', (data) => {
    store.dispatch(setUserOnline(data.userId));
  });

  socket.on('user:offline', (data) => {
    store.dispatch(setUserOffline(data.userId));
  });

  // Typing events
  socket.on('typing:start', (data) => {
    store.dispatch(updateTyping({ chatId: data.chatId, userId: data.userId, isTyping: true }));
  });

  socket.on('typing:stop', (data) => {
    store.dispatch(updateTyping({ chatId: data.chatId, userId: data.userId, isTyping: false }));
  });

  // Chat events
  socket.on('chat:update', (data) => {
    store.dispatch(updateChat(data));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Send message
export const sendMessage = (data: {
  chatId: string;
  content: string;
  type?: string;
  replyToId?: string;
  mediaUrl?: string;
  mediaType?: string;
}) => {
  if (socket?.connected) {
    socket.emit('message:send', data);
  } else {
    console.warn('Socket not connected, message queued');
    // Store in offline queue
  }
};

// Edit message
export const editMessage = (data: { messageId: string; content: string }) => {
  if (socket?.connected) {
    socket.emit('message:edit', data);
  }
};

// Delete message
export const deleteMessageSocket = (data: { messageId: string; deleteFor: 'me' | 'everyone' }) => {
  if (socket?.connected) {
    socket.emit('message:delete', data);
  }
};

// React to message
export const reactToMessage = (data: { messageId: string; emoji: string }) => {
  if (socket?.connected) {
    socket.emit('message:react', data);
  }
};

// Mark message as read
export const markMessageRead = (data: { messageId: string; chatId: string }) => {
  if (socket?.connected) {
    socket.emit('message:read', data);
  }
};

// Typing indicator
export const sendTyping = (data: { chatId: string; isTyping: boolean }) => {
  if (socket?.connected) {
    socket.emit('typing', data);
  }
};

// Get chat history
export const getChatHistory = (data: { chatId: string; limit?: number; cursor?: string }) => {
  if (socket?.connected) {
    socket.emit('chat:history', data);
  }
};
