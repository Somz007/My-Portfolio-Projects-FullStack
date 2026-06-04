import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, updateVerified } = useAuth();
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleResend = async () => {
    setResendLoading(true); setResendStatus('');
    try {
      await api.post('/auth/resend-verification');
      setResendStatus('Verification email sent! Check the server console for the Ethereal preview URL.');
    } catch (err) {
      setResendStatus(err.response?.data?.message || 'Failed to resend.');
    } finally { setResendLoading(false); }
  };

  return (
    <div className="container">
      <h1 className="page-title">Dashboard</h1>

      {/* Account status card */}
      <div className="card">
        <h2>Account Status</h2>
        <div className="info-grid">
          <div className="info-row"><span className="info-label">Name</span><span>{user?.name}</span></div>
          <div className="info-row"><span className="info-label">Email</span><span>{user?.email}</span></div>
          <div className="info-row">
            <span className="info-label">Email Verified</span>
            {user?.emailVerified
              ? <span className="badge badge-ok">Verified</span>
              : <span className="badge badge-warn">Not verified</span>}
          </div>
        </div>

        {!user?.emailVerified && (
          <div className="verify-prompt">
            <p>Verify your email address to unlock all features.</p>
            <button className="btn btn-primary btn-sm" onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? 'Sending…' : 'Resend verification email'}
            </button>
            {resendStatus && <p className="info-msg">{resendStatus}</p>}
          </div>
        )}
      </div>

      {/* Auth features card */}
      <div className="card">
        <h2>What this project demonstrates</h2>
        <ul className="feature-list">
          <li>✅ Register with email + password (min 8 chars, uppercase, number)</li>
          <li>✅ Login with account lockout after 5 failed attempts</li>
          <li>✅ JWT access token (15 min) + refresh token (7 days) with rotation</li>
          <li>✅ Silent token refresh via Axios response interceptor</li>
          <li>✅ Real logout (revokes refresh token server-side)</li>
          <li>✅ Email verification on register (Nodemailer + Ethereal)</li>
          <li>✅ Password reset via email with expiring hashed token</li>
          <li>✅ Rate limiting: 20 req/15 min on auth, 5 req/hr on password reset</li>
          <li>✅ Account enumeration protection on forgot-password</li>
          <li>✅ Reset token stored as SHA-256 hash (DB breach can't be replayed)</li>
        </ul>
      </div>
    </div>
  );
}
