import React, { useState } from 'react';
import { api } from '../utils/api';

const CheckIcon = () => (
  <svg className="access-check" viewBox="0 0 20 20" aria-hidden="true">
    <path d="m5 10.5 3.1 3.1L15.5 6" />
  </svg>
);

export default function Login({ onLoginSuccess, navigateToSignup }) {
  const [activeTab, setActiveTab] = useState('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medhubId, setMedhubId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const value = activeTab === 'account' ? email : medhubId;
    if (!value || (activeTab === 'account' && !password)) {
      setError(activeTab === 'account' ? 'Please enter your email and password.' : 'Please enter your Med.hub ID.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = activeTab === 'account'
        ? await api.login(email, password)
        : await api.loginMedHubId(medhubId);
      localStorage.setItem('medhub_token', response.token);
      onLoginSuccess(response.token);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medhub-login fade-in">
      <header className="medhub-branding">
        <div className="medhub-brand-row">
          <span className="medhub-mark">MH</span>
          <h1>MedHub</h1>
        </div>
        <p>Sign in to view, upload, or search your records.</p>
      </header>

      <section className="medhub-card" aria-label="Sign in">
        <div className="medhub-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={activeTab === 'account'} className={activeTab === 'account' ? 'active' : ''}
            onClick={() => { setActiveTab('account'); setError(''); }}>Account &amp; Password</button>
          <button type="button" role="tab" aria-selected={activeTab === 'medhubid'} className={activeTab === 'medhubid' ? 'active' : ''}
            onClick={() => { setActiveTab('medhubid'); setError(''); }}>Med.hub ID</button>
        </div>

        <div className="medhub-form-area">
          <div className="access-heading"><span>FULL ACCESS</span><span className="zigzag">⌁</span></div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form onSubmit={submit}>
            {activeTab === 'account' ? <>
              <div className="medhub-field"><label htmlFor="login-email">Email or username</label>
                <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} /></div>
              <div className="medhub-field"><label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} /></div>
              <a className="forgot-link" href="#forgot-password" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </> : <div className="medhub-field"><label htmlFor="login-medhubid">Med.hub ID</label>
              <input id="login-medhubid" type="text" placeholder="MED-xxxx-xxxx" value={medhubId} onChange={(e) => setMedhubId(e.target.value)} disabled={loading} /></div>}
            <button className="medhub-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <p className="access-note"><CheckIcon /><strong>Full access.</strong> Upload images and scans, run analysis, export files, and edit your profile.</p>
        </div>
      </section>
      <footer className="medhub-footer">New here? <button type="button" onClick={navigateToSignup}>Create an account</button></footer>
    </div>
  );
}
