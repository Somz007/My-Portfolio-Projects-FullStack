import { useEffect, useRef } from 'react';

export default function MessageList({ messages, currentUser }) {
  const bottomRef = useRef(null);

  // Auto-scroll to newest message whenever messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <div className="messages-empty">No messages yet. Say hi!</div>;
  }

  return (
    <div className="messages">
      {messages.map((msg) => {
        if (msg.type === 'system') {
          return (
            <div key={msg.id} className="msg-system">
              {msg.text}
            </div>
          );
        }

        const isOwn = msg.username === currentUser;
        const time  = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={msg.id} className={`msg ${isOwn ? 'msg-own' : 'msg-other'}`}>
            {!isOwn && <span className="msg-author">{msg.username}</span>}
            <div className="msg-bubble">
              <span className="msg-text">{msg.text}</span>
              <span className="msg-time">{time}</span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
