import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Pill, Calendar, BarChart2, Brain, LogOut, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import SOSButton from '../sos/SOSButton.js';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/adherence', label: 'Adherence Log', icon: BarChart2 },
  { to: '/insights', label: 'AI Insights', icon: Brain },
];

/**
 * Main application layout with accessible navigation and senior mode.
 */
export default function Layout({ children }: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seniorMode, setSeniorMode] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    void navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: seniorMode ? '16px 20px' : '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: seniorMode ? 'var(--font-size-lg)' : 'var(--font-size-base)',
    color: isActive ? '#fff' : 'var(--color-primary)',
    background: isActive ? 'var(--color-primary)' : 'transparent',
    transition: 'all 150ms ease',
    minHeight: seniorMode ? '60px' : '44px',
  });

  return (
    <div className={seniorMode ? 'senior-mode' : ''} style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Skip link */}
      <a className="skip-link" href="#main-content">Skip to main content</a>

      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        style={{
          width: sidebarOpen ? '280px' : '0',
          overflow: 'hidden',
          transition: 'width 200ms ease',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 40,
        }}
        id="main-nav"
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            💊 ElderCare
          </span>
          {user && (
            <p style={{ margin: '8px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {user.name} · {user.role}
            </p>
          )}
        </div>

        {/* Nav links */}
        <ul role="list" style={{ listStyle: 'none', padding: '16px', margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} style={navLinkStyle} aria-label={label} end={to === '/dashboard'}>
                <Icon size={seniorMode ? 24 : 20} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Footer controls */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setSeniorMode(!seniorMode)}
            aria-pressed={seniorMode}
            aria-label={`Senior mode ${seniorMode ? 'on' : 'off'} — toggle large text and controls`}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '12px 16px', borderRadius: '8px', border: '2px solid var(--color-primary)',
              background: seniorMode ? 'var(--color-primary)' : 'transparent',
              color: seniorMode ? '#fff' : 'var(--color-primary)',
              cursor: 'pointer', fontWeight: 600, minHeight: '44px', fontSize: 'var(--font-size-sm)',
            }}
          >
            👴 Senior Mode
          </button>
          <button
            onClick={handleLogout}
            aria-label="Sign out of ElderCare"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '12px 16px', borderRadius: '8px', border: '2px solid var(--color-danger)',
              background: 'transparent', color: 'var(--color-danger)',
              cursor: 'pointer', fontWeight: 600, minHeight: '44px', fontSize: 'var(--font-size-sm)',
            }}
          >
            <LogOut size={18} aria-hidden="true" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarOpen ? '280px' : '0', transition: 'margin-left 200ms ease' }}>
        {/* Top bar */}
        <header
          role="banner"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', height: '64px', background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
            aria-controls="main-nav"
            style={{
              background: 'none', border: '2px solid var(--color-border)', borderRadius: '8px',
              cursor: 'pointer', padding: '10px', display: 'flex', color: 'var(--color-text)',
              minWidth: '44px', minHeight: '44px', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SOSButton triggeredByName={user?.name ?? 'User'} />
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
