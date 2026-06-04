// ─────────────────────────────────────────────────────────────
//  ProtectedRoute.jsx
//  Wraps any route that requires authentication. If the user
//  isn't logged in it redirects them to /login, preserving the
//  page they tried to visit so they land there after logging in.
// ─────────────────────────────────────────────────────────────
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Still checking localStorage / verifying the stored token — show a spinner
  // rather than a flash of the login redirect.
  if (isLoading) return <Spinner />;

  if (!user) {
    // Pass the intended path in state so Login can redirect back after success.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
