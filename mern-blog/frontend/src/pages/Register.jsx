import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-narrow auth-page">
      <h1>Create an account</h1>
      <p className="auth-sub">Already have one? <Link to="/login">Log in</Link></p>
      {error && <p className="error-msg">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Name
          <input className="input" type="text" value={form.name} onChange={set('name')} required autoFocus />
        </label>
        <label>Email
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>Password <span className="hint">(min 6 characters)</span>
          <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} />
        </label>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
