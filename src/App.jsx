import React, { useState, useEffect } from 'react';
import { decodeJWT, isTokenExpired } from './utils/jwt';
import { api } from './utils/api';

// Pages & Components
import Login from './pages/Login';
import Signup from './pages/Signup';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('loading'); // 'loading', 'login', 'signup', 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'profile', 'settings'

  // Session authentication checking on app startup
  useEffect(() => {
    const storedToken = localStorage.getItem('medhub_token');
    if (storedToken) {
      const decoded = decodeJWT(storedToken);
      if (decoded && !isTokenExpired(decoded)) {
        setToken(storedToken);
        // Map token fields to session user
        setUser({
          id: decoded.sub,
          name: decoded.name || decoded.email,
          email: decoded.email,
          role: decoded.role || 'readonly',
          medhubId: decoded.medhubId || decoded.medHubId || 'MED-100100'
        });
        setCurrentPage('dashboard');
      } else {
        // Expired or corrupted session
        localStorage.removeItem('medhub_token');
        setToken(null);
        setUser(null);
        setCurrentPage('login');
      }
    } else {
      setCurrentPage('login');
    }
  }, []);

  const handleLoginSuccess = (newToken) => {
    const decoded = decodeJWT(newToken);
    if (decoded) {
      setToken(newToken);
      setUser({
        id: decoded.sub,
        name: decoded.name || decoded.email,
        email: decoded.email,
        role: decoded.role || 'readonly',
        medhubId: decoded.medhubId || decoded.medHubId || 'MED-100100'
      });
      setCurrentPage('dashboard');
      setActiveTab('dashboard');
    }
  };

  const handleSignupSuccess = (newToken) => {
    handleLoginSuccess(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('medhub_token');
    setToken(null);
    setUser(null);
    setCurrentPage('login');
  };

  const renderActiveSubView = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard user={user} />;
    }
  };

  // Rendering Routing Tree
  if (currentPage === 'loading') {
    return (
      <div className="app-loader-viewport">
        <div className="spinner" />
        <h2 className="loading-logo-text">MED<span>HUB</span></h2>
        <p className="loading-status">Syncing clinical imaging index...</p>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <main className="auth-viewport">
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          navigateToSignup={() => setCurrentPage('signup')} 
        />
      </main>
    );
  }

  if (currentPage === 'signup') {
    return (
      <main className="auth-viewport">
        <Signup 
          onSignupSuccess={handleSignupSuccess} 
          navigateToLogin={() => setCurrentPage('login')} 
        />
      </main>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <div className="app-workspace-layout">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          onLogout={handleLogout} 
        />
        <main className="workspace-content-pane">
          {renderActiveSubView()}
        </main>
      </div>
    );
  }

  return null;
}
