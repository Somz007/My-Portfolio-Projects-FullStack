// ─────────────────────────────────────────────────────────────
//  context/AuthContext.jsx
//  Global auth state. Wraps the whole app so any component can
//  call useAuth() to get the current user or call login/logout.
//
//  WHY useReducer instead of useState?
//  Auth state has several fields that change together (user, token,
//  loading). useReducer keeps all those changes in one place with
//  named actions, which is easier to reason about than multiple
//  separate setState calls that might partially update.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useReducer } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: true, // true while we check if an existing token is still valid
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'LOGIN':
      return { ...state, user: action.payload.user, accessToken: action.payload.accessToken, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, accessToken: null, isLoading: false };
    case 'LOADING_DONE':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On first load, if we have a stored token, verify it's still valid by
  // calling /api/auth/me. The axios interceptor will silently refresh
  // it if it's expired. If that also fails, we log out.
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { dispatch({ type: 'LOADING_DONE' }); return; }
      try {
        const { data } = await api.get('/auth/me');
        dispatch({ type: 'SET_USER', payload: data });
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };
    verifySession();
  }, []);

  // Listen for the event the axios interceptor fires when refresh fails.
  useEffect(() => {
    const handleForcedLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: { _id: data._id, name: data.name, email: data.email, avatar: data.avatar }, accessToken: data.accessToken } });
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: { _id: data._id, name: data.name, email: data.email, avatar: data.avatar }, accessToken: data.accessToken } });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — any component can do: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
