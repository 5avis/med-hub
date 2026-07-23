import React, { useState, useEffect } from 'react';
import { setDemoMode } from '../utils/api';

export default function Settings() {
  const [demoActive, setDemoActive] = useState(
    localStorage.getItem('medhub_demo_mode') === 'true'
  );
  
  // Storage Stats
  const [stats, setStats] = useState({
    userCount: 0,
    scanCount: 0
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('medhub_theme') || 'light';
  });

  useEffect(() => {
    updateStats();
    // Apply initial theme on mount
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeMode) => {
    setCurrentTheme(themeMode);
    localStorage.setItem('medhub_theme', themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
    setNotification(`Theme updated to ${themeMode === 'dark' ? '🌙 Dark Mode (Radiology Dark)' : '☀️ Light Mode (Default Clinical)'}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const updateStats = () => {
    const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
    const scans = JSON.parse(localStorage.getItem('sim_scans') || '[]');
    setStats({
      userCount: users.length,
      scanCount: scans.length
    });
  };

  const handleDemoToggle = () => {
    const newValue = !demoActive;
    setDemoActive(newValue);
    setDemoMode(newValue);
    
    setNotification(
      newValue 
        ? 'Simulator Mode Activated. All requests fall back to localStorage.' 
        : 'Live API mode activated. App will now query the real REST server.'
    );
    
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  const handleClearDatabase = () => {
    if (window.confirm('Clear all local simulation data? This will reset the user index and scans database.')) {
      localStorage.removeItem('sim_users');
      localStorage.removeItem('sim_scans');
      localStorage.removeItem('medhub_demo_mode');
      
      // Reload page to seed database
      window.location.reload();
    }
  };

  return (
    <div className="settings-view fade-in">
      <header className="dashboard-header">
        <div>
          <h2>Portal Settings</h2>
          <p className="subtitle">Configure diagnostic imaging system tools and mock simulations</p>
        </div>
      </header>

      <div className="settings-grid">
        
        {/* Appearance & Theme Selector */}
        <section className="settings-card glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="card-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f5c4e" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <h3>Display Theme &amp; Visual Appearance</h3>
          </div>

          <p className="card-description">
            Choose between standard clean healthcare light mode and high-contrast dark mode for low-light clinical reading.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {/* Light Mode Option */}
            <div
              style={{
                border: currentTheme === 'light' ? '2px solid #1f5c4e' : '1px solid #e5e5e5',
                background: '#ffffff',
                color: '#0f172a',
                padding: '1.25rem',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentTheme === 'light' ? '0 4px 12px rgba(31, 92, 78, 0.15)' : 'none'
              }}
              onClick={() => handleThemeChange('light')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>☀️ Light Mode</span>
                {currentTheme === 'light' && <span style={{ color: '#1f5c4e', fontWeight: '800' }}>✓ Active</span>}
              </div>
              <p style={{ fontSize: '0.825rem', color: '#64748b' }}>Standard crisp medical interface with clean white panels and high-visibility typography.</p>
            </div>

            {/* Dark Mode Option */}
            <div
              style={{
                border: currentTheme === 'dark' ? '2px solid #14b8a6' : '1px solid #334155',
                background: '#0b1329',
                color: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentTheme === 'dark' ? '0 4px 16px rgba(20, 184, 166, 0.25)' : 'none'
              }}
              onClick={() => handleThemeChange('dark')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#f8fafc' }}>🌙 Dark Mode</span>
                {currentTheme === 'dark' && <span style={{ color: '#14b8a6', fontWeight: '800' }}>✓ Active</span>}
              </div>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>High-contrast dark slate theme optimized for radiology reading rooms and night shifts.</p>
            </div>
          </div>
        </section>

        {/* Connection Control */}
        <section className="settings-card glass-panel">
          <div className="card-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <h3>Clinical API Mode</h3>
          </div>

          <p className="card-description">
            Choose whether to queries should target your live HTTP backend endpoint, or fallback to the client-side diagnostic simulation engine.
          </p>

          {notification && (
            <div className="alert-success">
              <span>{notification}</span>
            </div>
          )}

          <div className="setting-control-item">
            <div className="control-label-block">
              <span className="control-title">Local Demo Simulation</span>
              <span className="control-desc">Intercept and mock standard REST operations inside localStorage</span>
            </div>
            
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={demoActive}
                onChange={handleDemoToggle}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="api-endpoint-display">
            <span className="endpoint-label">Active Connection Target:</span>
            <span className="endpoint-value">
              {demoActive ? 'Client Simulator (Offline-Ready)' : 'http://localhost:5000/api'}
            </span>
          </div>
        </section>

        {/* Database stats */}
        <section className="settings-card glass-panel">
          <div className="card-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h3>Database Statistics</h3>
          </div>

          <p className="card-description">
            View cached clinical indexes held locally inside the web browser.
          </p>

          <div className="stats-counters">
            <div className="counter-box">
              <span className="counter-val">{stats.userCount}</span>
              <span className="counter-lbl">Registered Accounts</span>
            </div>
            <div className="counter-box">
              <span className="counter-val">{stats.scanCount}</span>
              <span className="counter-lbl">Indexed Clinical Scans</span>
            </div>
          </div>

          <div className="danger-actions-zone">
            <h4>System Maintenance</h4>
            <button 
              type="button" 
              className="secondary-btn reset-db-btn"
              onClick={handleClearDatabase}
            >
              Reset Simulation DB
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
