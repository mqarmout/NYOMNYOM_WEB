import { useState } from 'react';
import { apiFetch } from '../utils';
import { IClose } from '../icons';

export default function SignIn({ onLogin, onClose }) {
  const [mode,     setMode]     = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    const res = await apiFetch('/api/auth/' + mode, {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onLogin(res.user);
    }
  };

  return (
    <div className="auth-card">
      {onClose && (
        <button className="close-btn" onClick={onClose} style={{ float: 'right', marginBottom: 8 }}><IClose /></button>
      )}
      <div className="auth-logo">
        <div className="auth-logo-icon">N</div>
        <h1>NYOMNYOM</h1>
        <p>Your personal dashboard</p>
      </div>

      <div className="auth-heading">
        {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading || !username.trim() || !password}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="auth-toggle">
        {mode === 'login' ? (
          <>Don't have an account?{' '}
            <button onClick={() => { setMode('register'); setError(''); }}>Register</button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          </>
        )}
      </div>
    </div>
  );
}
