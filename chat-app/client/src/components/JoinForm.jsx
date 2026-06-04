import { useState, useEffect } from 'react';

export default function JoinForm({ onJoin }) {
  const [username, setUsername] = useState('');
  const [room,     setRoom]     = useState('general');
  const [rooms,    setRooms]    = useState([]);
  const [error,    setError]    = useState('');

  useEffect(() => {
    // Fetch live room list + user counts from the REST endpoint.
    fetch('/api/rooms')
      .then((r) => r.json())
      .then(setRooms)
      .catch(() => setRooms([{ name: 'general', userCount: 0 }]));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter a username.'); return; }
    onJoin(username.trim(), room);
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <h1>💬 Chat App</h1>
        <p className="join-sub">Real-time chat powered by Socket.io</p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="join-form">
          <label>
            Username
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pick a name…"
              maxLength={24}
              autoFocus
              required
            />
          </label>
          <label>
            Room
            <div className="room-grid">
              {rooms.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  className={`room-btn ${room === r.name ? 'room-btn-active' : ''}`}
                  onClick={() => setRoom(r.name)}
                >
                  <span className="room-name">#{r.name}</span>
                  <span className="room-count">{r.userCount} online</span>
                </button>
              ))}
            </div>
          </label>
          <button type="submit" className="btn btn-primary btn-full">
            Join {room ? `#${room}` : 'a room'}
          </button>
        </form>
      </div>
    </div>
  );
}
