import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ busy: false, error: '' });

  if (user) return <Navigate to={location.state?.from || '/admin/dashboard'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '' });
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    } catch (err) {
      setState({ busy: false, error: err.response?.data?.message || 'Login failed. Please try again.' });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-24">
          <img src="/logo.svg" alt="" style={{ width: 54, margin: '0 auto 12px' }} />
          <h2 style={{ marginBottom: 2 }}>Skinoveda Admin</h2>
          <p className="muted" style={{ fontSize: '.88rem' }}>Sign in to manage your wellness centre</p>
        </div>

        {state.error && <div className="alert alert-error">{state.error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email" required autoFocus value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@skinoveda.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" required value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-purple btn-block" disabled={state.busy}>
            {state.busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center muted mt-24" style={{ fontSize: '.82rem', marginBottom: 0 }}>
          <Link to="/">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
