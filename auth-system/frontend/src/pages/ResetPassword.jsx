import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ResetPassword() {
  const [params]  = useSearchParams();
  const token     = params.get('token') || '';
  const email     = params.get('email') || '';
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    if (!token || !email) setError('Invalid reset link. Please request a new one.');
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      // The API resets the password AND returns a new token pair so the user
      // is logged in immediately — no need to redirect to login.
      const { data } = await api.post('/auth/reset-password', { token, email, password });
      localStorage.setItem('accessToken',  data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="auth-page">
      <div className="auth-card auth-card-center">
        <div className="success-icon">✅</div>
        <h2>Password updated!</h2>
        <p className="auth-sub">Redirecting to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="auth-sub">Enter a new password for <strong>{email}</strong></p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            New Password
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
            <span className="hint">Min 8 characters, one uppercase, one number</span>
          </label>
          <label>Confirm Password<input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>
          <button className="btn btn-primary btn-full" disabled={loading || !token}>{loading ? 'Resetting…' : 'Reset password'}</button>
        </form>
        <p className="auth-footer"><Link to="/forgot-password">Request a new link</Link></p>
      </div>
    </div>
  );
}
