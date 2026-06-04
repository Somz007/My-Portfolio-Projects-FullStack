import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function VerifyEmail() {
  const [params]  = useSearchParams();
  const token     = params.get('token') || '';
  const email     = params.get('email') || '';
  const { updateVerified } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !email) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token, email });
        setStatus('success');
        updateVerified(); // update the in-memory user state
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };
    verify();
  }, []); // eslint-disable-line

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-center">
        {status === 'verifying' && <><div className="spinner" style={{margin:'0 auto 1rem'}} /><p>Verifying your email…</p></>}
        {status === 'success'   && <><div className="success-icon">✅</div><h2>Email verified!</h2><p className="auth-sub">Your account is fully active.</p><Link to="/dashboard" className="btn btn-primary" style={{marginTop:'1rem'}}>Go to Dashboard</Link></>}
        {status === 'error'     && <><div className="success-icon">❌</div><h2>Verification failed</h2><p className="error-msg">{message}</p><Link to="/dashboard" className="btn btn-outline" style={{marginTop:'1rem'}}>Go to Dashboard</Link></>}
      </div>
    </div>
  );
}
