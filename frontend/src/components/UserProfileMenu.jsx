import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserProfileMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-btn"
        style={{ padding: '0.25rem' }}
        title="User Profile"
      >
        <div className="header-avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>{user.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>{user.email}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ 
                display: 'inline-flex', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', 
                fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--color-primary)' 
              }}>
                {user.role}
              </span>
            </div>
          </div>
          
          <div style={{ padding: '0.5rem 0' }}>
            <Link
              to="/app/profile"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              Profile
            </Link>
            
            {user.role === 'ADMIN' && (
              <Link
                to="/app/settings/alerts"
                className="dropdown-item"
                onClick={() => setIsOpen(false)}
              >
                <Shield size={16} />
                Alerts Config
              </Link>
            )}
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="dropdown-item danger"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
