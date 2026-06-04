export default function UserList({ users, currentUser }) {
  return (
    <div className="user-list">
      <h3 className="user-list-title">Online ({users.length})</h3>
      <ul>
        {users.map((name) => (
          <li key={name} className={`user-item ${name === currentUser ? 'user-item-self' : ''}`}>
            <span className="user-dot" />
            {name}
            {name === currentUser && <span className="user-you"> (you)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
