import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Package, 
  Truck, 
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import NotificationBell from '../components/Notifications/NotificationBell';
import UserProfileMenu from '../components/UserProfileMenu';
import ChatWidget from '../components/ChatWidget';

const navItems = [
  { path: '/app', label: 'Executive Overview', icon: LayoutDashboard },
  { path: '/app/sales', label: 'Sales & Revenue', icon: TrendingUp },
  { path: '/app/customers', label: 'Customers & Demo', icon: Users },
  { path: '/app/operations', label: 'Operations & Logistics', icon: Truck },
  { path: '/app/catalog', label: 'Catalog & Partners', icon: Package },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const transitionRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  // Re-trigger animation on route change
  useEffect(() => {
    if (transitionRef.current) {
      transitionRef.current.classList.remove('page-transition-enter');
      // Trigger reflow
      void transitionRef.current.offsetWidth;
      transitionRef.current.classList.add('page-transition-enter');
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar - Floating style */}
      <aside style={{
        width: isSidebarOpen ? '280px' : '88px',
        backgroundColor: 'var(--bg-sidebar)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--text-inverse)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderRight: '1px solid var(--border-sidebar)',
        zIndex: 50,
        margin: '0.75rem',
        borderRadius: '1.25rem',
        boxShadow: 'var(--shadow-xl)',
        height: 'calc(100vh - 1.5rem)'
      }}>
        <div style={{ 
          padding: isSidebarOpen ? '2rem 1.5rem' : '2rem 0', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s'
        }}>
          {isSidebarOpen ? (
            <h2 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '1.35rem', 
              fontWeight: 800,
              background: 'linear-gradient(90deg, #fff, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>BI Command Center</h2>
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              BI
            </div>
          )}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isSidebarOpen ? item.label : undefined}
              end={item.path === '/app'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                padding: '0.85rem 1rem',
                color: isActive ? 'white' : 'var(--text-inverse-muted)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              })}
            >
              <item.icon size={22} style={{ marginRight: isSidebarOpen ? '1rem' : '0', transition: 'margin 0.3s' }} />
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Toggle Button at Bottom */}
        <div style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="header-btn"
            style={{
              width: '100%',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '0.75rem',
              color: 'var(--text-inverse-muted)'
            }}
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Background Decorative Blob */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Sticky Glass Header */}
        <header className="glass" style={{ 
          padding: '1rem 2rem',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          position: 'sticky',
          top: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
        }}>
          <div style={{ flex: 1 }}>
            <FilterBar />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="header-btn"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell />
            <UserProfileMenu />
          </div>
        </header>

        {/* Page Content with Transition Wrapper */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', zIndex: 10, position: 'relative' }}>
          <div ref={transitionRef} className="page-transition-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* Global AI Chatbot Widget */}
      <ChatWidget />
    </div>
  );
}
