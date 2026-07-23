import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const CheckIcon = () => (
  <svg className="access-check" viewBox="0 0 20 20" aria-hidden="true">
    <path d="m5 10.5 3.1 3.1L15.5 6" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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
      sessionStorage.setItem('medhub_token', response.token);
      localStorage.removeItem('medhub_token');
      onLoginSuccess(response.token);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = (import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || '';

  const handleGoogleCredentialResponse = React.useCallback(async (googleResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.loginGoogle({
        credential: googleResponse.credential,
        idToken: googleResponse.credential,
      });
      sessionStorage.setItem('medhub_token', response.token);
      localStorage.removeItem('medhub_token');
      onLoginSuccess(response.token);
    } catch (err) {
      setError(err.message || 'Google Single Sign-On authentication failed.');
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess]);

  const isGisInitializedRef = React.useRef(false);

  useEffect(() => {
    // Google Client ID must end with .apps.googleusercontent.com (NOT start with GOCSPX-)
    const isValidClientId = googleClientId && googleClientId.includes('.apps.googleusercontent.com');

    if (!isValidClientId) {
      return;
    }

    const initializeGis = () => {
      if (isGisInitializedRef.current) return; // guard: never initialize twice
      if (!window.google?.accounts?.id) return; // script not ready yet

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnParent = document.getElementById('google-official-btn');
        if (btnParent) {
          window.google.accounts.id.renderButton(btnParent, {
            theme: 'outline',
            size: 'large',
            width: '320',
            text: 'continue_with',
          });
        }
        isGisInitializedRef.current = true;
      } catch (e) {
        console.warn('Google GIS initialize warning:', e.message);
      }
    };

    // Try immediately in case the script already loaded
    initializeGis();

    // If it wasn't ready yet, poll briefly until the script finishes loading
    let attempts = 0;
    const maxAttempts = 20; // ~10 seconds at 500ms
    const pollId = setInterval(() => {
      attempts += 1;
      if (isGisInitializedRef.current || attempts >= maxAttempts) {
        clearInterval(pollId);
        return;
      }
      initializeGis();
    }, 500);

    return () => clearInterval(pollId);
  }, [googleClientId, handleGoogleCredentialResponse]);

  const handleGoogleSignIn = async () => {
    setError('');

    // Standard Google OAuth 2.0 popup via initTokenClient
    if (window.google?.accounts?.oauth2 && googleClientId) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setError('Google OAuth sign-in was canceled or denied.');
              setLoading(false);
              return;
            }
            try {
              const response = await api.loginGoogle({
                accessToken: tokenResponse.access_token,
              });
              sessionStorage.setItem('medhub_token', response.token);
              localStorage.removeItem('medhub_token');
              onLoginSuccess(response.token);
            } catch (err) {
              setError(err.message || 'Google Single Sign-On failed.');
            } finally {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('initTokenClient error:', e.message);
        setError('Google sign-in is not available right now. Please try again in a moment.');
        setLoading(false);
        return;
      }
    }

    // Google SDK not ready yet
    setError('Google sign-in is still loading. Please try again in a few seconds.');
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

          <button
            type="button"
            className="secondary-btn google-auth-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              marginBottom: '16px',
              backgroundColor: '#ffffff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div style={{ textAlign: 'center', margin: '8px 0 16px 0', color: '#888', fontSize: '12px' }}>
            ────── OR ──────
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}
          <form onSubmit={submit} autoComplete="off">
            {activeTab === 'account' ? <>
              <div className="medhub-field"><label htmlFor="login-email">Email or username</label>
                <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoComplete="off" /></div>
              <div className="medhub-field"><label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} autoComplete="new-password" /></div>
              <a className="forgot-link" href="#forgot-password" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </> : <div className="medhub-field"><label htmlFor="login-medhubid">Med.hub ID</label>
              <input id="login-medhubid" type="text" placeholder="MED-xxxx-xxxx" value={medhubId} onChange={(e) => setMedhubId(e.target.value)} disabled={loading} autoComplete="off" /></div>}
            <button className="medhub-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <p className="access-note"><CheckIcon /><strong>Full access.</strong> Upload images and scans, run analysis, export files, and edit your profile.</p>
        </div>
      </section>
      <footer className="medhub-footer">New here? <button type="button" onClick={navigateToSignup}>Create an account</button></footer>
    </div>
  );
}
