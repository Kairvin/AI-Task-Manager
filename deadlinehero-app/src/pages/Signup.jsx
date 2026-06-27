import './Auth.css';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../services/authService';
import { createWorkspace } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (isTeam && !teamName.trim()) { setError('Please enter a team name.'); return; }
    setLoading(true);
    try {
      const data = await signUp(email, password, name);
      if (isTeam) {
        await createWorkspace(teamName, data.user.id);
      }
      setUser(data.user);
      if (redirect === 'join') {
        const token = sessionStorage.getItem('pendingInvite');
        navigate(token ? `/join?token=${token}` : '/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await signInWithGoogle();
      if (data?.user) {
        if (isTeam && teamName) {
          await createWorkspace(teamName, data.user.id);
        }
        setUser(data.user);
        if (redirect === 'join') {
          const token = sessionStorage.getItem('pendingInvite');
          navigate(token ? `/join?token=${token}` : '/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to register with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob-1" />
      <div className="auth-bg-blob-2" />

      <Link 
        to="/" 
        style={{ 
          position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', gap: 8, 
          color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontWeight: 500,
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        Back to Home
      </Link>

      <div className="auth-card animate-fade-in">
        <div className="auth-brand">
          <h1>DeadlineHero</h1>
          <p>The Digital Curator</p>
        </div>

        <h2 className="auth-title">Create your account</h2>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" checked={!isTeam} onChange={() => setIsTeam(false)} />
              Personal Account
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" checked={isTeam} onChange={() => setIsTeam(true)} />
              Team Workspace
            </label>
          </div>

          {isTeam && (
            <div>
              <label className="form-label" htmlFor="teamName">Workspace Name</label>
              <input className="auth-input" id="teamName" type="text" placeholder="Acme Corp" value={teamName} onChange={e => setTeamName(e.target.value)} />
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input className="auth-input" id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div>
            <label className="form-label" htmlFor="email">Email address</label>
            <input className="auth-input" id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="auth-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', padding: 4 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input className="auth-input" id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '24px 0' }}>
          <span>or continue with</span>
        </div>

        <button type="button" onClick={handleGoogleSignIn} className="auth-google" disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
