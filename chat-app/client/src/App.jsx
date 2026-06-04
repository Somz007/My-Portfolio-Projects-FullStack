// ─────────────────────────────────────────────────────────────
//  App.jsx
//  Top-level: manages the join/chat state and the socket lifecycle.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import socket from './socket';
import JoinForm from './components/JoinForm';
import ChatRoom from './components/ChatRoom';

export default function App() {
  const [joined,   setJoined]   = useState(false);
  const [username, setUsername] = useState('');
  const [room,     setRoom]     = useState('');
  const [error,    setError]    = useState('');

  // Listen for server errors (e.g. invalid room name).
  useEffect(() => {
    socket.on('error', ({ message }) => setError(message));
    socket.on('joined', ({ room: r }) => { setRoom(r); setJoined(true); setError(''); });

    return () => {
      socket.off('error');
      socket.off('joined');
    };
  }, []);

  const handleJoin = (name, selectedRoom) => {
    setUsername(name);
    setRoom(selectedRoom);
    // Connect the socket (if not already connected) then emit join_room.
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { username: name, room: selectedRoom });
  };

  const handleLeave = () => {
    socket.disconnect();
    setJoined(false);
    setUsername('');
    setRoom('');
  };

  return (
    <div className="app">
      {error && <div className="global-error">{error}</div>}
      {joined
        ? <ChatRoom username={username} room={room} onLeave={handleLeave} />
        : <JoinForm onJoin={handleJoin} />}
    </div>
  );
}
