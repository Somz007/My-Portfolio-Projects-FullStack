import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true }); // redirect back to where they were trying to go
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-narrow auth-page">
      <h1>Welcome back</h1>
      <p className="auth-sub">Don't have an account? <Link to="/register">Sign up</Link></p>
      {error && <p className="error-msg">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email
          <input className="input" type="email" value={form.email} onChange={set('email')} required autoFocus />
        </label>
        <label>Password
          <input className="input" type="password" value={form.password} onChange={set('password')} required />
        </label>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
