import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true); // always show success (API never reveals if email exists)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="auth-page">
      <div className="auth-card auth-card-center">
        <div className="success-icon">📬</div>
        <h2>Check your inbox</h2>
        <p className="auth-sub">
          If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
          In development, check the server console for the Ethereal preview URL.
        </p>
        <Link to="/login" className="btn btn-outline btn-full" style={{marginTop:'1rem'}}>Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot password</h1>
        <p className="auth-sub">Enter your email and we'll send you a reset link.</p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
          <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>
        <p className="auth-footer"><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}
