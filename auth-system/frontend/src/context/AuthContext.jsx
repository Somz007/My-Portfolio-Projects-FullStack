import { createContext, useContext, useEffect, useReducer } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'SET_USER':    return { ...state, user: payload, isLoading: false };
    case 'LOGIN':       return { ...state, user: payload.user, isLoading: false };
    case 'LOGOUT':      return { ...state, user: null, isLoading: false };
    case 'DONE':        return { ...state, isLoading: false };
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...payload } };
    default:            return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const verify = async () => {
      if (!localStorage.getItem('accessToken')) { dispatch({ type: 'DONE' }); return; }
      try {
        const { data } = await api.get('/auth/me');
        dispatch({ type: 'SET_USER', payload: data });
      } catch { dispatch({ type: 'LOGOUT' }); }
    };
    verify();
  }, []);

  useEffect(() => {
    const handler = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: { _id: data._id, name: data.name, email: data.email, emailVerified: data.emailVerified } } });
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: { _id: data._id, name: data.name, email: data.email, emailVerified: data.emailVerified } } });
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch { /**/ }
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateVerified = () => dispatch({ type: 'UPDATE_USER', payload: { emailVerified: true } });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
