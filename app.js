const { useState, useEffect, useRef, useCallback, useMemo, Fragment } = React;

// ============================================================
// DATA LAYER – localStorage + BroadcastChannel
// ============================================================
const DB = {
  get(key, def) {
    try {
      const d = localStorage.getItem('pilogram_' + key);
      return d ? JSON.parse(d) : def;
    } catch (e) { return def; }
  },
  set(key, val) {
    localStorage.setItem('pilogram_' + key, JSON.stringify(val));
  },
  push(key, item) {
    const arr = this.get(key, []);
    arr.push(item);
    this.set(key, arr);
    return arr;
  },
  remove(key, id) {
    const arr = this.get(key, []);
    const filtered = arr.filter(i => i.id !== id);
    this.set(key, filtered);
    return filtered;
  },
  update(key, id, upd) {
    const arr = this.get(key, []);
    const idx = arr.findIndex(i => i.id === id);
    if (idx > -1) {
      arr[idx] = { ...arr[idx], ...upd };
      this.set(key, arr);
      return arr[idx];
    }
    return null;
  },
  find(key, id) {
    const arr = this.get(key, []);
    return arr.find(i => i.id === id) || null;
  },
};

const channel = new BroadcastChannel('pilogram_sync');
let syncListeners = [];

function broadcast(event, data) {
  channel.postMessage({ event, data, time: Date.now() });
}

function onSync(cb) {
  syncListeners.push(cb);
  return () => { syncListeners = syncListeners.filter(l => l !== cb); };
}

channel.onmessage = (e) => {
  syncListeners.forEach(cb => cb(e.data));
};

// ============================================================
// SEED DATA
// ============================================================
function seedData() {
  if (DB.get('seeded', false)) return;
  const ME = {
    id: 'me',
    name: 'Rahul Kumar',
    phone: '+91 98765 43210',
    avatar: 'R',
    color: '#7C3AED',
    photo: null,
    about: 'Building cool stuff',
    username: 'rahul_dev',
    bio: 'Full-stack developer'
  };
  DB.set('users', [ME]);

  const CHATS = [
    { id: '1', type: 'private', name: 'Priya Sharma', avatar: 'P', color: '#ec4899', photo: null,
      lastMsg: 'Hey! How are you? 😊', time: '2:34 PM', unread: 3, online: true, participants: ['me', 'priya'], pinned: false, muted: false },
    { id: '2', type: 'private', name: 'Amit Patel', avatar: 'A', color: '#3b82f6', photo: null,
      lastMsg: 'Project update ready', time: '1:15 PM', unread: 1, online: true, participants: ['me', 'amit'], pinned: false, muted: false },
    { id: '3', type: 'private', name: 'Sneha Gupta', avatar: 'S', color: '#10b981', photo: null,
      lastMsg: 'Sent you the files', time: '12:40 PM', unread: 0, online: false, participants: ['me', 'sneha'], pinned: false, muted: false },
    { id: '4', type: 'group', name: 'Dev Team', avatar: 'D', color: '#f59e0b', photo: null,
      lastMsg: 'Sprint planning at 4', time: '11:30 AM', unread: 5, online: false, participants: ['me', 'amit', 'sneha', 'neha'], pinned: true, muted: false, isGroup: true },
    { id: '5', type: 'private', name: 'Neha Singh', avatar: 'N', color: '#8b5cf6', photo: null,
      lastMsg: 'Thanks for the help!', time: 'Yesterday', unread: 0, online: true, participants: ['me', 'neha'], pinned: false, muted: false },
    { id: '6', type: 'private', name: 'Ravi Kumar', avatar: 'R', color: '#06b6d4', photo: null,
      lastMsg: 'See you tomorrow', time: 'Yesterday', unread: 0, online: false, participants: ['me', 'ravi'], pinned: false, muted: false },
    { id: '7', type: 'group', name: 'Family Group', avatar: 'F', color: '#ef4444', photo: null,
      lastMsg: 'Mom: Dinner at 8?', time: 'Yesterday', unread: 2, online: false, participants: ['me', 'priya', 'neha', 'ravi'], pinned: false, muted: true, isGroup: true },
  ];
  DB.set('chats', CHATS);

  const MESSAGES = [
    { id: 'm1', chatId: '1', from: 'priya', text: 'Hey Rahul! Long time no see 😊', time: '2:30 PM', type: 'text', reactions: {}, seen: true, delivered: true, edited: false },
    { id: 'm2', chatId: '1', from: 'me', text: 'Hey Priya! How have you been?', time: '2:31 PM', type: 'text', reactions: {}, seen: true, delivered: true, edited: false },
    { id: 'm3', chatId: '1', from: 'priya', text: 'Great! Just finished a big project at work. You?', time: '2:32 PM', type: 'text', reactions: { '❤️': ['me'] }, seen: true, delivered: true, edited: false },
    { id: 'm4', chatId: '1', from: 'me', text: 'Same here! Working on this new messaging app', time: '2:33 PM', type: 'text', reactions: {}, seen: true, delivered: true, edited: false },
    { id: 'm5', chatId: '1', from: 'priya', text: 'Oh cool! That sounds interesting. What tech stack?', time: '2:33 PM', type: 'text', reactions: {}, seen: true, delivered: true, edited: false },
    { id: 'm6', chatId: '1', from: 'me', text: 'Next.js + React + Prisma. Building something really cool 🚀', time: '2:34 PM', type: 'text', reactions: { '🔥': ['priya'] }, seen: true, delivered: true, edited: false },
    { id: 'm7', chatId: '1', from: 'priya', text: 'That\'s amazing! Can\'t wait to see it 👏', time: '2:34 PM', type: 'text', reactions: {}, seen: true, delivered: true, edited: false },
    { id: 'm8', chatId: '2', from: 'amit', text: 'Project update is ready for review', time: '1:15 PM', type: 'text', reactions: {}, seen: false, delivered: true, edited: false },
    { id: 'm9', chatId: '4', from: 'amit', text: 'Sprint planning at 4 PM today', time: '11:30 AM', type: 'text', reactions: { '👍': ['me', 'sneha'] }, seen: true, delivered: true, edited: false },
    { id: 'm10', chatId: '7', from: 'priya', text: 'Mom: Dinner at 8?', time: 'Yesterday', type: 'text', reactions: {}, seen: false, delivered: true, edited: false },
  ];
  DB.set('messages', MESSAGES);

  const CHANNELS = [
    { id: 'c1', name: 'Tech News Daily', avatar: 'T', color: '#3b82f6', photo: null, subs: 12400, desc: 'Latest technology news and updates', isOfficial: true, isPrivate: false },
    { id: 'c2', name: 'Design Inspo', avatar: 'D', color: '#ec4899', photo: null, subs: 8700, desc: 'UI/UX design inspiration & resources', isOfficial: false, isPrivate: false },
    { id: 'c3', name: 'Crypto Signals', avatar: 'C', color: '#f59e0b', photo: null, subs: 34200, desc: 'Real-time crypto market signals', isOfficial: false, isPrivate: false },
    { id: 'c4', name: 'Meme Factory', avatar: 'M', color: '#10b981', photo: null, subs: 56000, desc: 'Best memes on the internet 🐸', isOfficial: false, isPrivate: false },
    { id: 'c5', name: 'Startups India', avatar: 'S', color: '#8b5cf6', photo: null, subs: 9100, desc: 'Indian startup ecosystem updates', isOfficial: true, isPrivate: false },
  ];
  DB.set('channels', CHANNELS);

  const POSTS = [
    { id: 'p1', channelId: 'c1', text: '🚀 Just launched our new AI-powered chat feature! Real-time translation, smart replies, and emoji predictions. What do you think?', mediaUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop', kind: 'mixed', views: 4230, reactions: { '❤️': ['u1', 'u2'], '👍': ['u3'], '🔥': ['u4', 'u5'] }, time: '3:45 PM' },
    { id: 'p2', channelId: 'c1', text: 'Breaking: Apple announces M4 chip with 40% faster ML performance. The future of on-device AI is here.', mediaUrl: null, kind: 'text', views: 8120, reactions: { '😮': ['u1', 'u2', 'u6'], '🔥': ['u3'] }, time: '1:20 PM' },
    { id: 'p3', channelId: 'c2', text: 'Beautiful sunset from the office rooftop today 🌅', mediaUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600&h=800&fit=crop', kind: 'mixed', views: 2100, reactions: { '❤️': ['u2', 'u3', 'u7'], '😮': ['u5'] }, time: '11:05 AM' },
  ];
  DB.set('posts', POSTS);

  const STORIES = [
    { id: 's0', userId: 'me', name: 'Your Story', avatar: 'R', color: '#7C3AED', isMine: true, text: 'Good morning! ☀️', time: '8:30 AM', expiresAt: Date.now() + 86400000, views: 12, seenBy: ['priya', 'amit'] },
    { id: 's1', userId: 'priya', name: 'Priya', avatar: 'P', color: '#ec4899', seen: false, text: 'Working on something exciting!', time: '10:15 AM', expiresAt: Date.now() + 86400000, views: 5, seenBy: ['me'] },
    { id: 's2', userId: 'amit', name: 'Amit', avatar: 'A', color: '#3b82f6', seen: false, text: 'New coffee shop opened ☕', time: '9:45 AM', expiresAt: Date.now() + 86400000, views: 8, seenBy: ['me'] },
    { id: 's3', userId: 'sneha', name: 'Sneha', avatar: 'S', color: '#10b981', seen: true, text: 'Weekend vibes ✨', time: 'Yesterday', expiresAt: Date.now() - 3600000, views: 15, seenBy: ['me'] },
  ];
  DB.set('stories', STORIES);

  const CALLS = [
    { id: 'cl1', userId: 'priya', name: 'Priya Sharma', avatar: 'P', color: '#ec4899', type: 'outgoing', time: '2:00 PM', duration: '5:23' },
    { id: 'cl2', userId: 'amit', name: 'Amit Patel', avatar: 'A', color: '#3b82f6', type: 'missed', time: '1:15 PM', duration: '' },
    { id: 'cl3', userId: 'sneha', name: 'Sneha Gupta', avatar: 'S', color: '#10b981', type: 'incoming', time: '11:30 AM', duration: '12:45' },
    { id: 'cl4', userId: 'neha', name: 'Neha Singh', avatar: 'N', color: '#8b5cf6', type: 'outgoing', time: 'Yesterday', duration: '3:10' },
  ];
  DB.set('calls', CALLS);
  DB.set('seeded', true);
}
seedData();

// ============================================================
// DATA SERVICE
// ============================================================
const DataService = {
  getMe() { return DB.get('users', []).find(u => u.id === 'me') || null; },
  updateMe(data) { const me = this.getMe(); if (me) { DB.update('users', 'me', data); return { ...me, ...data }; } return null; },
  getUsers() { return DB.get('users', []); },
  getUser(id) { return DB.find('users', id); },
  getChats() { return DB.get('chats', []); },
  getChat(id) { return DB.find('chats', id); },
  updateChat(id, data) { return DB.update('chats', id, data); },
  addChat(chat) { DB.push('chats', chat); return chat; },
  getMessages(chatId) { return DB.get('messages', []).filter(m => m.chatId === chatId).sort((a, b) => a.time.localeCompare(b.time)); },
  addMessage(msg) { DB.push('messages', msg); return msg; },
  updateMessage(id, data) { return DB.update('messages', id, data); },
  getChannels() { return DB.get('channels', []); },
  getChannel(id) { return DB.find('channels', id); },
  getPosts(channelId) { return DB.get('posts', []).filter(p => p.channelId === channelId); },
  addPost(post) { DB.push('posts', post); return post; },
  getStories() { return DB.get('stories', []); },
  addStory(story) { DB.push('stories', story); return story; },
  updateStory(id, data) { return DB.update('stories', id, data); },
  getCalls() { return DB.get('calls', []); },
  addCall(call) { DB.push('calls', call); return call; },
  toggleReaction(targetType, targetId, emoji, userId) {
    const key = targetType === 'message' ? 'messages' : 'posts';
    const item = DB.find(key, targetId);
    if (!item) return null;
    const reactions = item.reactions || {};
    if (reactions[emoji]) {
      const idx = reactions[emoji].indexOf(userId);
      if (idx > -1) reactions[emoji].splice(idx, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      for (const [e, users] of Object.entries(reactions)) {
        const idx = users.indexOf(userId);
        if (idx > -1) users.splice(idx, 1);
        if (users.length === 0) delete reactions[e];
      }
      reactions[emoji] = [userId];
    }
    const updated = { ...item, reactions };
    DB.update(key, targetId, { reactions });
    broadcast('reaction_update', { targetType, targetId, reactions, userId, emoji });
    return updated;
  },
  setTyping(chatId, userId, isTyping) {
    broadcast('typing', { chatId, userId, isTyping, time: Date.now() });
  },
  markRead(chatId, userId) {
    const msgs = DB.get('messages', []).filter(m => m.chatId === chatId && m.from !== userId && !m.seen);
    msgs.forEach(m => DB.update('messages', m.id, { seen: true }));
    const chat = DB.find('chats', chatId);
    if (chat) DB.update('chats', chatId, { unread: 0 });
    broadcast('read_update', { chatId, userId, time: Date.now() });
  },
};

// ============================================================
// CUSTOM HOOKS
// ============================================================
function useData(key, initial) {
  const [data, setData] = useState(() => DB.get(key, initial));
  useEffect(() => {
    const handler = (e) => {
      if (e.event === key + '_update') {
        setData(DB.get(key, initial));
      }
    };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DB.get(key, initial);
      if (JSON.stringify(fresh) !== JSON.stringify(data)) setData(fresh);
    }, 3000);
    return () => { clearInterval(interval); };
  }, [key]);
  return [data, (newData) => { DB.set(key, newData); setData(newData); broadcast(key + '_update', newData); }];
}

function useChatMessages(chatId) {
  const [messages, setMessages] = useState(() => DataService.getMessages(chatId));
  useEffect(() => {
    const handler = (e) => {
      if (e.event === 'message_new' && e.data.chatId === chatId) {
        setMessages(prev => [...prev, e.data]);
      }
      if (e.event === 'reaction_update' && e.data.targetType === 'message') {
        setMessages(prev => prev.map(m => m.id === e.data.targetId ? { ...m, reactions: e.data.reactions } : m));
      }
    };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getMessages(chatId);
      if (JSON.stringify(fresh) !== JSON.stringify(messages)) setMessages(fresh);
    }, 3000);
    return () => { clearInterval(interval); };
  }, [chatId]);
  const sendMessage = (text, type = 'text', mediaUrl = null) => {
    const msg = {
      id: 'm_' + Date.now(),
      chatId,
      from: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      mediaUrl,
      reactions: {},
      seen: false,
      delivered: true,
      edited: false,
    };
    DataService.addMessage(msg);
    const chat = DataService.getChat(chatId);
    if (chat) {
      DataService.updateChat(chatId, { lastMsg: text, time: msg.time, unread: (chat.unread || 0) + 1 });
    }
    setMessages(prev => [...prev, msg]);
    broadcast('message_new', msg);
    broadcast('chat_update', { chatId, lastMsg: text, time: msg.time });
    return msg;
  };
  const toggleReaction = (msgId, emoji) => {
    const updated = DataService.toggleReaction('message', msgId, emoji, 'me');
    if (updated) {
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
    }
  };
  return { messages, sendMessage, toggleReaction };
}

// ============================================================
// ICONS (SVG via Lucide) – we use the <Icon> component defined below
// ============================================================
const VerifiedBadge = ({ size = 14, title = 'Verified' }) => (
  <span className="verified-badge" style={{ width: size, height: size }} title={title}>
    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
  </span>
);

// Icon component using Lucide SVG (we use the same names as before)
const Icon = ({ name, size = 20, className = '' }) => {
  const icons = {
    message: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    megaphone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
    camera: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
    smile: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    attach: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    mic: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    more: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    doubleCheck: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 6 7 17 2 12"/><polyline points="22 6 11 17"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    moon: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    sun: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    palette: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    crown: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2 17l2-11 4 4 4-8 4 8 4-4 2 11H2z" fill="#f59e0b"/></svg>,
    share: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    bookmark: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    qrcode: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="21" y1="21" x2="21" y2="21.01"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    pin: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    incoming: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
    outgoing: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 7 20 12 15 17"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>,
    missed: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 7 20 12 15 17"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/><line x1="4" y1="4" x2="20" y2="20"/></svg>,
    archive: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>,
    mute: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
    unMute: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  };
  return <span className={`inline-flex items-center justify-center ${className}`}>{icons[name] || null}</span>;
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Avatar({ text, color, size = 'md', photo = null }) {
  const s = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-[12px]', lg: 'w-14 h-14 text-[16px]', xl: 'w-20 h-20 text-[24px]' }[size] || 'w-10 h-10 text-[12px]';
  if (photo) return <img src={photo} alt="" className={`${s} rounded-full object-cover ring-2 ring-white/20`} />;
  return <div className={`${s} rounded-full grid place-items-center font-bold text-white shrink-0`} style={{ background: `linear-gradient(135deg,${color},${color}dd)` }}>{text}</div>;
}

function OnlineDot({ online }) {
  if (!online) return null;
  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />;
}

function Badge({ count }) {
  if (!count) return null;
  return <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold grid place-items-center">{count > 99 ? '99+' : count}</span>;
}

function Toast({ message, icon = 'check', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast"><span className="toast-icon"><Icon name={icon} size={16} /></span><span>{message}</span></div>;
}

// ============================================================
// CHATS TAB
// ============================================================
function ChatsTab({ onOpenChat }) {
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState(() => DataService.getChats());
  useEffect(() => {
    const handler = (e) => {
      if (e.event === 'chat_update' || e.event === 'chats_update') setChats(DataService.getChats());
      if (e.event === 'message_new') {
        setChats(prev => prev.map(c => c.id === e.data.chatId ? { ...c, lastMsg: e.data.text, time: e.data.time, unread: (c.unread || 0) + 1 } : c));
      }
    };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getChats();
      if (JSON.stringify(fresh) !== JSON.stringify(chats)) setChats(fresh);
    }, 3000);
    return () => { clearInterval(interval); };
  }, []);
  const filtered = chats.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const pinned = filtered.filter(c => c.pinned);
  const unpinned = filtered.filter(c => !c.pinned);
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
          <input className="msg-input pl-9 text-[13px]" placeholder="Search chats..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {pinned.length > 0 && (
          <>
            <div className="px-4 py-1 text-[11px] font-bold text-muted uppercase tracking-wider">Pinned</div>
            {pinned.map(c => <ChatRow key={c.id} chat={c} onOpen={() => onOpenChat(c)} />)}
          </>
        )}
        {unpinned.map(c => <ChatRow key={c.id} chat={c} onOpen={() => onOpenChat(c)} />)}
        {filtered.length === 0 && <div className="text-center py-10 text-muted text-[14px]">No chats found</div>}
      </div>
    </div>
  );
}

function ChatRow({ chat, onOpen }) {
  return (
    <div onClick={onOpen} className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 cursor-pointer transition-colors">
      <div className="relative">
        <Avatar text={chat.avatar} color={chat.color} photo={chat.photo} />
        <OnlineDot online={chat.online} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold truncate flex items-center gap-1">
            {chat.name}
            {chat.isGroup && <span className="text-[10px] text-muted font-normal">group</span>}
          </span>
          <span className="text-[11px] text-muted shrink-0 ml-2">{chat.time}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[13px] text-muted truncate flex items-center gap-1">
            {chat.muted && <Icon name="mute" size={12} className="text-muted/40" />}
            {chat.lastMsg}
          </span>
          {chat.unread > 0 && <Badge count={chat.unread} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHAT VIEW
// ============================================================
function ChatView({ chat, onBack }) {
  const [msg, setMsg] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const scrollRef = useRef(null);
  const { messages, sendMessage, toggleReaction } = useChatMessages(chat.id);
  const EMOJIS = ['😊','😂','❤️','👍','🔥','🎉','😢','🙏','😍','🤔','💯','✨','🚀','😎','🥺','🤗','😅','🥰','👏','💪','👀','🫡','💀','🤝'];
  const me = DataService.getMe();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    DataService.markRead(chat.id, 'me');
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMessage(msg.trim());
    setMsg('');
    setShowEmoji(false);
    setReplyingTo(null);
  };

  const handleReaction = (msgId, emoji) => toggleReaction(msgId, emoji);

  const getSender = (from) => {
    if (from === 'me') return { name: 'You', isMe: true };
    const users = DataService.getUsers();
    const user = users.find(u => u.id === from);
    return { name: user ? user.name : from, isMe: false };
  };

  const renderMessage = (m) => {
    const sender = getSender(m.from);
    const isMe = sender.isMe;
    const reactions = m.reactions || {};
    const reactionKeys = Object.keys(reactions);
    return (
      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
        <div className="max-w-[80%]">
          {!isMe && chat.isGroup && (
            <div className="text-[11px] font-semibold text-muted mb-0.5 ml-1.5">{sender.name}</div>
          )}
          <div className={`relative px-3.5 py-2.5 ${isMe ? 'chat-bubble-out' : 'chat-bubble-in'}`}>
            {replyingTo && replyingTo.id === m.id && (
              <div className="text-[11px] text-muted/70 mb-1 border-l-2 border-primary pl-2">
                Replying to: {replyingTo.text.slice(0,40)}...
              </div>
            )}
            <p className="text-[14px] leading-snug">{m.text}</p>
            <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-white/60' : 'text-muted'}`}>
              <span className="text-[10px]">{m.time}</span>
              {isMe && <Icon name="doubleCheck" size={14} className={m.seen ? 'text-blue-300' : 'text-white/40'} />}
            </div>
          </div>
          {reactionKeys.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-0.5 ml-1">
              {reactionKeys.map(e => (
                <span key={e} className="text-[12px] bg-card/80 rounded-full px-1.5 py-0.5 border border-border/30">
                  {e} {reactions[e].length}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition">
            {['❤️','👍','😂','🔥'].map(e => (
              <button key={e} onClick={() => handleReaction(m.id, e)} className="text-[14px] hover:scale-110 transition"> {e} </button>
            ))}
            <button onClick={() => { setReplyingTo(m); }} className="text-[11px] text-muted hover:text-primary transition px-1">↩</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="glass-strong px-3 py-2.5 flex items-center gap-3 border-b border-border/50 z-10">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="back" size={20} /></button>
        <Avatar text={chat.avatar} color={chat.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold flex items-center gap-1">{chat.name}<VerifiedBadge size={12} /></div>
          <div className="text-[11px] text-emerald-500 font-medium">{chat.online ? 'online' : 'last seen recently'}</div>
        </div>
        <button className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="phone" size={18} /></button>
        <button onClick={() => setShowActions(!showActions)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="more" size={18} /></button>
      </div>

      {showActions && (
        <div className="absolute top-16 right-3 z-20 bg-card border border-border rounded-xl shadow-lg p-1 animate-scaleIn min-w-[160px]">
          {[{ icon:'pin', label:'Pin chat' }, { icon:'mute', label:'Mute notifications' }, { icon:'archive', label:'Archive' }, { icon:'user', label:'View profile' }].map(a => (
            <button key={a.label} onClick={() => setShowActions(false)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted rounded-lg transition">
              <Icon name={a.icon} size={16} className="text-muted" /> {a.label}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2" style={{ background: 'var(--muted-bg)' }}>
        {messages.length === 0 && <div className="text-center py-10 text-muted text-[14px]">No messages yet. Say hello! 👋</div>}
        {messages.map(renderMessage)}
        {replyingTo && (
          <div className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-xl p-2 flex items-center justify-between animate-fadeIn z-10">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-primary">Replying to</div>
              <div className="text-[13px] truncate text-muted">{replyingTo.text}</div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="w-7 h-7 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="x" size={16} /></button>
          </div>
        )}
      </div>

      {showEmoji && (
        <div className="border-t border-border bg-card p-2 animate-slideUp">
          <div className="grid grid-cols-8 gap-1 max-h-[160px] overflow-y-auto no-scrollbar">
            {EMOJIS.map(e => <button key={e} onClick={() => { setMsg(prev => prev + e) }} className="text-[22px] p-1.5 rounded-lg hover:bg-muted active:scale-90 transition">{e}</button>)}
          </div>
        </div>
      )}

      <div className="glass-strong border-t border-border/50 px-3 py-2 flex items-center gap-2">
        <button onClick={() => setShowEmoji(!showEmoji)} className={`w-9 h-9 grid place-items-center rounded-full transition ${showEmoji ? 'text-primary bg-primary/10' : 'text-muted hover:bg-muted'}`}><Icon name="smile" size={22} /></button>
        <input className="msg-input flex-1 text-[14px]" placeholder="Message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
        {msg.trim() ? <button onClick={handleSend} className="w-9 h-9 grid place-items-center rounded-full bg-primary text-white active:scale-90 transition"><Icon name="send" size={18} /></button>
        : <><button className="w-9 h-9 grid place-items-center rounded-full text-muted hover:bg-muted transition"><Icon name="attach" size={20} /></button><button className="w-9 h-9 grid place-items-center rounded-full text-muted hover:bg-muted transition"><Icon name="mic" size={20} /></button></>}
      </div>
    </div>
  );
}

// ============================================================
// CHANNELS TAB
// ============================================================
function ChannelsTab({ onOpenChannel }) {
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState(() => DataService.getChannels());
  useEffect(() => {
    const handler = (e) => { if (e.event === 'channels_update') setChannels(DataService.getChannels()); };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getChannels();
      if (JSON.stringify(fresh) !== JSON.stringify(channels)) setChannels(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const filtered = channels.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
          <input className="msg-input pl-9 text-[13px]" placeholder="Search channels..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.map(ch => (
          <div key={ch.id} onClick={() => onOpenChannel(ch)} className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 cursor-pointer transition-colors">
            <Avatar text={ch.avatar} color={ch.color} photo={ch.photo} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold flex items-center gap-1"><span className="truncate">{ch.name}</span><VerifiedBadge size={12} />{ch.isOfficial && <Icon name="crown" size={12} />}</div>
              <div className="text-[12px] text-muted truncate">{ch.subs.toLocaleString()} subscribers</div>
            </div>
            <Icon name="chevronRight" size={16} className="text-muted/50" />
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-10 text-muted text-[14px]">No channels found</div>}
      </div>
    </div>
  );
}

// ============================================================
// CHANNEL VIEW
// ============================================================
function ChannelView({ channel, onBack }) {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState(() => DataService.getPosts(channel.id));
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [wp, setWp] = useState(null);
  const me = DataService.getMe();

  useEffect(() => {
    const handler = (e) => {
      if (e.event === 'post_new' && e.data.channelId === channel.id) setPosts(prev => [...prev, e.data]);
      if (e.event === 'reaction_update' && e.data.targetType === 'post') {
        setPosts(prev => prev.map(p => p.id === e.data.targetId ? { ...p, reactions: e.data.reactions } : p));
      }
    };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getPosts(channel.id);
      if (JSON.stringify(fresh) !== JSON.stringify(posts)) setPosts(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, [channel.id]);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = { id: 'p_' + Date.now(), channelId: channel.id, text: newPost.trim(), mediaUrl: null, kind: 'text', views: 0, reactions: {}, time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), authorId: 'me' };
    DataService.addPost(post);
    setPosts(prev => [...prev, post]);
    broadcast('post_new', post);
    setNewPost('');
  };

  const toggleReaction = (postId, emoji) => {
    const updated = DataService.toggleReaction('post', postId, emoji, 'me');
    if (updated) setPosts(prev => prev.map(p => p.id === postId ? updated : p));
  };

  const WP_PRESETS = [
    { id:'default', label:'Default', bg:'#0a0a0f' }, { id:'plain', label:'Plain', bg:'#f5f5f7' },
    { id:'dark', label:'Dark', bg:'#1a1a1f' }, { id:'navy', label:'Navy', bg:'#0a1f3d' },
    { id:'purple', label:'Purple', bg:'#2a1f3d' }, { id:'green', label:'Green', bg:'#0d2818' },
    { id:'rose', label:'Rose', bg:'#3d0a1f' }, { id:'sunset', label:'Sunset', bg:'#3d2a0a' },
    { id:'ocean', label:'Ocean', bg:'#0a2a3d' },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {wp && <div className="wallpaper-overlay" style={{ backgroundColor: wp }} />}
      <div className="glass-strong px-3 py-2.5 flex items-center gap-3 border-b border-border/50 z-10 relative">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="back" size={20} /></button>
        <Avatar text={channel.avatar} color={channel.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold flex items-center gap-1"><span className="truncate">{channel.name}</span><VerifiedBadge size={12} />{channel.isOfficial && <Icon name="crown" size={12} />}</div>
          <div className="text-[11px] text-muted">{channel.subs.toLocaleString()} subscribers</div>
        </div>
        <button onClick={() => setShowWallpaper(true)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="palette" size={18} /></button>
        <button className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="bell" size={18} /></button>
        <button className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="more" size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-1.5 relative z-[1]">
        <div className="channel-post bg-card/80 backdrop-blur rounded-xl p-4 text-center animate-fadeIn">
          <Avatar text={channel.avatar} color={channel.color} size="xl" photo={channel.photo} />
          <h3 className="text-[18px] font-extrabold mt-2 flex items-center justify-center gap-1">{channel.name}<VerifiedBadge size={14} /></h3>
          <p className="text-[12px] text-muted mt-1">{channel.desc}</p>
          <p className="text-[11px] text-muted mt-2">{channel.subs.toLocaleString()} subscribers · <Icon name="lock" size={10} /> End-to-end encrypted</p>
        </div>
        {posts.map(p => (
          <div key={p.id} className="channel-post bg-card/80 backdrop-blur rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 px-3 pt-1.5 pb-0">
              <Avatar text={channel.avatar} color={channel.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}><span className="truncate">{channel.name}</span><VerifiedBadge size={10} /></div>
                <div className="text-[9px] text-muted/50">{p.time}</div>
              </div>
              <button className="w-5 h-5 grid place-items-center rounded-full hover:bg-muted/50 text-muted/40"><Icon name="more" size={12} /></button>
            </div>
            {p.mediaUrl && <div className="px-3 pt-1"><img src={p.mediaUrl} alt="" className="w-full h-auto rounded-lg cursor-pointer active:opacity-90 transition" style={{ maxHeight:'70vh', objectFit:'contain' }} loading="lazy" /></div>}
            {p.text && <div className="px-3 pb-0.5 pt-0.5 text-[13px] leading-snug whitespace-pre-wrap break-words">{p.text}</div>}
            <div className="px-3 pb-1.5 pt-0 flex items-center gap-1 text-[10px] text-muted/50 font-medium flex-wrap">
              <span className="flex items-center gap-0.5"><Icon name="eye" size={9} />{p.views.toLocaleString()}</span>
              <span className="text-border/30">·</span>
              <span className="tabular-nums">{p.time}</span>
              <div className="flex items-center gap-0.5 ml-0.5">
                {Object.entries(p.reactions || {}).map(([emoji, users]) => (
                  <button key={emoji} onClick={() => toggleReaction(p.id, emoji)} className={`inline-flex items-center gap-[1px] px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition ${(p.reactions[emoji] || []).includes('me') ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-muted/60 text-muted hover:bg-muted'}`}>
                    <span className="text-[12px]">{emoji}</span><span>{users.length}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-0.5 ml-auto">
                {['❤️','👍','🔥'].map(e => (
                  <button key={e} onClick={() => toggleReaction(p.id, e)} className="text-[12px] hover:scale-110 transition"> {e} </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="h-2" />
      </div>

      <div className="glass-strong border-t border-border/50 px-3 py-2 relative z-10">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 grid place-items-center rounded-full text-muted hover:bg-muted transition"><Icon name="plus" size={20} /></button>
          <input className="msg-input flex-1 text-[13px]" placeholder="Broadcast a message..." value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()} />
          {newPost.trim() ? <button onClick={handlePost} className="w-9 h-9 grid place-items-center rounded-full bg-primary text-white active:scale-90 transition"><Icon name="send" size={18} /></button>
          : <button className="w-9 h-9 grid place-items-center rounded-full text-muted hover:bg-muted transition"><Icon name="mic" size={20} /></button>}
        </div>
      </div>

      {showWallpaper && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowWallpaper(false)}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWallpaper(false)} />
          <div className="relative w-full bg-card rounded-t-3xl p-4 animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <h3 className="text-[16px] font-bold mb-3">Change Wallpaper</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {WP_PRESETS.map(p => (
                <button key={p.id} onClick={() => { setWp(wp === p.bg ? null : p.bg) }} className={`w-14 h-14 rounded-xl border-2 transition ${wp === p.bg ? 'border-primary scale-105' : 'border-transparent'}`} style={{ background:p.bg }}>
                  <span className="text-[8px] font-bold text-white/80 mt-auto block text-center">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWp(null)} className="flex-1 py-2.5 rounded-xl bg-muted font-bold text-[13px] active:scale-95 transition">Reset</button>
              <button onClick={() => setShowWallpaper(false)} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-[13px] active:scale-95 transition">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STATUS TAB
// ============================================================
function StatusTab() {
  const [stories, setStories] = useState(() => DataService.getStories());
  const me = DataService.getMe();
  const [viewingStory, setViewingStory] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.event === 'stories_update') setStories(DataService.getStories()); };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getStories();
      if (JSON.stringify(fresh) !== JSON.stringify(stories)) setStories(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const myStories = stories.filter(s => s.userId === 'me');
  const others = stories.filter(s => s.userId !== 'me');
  const seen = others.filter(s => s.seen);
  const unseen = others.filter(s => !s.seen);

  const handleAddStory = () => {
    const story = { id: 's_' + Date.now(), userId: 'me', name: 'Your Story', avatar: me.avatar, color: me.color, isMine: true, text: 'New story! ✨', time: 'Just now', expiresAt: Date.now() + 86400000, views: 0, seenBy: [] };
    DataService.addStory(story);
    setStories(prev => [...prev, story]);
    broadcast('stories_update', DataService.getStories());
  };

  const viewStory = (story) => {
    if (!story.seen && story.userId !== 'me') {
      const updated = DataService.updateStory(story.id, { seen: true });
      if (updated) setStories(prev => prev.map(s => s.id === story.id ? updated : s));
    }
    setViewingStory(story);
    setTimeout(() => setViewingStory(null), 5000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <div className="relative cursor-pointer" onClick={handleAddStory}>
          <Avatar text={me.avatar} color={me.color} size="lg" />
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary text-white grid place-items-center text-[14px] font-bold border-2 border-card">+</span>
        </div>
        <div><div className="text-[14px] font-bold">My Status</div><div className="text-[12px] text-muted">Tap to add status update</div></div>
      </div>
      {unseen.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1"><span className="text-[12px] font-bold text-muted uppercase tracking-wider">Recent updates</span></div>
          {unseen.map(s => (
            <div key={s.id} onClick={() => viewStory(s)} className="flex items-center gap-3 px-4 py-2.5 active:bg-muted/50 cursor-pointer transition-colors">
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
                <div className="w-full h-full rounded-full bg-card p-[2px]"><Avatar text={s.avatar} color={s.color} size="lg" /></div>
              </div>
              <div><div className="text-[14px] font-bold">{s.name}</div><div className="text-[12px] text-muted">{s.time}</div></div>
            </div>
          ))}
        </>
      )}
      {seen.length > 0 && (
        <>
          <div className="px-4 pt-4 pb-1"><span className="text-[12px] font-bold text-muted uppercase tracking-wider">Seen</span></div>
          {seen.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
              <div className="w-14 h-14 rounded-full p-[2px] bg-muted">
                <div className="w-full h-full rounded-full bg-card p-[2px]"><Avatar text={s.avatar} color={s.color} size="lg" /></div>
              </div>
              <div><div className="text-[14px] font-bold">{s.name}</div><div className="text-[12px] text-muted">{s.time}</div></div>
            </div>
          ))}
        </>
      )}
      {others.length === 0 && <div className="text-center py-10 text-muted text-[14px]">No stories to show</div>}
      {viewingStory && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-fadeIn" onClick={() => setViewingStory(null)}>
          <div className="max-w-[90%] text-center">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <Avatar text={viewingStory.avatar} color={viewingStory.color} size="lg" />
              <div className="text-white"><div className="text-[16px] font-bold">{viewingStory.name}</div><div className="text-[12px] text-white/50">{viewingStory.time}</div></div>
            </div>
            <div className="text-white text-[20px] font-medium">{viewingStory.text}</div>
            <div className="text-white/30 text-[12px] mt-4">Tap to close</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CALLS TAB
// ============================================================
function CallsTab() {
  const [calls, setCalls] = useState(() => DataService.getCalls());
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const handler = (e) => { if (e.event === 'calls_update') setCalls(DataService.getCalls()); };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getCalls();
      if (JSON.stringify(fresh) !== JSON.stringify(calls)) setCalls(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? calls : calls.filter(c => c.type === 'missed');

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => setFilter('all')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold active:scale-95 transition ${filter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'}`}><Icon name="phone" size={14} /> All</button>
        <button onClick={() => setFilter('missed')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold active:scale-95 transition ${filter === 'missed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'}`}><Icon name="missed" size={14} /> Missed</button>
      </div>
      {filtered.map(c => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 cursor-pointer transition-colors">
          <Avatar text={c.avatar} color={c.color} />
          <div className="flex-1 min-w-0">
            <div className={`text-[14px] font-bold ${c.type === 'missed' ? 'text-red-500' : ''}`}>{c.name}</div>
            <div className="flex items-center gap-1 text-[12px] text-muted"><Icon name={c.type} size={12} />{c.type === 'incoming' ? 'Incoming' : c.type === 'outgoing' ? 'Outgoing' : 'Missed'}{c.duration ? ` · ${c.duration}` : ''}</div>
          </div>
          <button className="w-9 h-9 grid place-items-center rounded-full text-primary hover:bg-primary/10 transition"><Icon name="phone" size={18} /></button>
        </div>
      ))}
      {filtered.length === 0 && <div className="text-center py-10 text-muted text-[14px]">No calls found</div>}
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab({ onBack, profile, onEditProfile, onToggleTheme, isDark }) {
  const sections = [
    { icon:'user', label:'Account', desc:'Privacy, security, change number', color:'#3b82f6' },
    { icon:'message', label:'Chats', desc:'Theme, wallpapers, chat history', color:'#10b981' },
    { icon:'bell', label:'Notifications', desc:'Message, group & call tones', color:'#f59e0b' },
    { icon:'shield', label:'Privacy and Security', desc:'Block contacts, disappearing messages', color:'#8b5cf6' },
    { icon:'users', label:'Invite Friends', desc:'Share Pilogram with friends', color:'#06b6d4' },
    { icon:'info', label:'Help', desc:'Help center, contact us, privacy policy', color:'#6b7280' },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="back" size={22} /></button>
        <h1 className="text-[20px] font-extrabold">Settings</h1>
      </div>
      <div className="mx-4 mb-3 p-4 rounded-2xl bg-card border border-border shadow-sm animate-fadeIn cursor-pointer active:scale-[.98] transition" onClick={onEditProfile}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar text={profile.avatar} color={profile.color} size="xl" photo={profile.photo} />
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-card grid place-items-center text-white"><Icon name="camera" size={12} /></span>
          </div>
          <div className="flex-1 min-w-0"><h2 className="text-[18px] font-extrabold">{profile.name}</h2><p className="text-[13px] text-muted">{profile.about}</p></div>
          <Icon name="chevronRight" size={18} className="text-muted/40" />
        </div>
      </div>
      {sections.map((s,i) => (
        <div key={i} className="setting-row mx-2 animate-fadeIn" style={{ animationDelay: `${i*50}ms` }}>
          <div className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ background: s.color+'15', color:s.color }}><Icon name={s.icon} size={20} /></div>
          <div className="flex-1 min-w-0"><div className="text-[14px] font-bold">{s.label}</div><div className="text-[12px] text-muted">{s.desc}</div></div>
        </div>
      ))}
      <div className="setting-row mx-2" onClick={onToggleTheme}>
        <div className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ background:'#1da1f215', color:'#1da1f2' }}>{isDark ? <Icon name="sun" size={20} /> : <Icon name="moon" size={20} />}</div>
        <div className="flex-1"><div className="text-[14px] font-bold">{isDark ? 'Light Mode' : 'Dark Mode'}</div><div className="text-[12px] text-muted">Toggle appearance</div></div>
      </div>
      <div className="h-20" />
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab({ onBack, profile }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...profile });
  const saveProfile = () => {
    DataService.updateMe(editData);
    setEditing(false);
    broadcast('user_update', editData);
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <header className="pt-3 pb-2 px-4 flex items-center justify-between">
        <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground active:scale-90 transition"><Icon name="back" size={22} /></button>
        <button className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground active:scale-90 transition"><Icon name="qrcode" size={22} /></button>
      </header>
      <div className="flex-1 px-4 pb-24">
        <div className="flex flex-col items-center pt-2 pb-4 bg-card mx-auto rounded-3xl shadow-sm border border-border mt-2 px-6 max-w-sm w-full">
          <div className="relative">
            <Avatar text={profile.avatar} color={profile.color} size="xl" photo={profile.photo} />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-white grid place-items-center text-white active:scale-90 transition"><Icon name="camera" size={15} /></button>
          </div>
          {editing ? (
            <div className="w-full mt-3 space-y-2">
              <input className="msg-input text-center text-[18px] font-extrabold" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
              <input className="msg-input text-center text-[14px]" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
              <input className="msg-input text-center text-[13px]" value={editData.about || ''} onChange={e => setEditData({ ...editData, about: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl bg-muted font-bold text-[13px] active:scale-95 transition">Cancel</button>
                <button onClick={saveProfile} className="flex-1 py-2 rounded-xl bg-primary text-white font-bold text-[13px] active:scale-95 transition">Save</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-[22px] font-extrabold mt-3">{profile.name}</h2>
              <p className="text-[14px] text-primary font-bold mt-0.5">@{profile.username}</p>
              <p className="text-[13px] text-emerald-500 font-semibold mt-0.5">● online</p>
              {profile.about && <p className="text-[13px] text-muted font-medium mt-1.5 text-center">{profile.about}</p>}
            </>
          )}
        </div>
        {!editing && (
          <>
            <div className="flex justify-center gap-3 py-4">
              <button className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-card shadow-sm hover:bg-muted active:scale-95 transition border border-border">
                <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background:'rgba(124,58,237,0.1)', color:'#7C3AED' }}><Icon name="camera" size={20} /></div>
                <span className="text-[11px] font-bold">Set Photo</span>
              </button>
              <button onClick={() => setEditing(true)} className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-primary text-white shadow-sm hover:opacity-90 active:scale-95 transition" style={{ boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                <div className="w-10 h-10 rounded-full grid place-items-center"><Icon name="edit" size={20} /></div>
                <span className="text-[11px] font-bold">Edit Info</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-card shadow-sm hover:bg-muted active:scale-95 transition border border-border">
                <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background:'rgba(124,58,237,0.1)', color:'#7C3AED' }}><Icon name="settings" size={20} /></div>
                <span className="text-[11px] font-bold">Settings</span>
              </button>
            </div>
            <div className="bg-card mx-auto max-w-sm rounded-2xl overflow-hidden border border-border">
              {[
                { icon:'phone', label:'Mobile', value:profile.phone, color:'#3b82f6' },
                { icon:'users', label:'Username', value:'@'+profile.username, color:'#3b82f6' },
                { icon:'info', label:'Bio', value:profile.bio||'Not set', color:'#3b82f6' },
                { icon:'message', label:'About', value:profile.about, color:'#3b82f6' },
              ].map((r,i,arr) => (
                <Fragment key={i}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ backgroundColor:r.color+'18', color:r.color }}><Icon name={r.icon} size={20} /></div>
                    <div className="flex-1 min-w-0"><div className="text-[14px] font-bold truncate">{r.value}</div><div className="text-[11px] text-muted">{r.label}</div></div>
                  </div>
                  {i < arr.length-1 && <div className="h-px bg-border ml-14" />}
                </Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR MENU
// ============================================================
function SidebarMenu({ open, onClose, profile }) {
  if (!open) return null;
  const items = [
    { icon: <Icon name="users" size={20} />, label:'New Group', action:() => onClose() },
    { icon: <Icon name="megaphone" size={20} />, label:'New Channel', action:() => onClose() },
    { icon: <Icon name="bookmark" size={20} />, label:'Saved Messages', action:() => onClose() },
    { icon: <Icon name="settings" size={20} />, label:'Settings', action:() => onClose() },
  ];
  return (
    <>
      <div className="absolute inset-0 z-[70] bg-black/50 animate-fadeIn" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 z-[71] w-[280px] bg-card text-foreground flex flex-col animate-slideLeft">
        <div className="pt-4 px-3 pb-2 flex justify-end">
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted"><Icon name="x" size={20} /></button>
        </div>
        <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition">
          <Avatar text={profile.avatar} color={profile.color} size="md" photo={profile.photo} />
          <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate">{profile.name}</div><div className="text-[13px] text-muted truncate">{profile.phone}</div></div>
        </div>
        <div className="h-px bg-border mx-4" />
        <div className="flex-1 overflow-y-auto no-scrollbar mt-1">
          {items.map((item,i) => <button key={i} onClick={item.action} className="w-full flex items-center px-5 py-2.5 text-foreground text-[15px] hover:bg-muted transition group"><span className="w-7 mr-3 text-muted group-hover:text-foreground flex justify-center">{item.icon}</span><span>{item.label}</span></button>)}
        </div>
      </div>
    </>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
function BottomNav({ activeTab, setActiveTab, profile }) {
  const TABS = [
    { key:'chats', icon:'message', label:'Chats', badge:0 },
    { key:'channels', icon:'megaphone', label:'Channels', badge:0 },
    { key:'status', icon:'eye', label:'Status', badge:0 },
    { key:'calls', icon:'phone', label:'Calls', badge:0 },
  ];
  const [chats, setChats] = useState(() => DataService.getChats());
  useEffect(() => {
    const handler = (e) => { if (e.event === 'chats_update' || e.event === 'chat_update') setChats(DataService.getChats()); };
    onSync(handler);
    const interval = setInterval(() => { setChats(DataService.getChats()); }, 3000);
    return () => clearInterval(interval);
  }, []);
  const totalUnread = chats.reduce((sum,c) => sum + (c.unread || 0), 0);
  const tabsWithBadges = TABS.map(t => ({ ...t, badge: t.key === 'chats' ? totalUnread : t.badge }));

  return (
    <nav className="absolute bottom-0 inset-x-0 z-40 pb-safe">
      <div className="glass-strong border-t border-border/50 flex items-end" style={{ paddingBottom:'env(safe-area-inset-bottom,0)' }}>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[80%] h-8 pointer-events-none" style={{ background:'radial-gradient(ellipse at center,rgba(124,58,237,0.06) 0%,transparent 70%)' }} />
        {tabsWithBadges.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="flex-1 flex flex-col items-center py-2 relative transition-all">
            {activeTab === t.key && <span className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />}
            <div className={`relative transition-all duration-300 ${activeTab === t.key ? 'scale-110 -translate-y-1' : 'scale-100 translate-y-0'}`}>
              {activeTab === t.key && <div className="absolute inset-[-4px] rounded-full bg-primary/10 animate-glow" />}
              <span className={activeTab === t.key ? 'text-primary' : 'text-muted/50'}><Icon name={t.icon} size={22} /></span>
            </div>
            <span className={`text-[10px] leading-tight mt-0.5 transition-all ${activeTab === t.key ? 'font-bold text-primary' : 'font-medium opacity-50'}`}>{t.label}</span>
            {t.badge > 0 && <span className="absolute top-0.5 right-1/2 translate-x-3 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold grid place-items-center">{t.badge > 99 ? '99+' : t.badge}</span>}
          </button>
        ))}
        <button onClick={() => setActiveTab('profile')} className="flex-1 flex flex-col items-center py-2 relative transition-all">
          {activeTab === 'profile' && <span className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />}
          <div className={`relative transition-all duration-300 ${activeTab === 'profile' ? 'scale-110 -translate-y-1' : 'scale-100 translate-y-0'}`}>
            {activeTab === 'profile' && <div className="absolute inset-[-4px] rounded-full bg-primary/10 animate-glow" />}
            {profile.photo ? <img src={profile.photo} className="w-[22px] h-[22px] rounded-full object-cover ring-2 ring-primary/30" /> :
              <div className="w-[22px] h-[22px] rounded-full grid place-items-center text-white font-bold text-[9px]" style={{ background:`linear-gradient(135deg,${profile.color},${profile.color}cc)` }}>{profile.avatar}</div>}
          </div>
          <span className={`text-[10px] leading-tight mt-0.5 transition-all ${activeTab === 'profile' ? 'font-bold text-primary' : 'font-medium opacity-50'}`}>Me</span>
        </button>
      </div>
    </nav>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
  const [activeTab, setActiveTab] = useState('chats');
  const [openChat, setOpenChat] = useState(null);
  const [openChannel, setOpenChannel] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('pilogram_theme') === 'dark');
  const [profile, setProfile] = useState(() => DataService.getMe() || { name:'User', avatar:'U', color:'#7C3AED', phone:'+91 98765 43210', about:'Hello!', username:'user', bio:'' });

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('pilogram_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handler = (e) => { if (e.event === 'user_update') setProfile(DataService.getMe() || profile); };
    onSync(handler);
    const interval = setInterval(() => {
      const fresh = DataService.getMe();
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(profile)) setProfile(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  if (openChat) return <div className="phone-frame"><ChatView chat={openChat} onBack={() => setOpenChat(null)} /></div>;
  if (openChannel) return <div className="phone-frame"><ChannelView channel={openChannel} onBack={() => setOpenChannel(null)} /></div>;

  const renderTab = () => {
    switch (activeTab) {
      case 'chats': return <ChatsTab onOpenChat={setOpenChat} />;
      case 'channels': return <ChannelsTab onOpenChannel={setOpenChannel} />;
      case 'status': return <StatusTab />;
      case 'calls': return <CallsTab />;
      case 'settings': return <SettingsTab onBack={() => setActiveTab('chats')} profile={profile} onEditProfile={() => setActiveTab('profile')} onToggleTheme={toggleTheme} isDark={isDark} />;
      case 'profile': return <ProfileTab onBack={() => setActiveTab('chats')} profile={profile} />;
      default: return <ChatsTab onOpenChat={setOpenChat} />;
    }
  };

  return (
    <div className="phone-frame">
      <SidebarMenu open={sidebar} onClose={() => setSidebar(false)} profile={profile} />
      <div className="flex flex-col h-full">
        {!['settings','profile'].includes(activeTab) && (
          <div className="glass-strong px-4 pt-3 pb-2 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebar(true)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted transition">
                {profile.photo ? <img src={profile.photo} className="w-8 h-8 rounded-full object-cover" /> :
                  <div className="w-8 h-8 rounded-full grid place-items-center text-white font-bold text-[11px]" style={{ background:`linear-gradient(135deg,${profile.color},${profile.color}dd)` }}>{profile.avatar}</div>}
              </button>
              <h1 className="text-[20px] font-extrabold tracking-tight" style={{ color:'var(--primary)' }}>Pilogram</h1>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="search" size={20} /></button>
              <button onClick={() => setSidebar(true)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted transition"><Icon name="more" size={20} /></button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">{renderTab()}</div>
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
