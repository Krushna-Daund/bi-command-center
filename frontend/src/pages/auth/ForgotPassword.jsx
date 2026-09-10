import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft, Mail } from 'lucide-react';
import '../../auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Note: Mocking email sent since no SMTP is configured backend yet
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <LayoutDashboard size={40} />
        </div>
        <h2 className="auth-title">Reset Password</h2>
      </div>

      <div className="auth-card">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="auth-form-group">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="admin@example.com"
                />
                <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={18} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '3rem', width: '3rem', borderRadius: '50%', backgroundColor: 'var(--color-success)', color: 'white' }}>
              <Mail size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Check your email</h3>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <div style={{ fontSize: '0.875rem', color: '#92400e', fontStyle: 'italic', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
              Notice: Email infrastructure (SMTP) is not currently configured. 
              Contact your administrator for manual password reset.
            </div>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
