import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const from      = useLocation().state?.from?.pathname || '/dashboard';
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try   { await login(form.email, form.password); navigate(from, { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-sub">Don't have an account? <Link to="/register">Sign up</Link></p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input className="input" type="email" value={form.email} onChange={set('email')} required autoFocus /></label>
          <label>Password<input className="input" type="password" value={form.password} onChange={set('password')} required /></label>
          <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="auth-footer"><Link to="/forgot-password">Forgot your password?</Link></p>
      </div>
    </div>
  );
}
