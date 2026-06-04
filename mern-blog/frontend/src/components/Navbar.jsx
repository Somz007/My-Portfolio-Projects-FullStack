import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">✍️ MERN Blog</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/create">New Post</Link>
            <span className="navbar-user">Hi, {user.name.split(' ')[0]}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
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
