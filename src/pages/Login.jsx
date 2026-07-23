import React, { useState } from 'react';
import { api } from '../utils/api';
import { decodeJWT } from '../utils/jwt';

export default function Login({ onLoginSuccess, navigateToSignup }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'medhubid'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medhubId, setMedhubId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both Email and Password fields.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const response = await api.login(email, password);
      // Store token
      localStorage.setItem('medhub_token', response.token);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(response.token);
      }, 800);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMedHubIdSubmit = async (e) => {
    e.preventDefault();
    if (!medhubId) {
      setError('Please enter your Med.hub ID.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await api.loginMedHubId(medhubId);
      localStorage.setItem('medhub_token', response.token);
      setSuccess('Access verified! Loading dashboard...');
      setTimeout(() => {
        onLoginSuccess(response.token);
      }, 800);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-logo-section">
        <div className="logo-badge">Hub</div>
        <h1 className="brand-name">Med<span>Hub</span></h1>
        <p className="brand-tagline">Advanced Clinical Diagnostics & Imaging Portal</p>
      </div>

      <div className="login-card glass-panel">
        <div className="login-tabs">
          <button 
            type="button"
            className={`login-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => { setActiveTab('account'); setError(''); }}
          >
            Account Login
          </button>
          <button 
            type="button"
            className={`login-tab ${activeTab === 'medhubid' ? 'active' : ''}`}
            onClick={() => { setActiveTab('medhubid'); setError(''); }}
          >
            Med.hub ID Login
          </button>
        </div>

        <div className="login-form-wrapper">
          {error && (
            <div className="alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'account' ? (
            <form onSubmit={handleAccountSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input 
                  id="login-email"
                  type="email" 
                  className="form-input" 
                  placeholder="name@clinical.medhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input 
                  id="login-password"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="primary-btn login-btn" disabled={loading}>
                {loading ? <div className="spinner" /> : 'Log In to System'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMedHubIdSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-medhubid">Med.hub ID</label>
                <input 
                  id="login-medhubid"
                  type="text" 
                  className="form-input" 
                  placeholder="MED-xxxx-xxxx"
                  value={medhubId}
                  onChange={(e) => setMedhubId(e.target.value)}
                  disabled={loading}
                  required
                />
                <span className="input-hint">Enter your patient or observer license key to open in read-only mode.</span>
              </div>

              <button type="submit" className="primary-btn login-btn" disabled={loading}>
                {loading ? <div className="spinner" /> : 'Access Diagnostics View'}
              </button>
            </form>
          )}
        </div>

        <div className="login-footer">
          <p>Don't have an administrative account?</p>
          <button type="button" className="text-link-btn" onClick={navigateToSignup}>
            Create an Account &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
