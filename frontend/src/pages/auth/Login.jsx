import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, AlertCircle } from 'lucide-react';
import '../../auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <LayoutDashboard size={40} />
        </div>
        <h2 className="auth-title">BI Command Center</h2>
        <p className="auth-subtitle">Enterprise Intelligence Platform</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={20} className="text-red-400" />
              <span className="auth-error-text">{error}</span>
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="admin@example.com"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-btn-icon"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" className="auth-checkbox" />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-link">
              Forgot your password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
