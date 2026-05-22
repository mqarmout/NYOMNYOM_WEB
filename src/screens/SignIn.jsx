import { useState } from 'react';
import { apiFetch } from '../utils';

export default function SignIn({ onLogin, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    const res = await apiFetch('/api/auth/login', {
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
      <div className="auth-logo">
        <div className="auth-logo-icon">N</div>
        <h1>NYOMNYOM</h1>
        <p>Your personal dashboard</p>
      </div>

      <div className="auth-heading">Sign in to your account</div>

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
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading || !username.trim() || !password}
        >
          {loading ? 'Please wait…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
