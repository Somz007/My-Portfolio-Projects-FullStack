import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🔐 Auth System</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-user">{user.name}</span>
            {!user.emailVerified && <span className="badge badge-warn">Unverified</span>}
            <button onClick={async () => { await logout(); navigate('/login'); }} className="btn btn-outline btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
