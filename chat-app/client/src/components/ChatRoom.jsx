// ─────────────────────────────────────────────────────────────
//  ChatRoom.jsx
//  The main chat UI. This component wires up all Socket.io
//  event listeners and handles message sending.
//
//  IMPORTANT: every socket.on() must have a matching socket.off()
//  in the cleanup function returned from useEffect. Without it,
//  listeners stack up on every re-render (React StrictMode makes
//  this painfully obvious — you'd see every message twice).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import MessageList from './MessageList';
import UserList from './UserList';

export default function ChatRoom({ username, room, onLeave }) {
  const [messages,    setMessages]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [input,       setInput]       = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);

  useEffect(() => {
    // ── Register all event listeners ─────────────────────────
    const onHistory      = (history) => setMessages(history);
    const onMessage      = (msg)     => setMessages((prev) => [...prev, msg]);
    const onRoomUsers    = (list)    => setUsers(list);
    const onUserTyping   = ({ username: who, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping ? [...new Set([...prev, who])] : prev.filter((u) => u !== who)
      );
    };

    socket.on('room_history', onHistory);
    socket.on('receive_message', onMessage);
    socket.on('room_users', onRoomUsers);
    socket.on('user_typing', onUserTyping);

    // ── Cleanup: remove listeners when component unmounts ────
    return () => {
      socket.off('room_history', onHistory);
      socket.off('receive_message', onMessage);
      socket.off('room_users', onRoomUsers);
      socket.off('user_typing', onUserTyping);
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('send_message', { text: input.trim() });
    // Stop the typing indicator for our own socket.
    socket.emit('typing', { isTyping: false });
    clearTimeout(typingTimer.current);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Emit 'typing' and auto-stop after 2 seconds of no input.
    socket.emit('typing', { isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { isTyping: false });
    }, 2000);
  };

  const otherTyping = typingUsers.filter((u) => u !== username);

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="room-badge">#{room}</span>
          <button onClick={onLeave} className="btn btn-outline btn-sm">Leave</button>
        </div>
        <UserList users={users} currentUser={username} />
      </aside>

      {/* ── Main ── */}
      <div className="chat-main">
        <header className="chat-header">
          <h2>#{room}</h2>
          <span className="chat-header-sub">{users.length} online</span>
        </header>

        <MessageList messages={messages} currentUser={username} />

        {otherTyping.length > 0 && (
          <div className="typing-indicator">
            {otherTyping.join(', ')} {otherTyping.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}

        <form className="message-form" onSubmit={sendMessage}>
          <input
            className="input"
            value={input}
            onChange={handleInputChange}
            placeholder={`Message #${room}`}
            autoFocus
            maxLength={500}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
