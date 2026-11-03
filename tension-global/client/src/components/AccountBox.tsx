import { useState } from 'react';
import type { AuthState } from '../hooks/useAuth';
import { useLang } from '../i18n';

export function AccountBox({ auth }: { auth: AuthState }) {
  const { tr } = useLang();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.loading) return <div className="muted">{tr('Comprobando sesión…', 'Checking session…')}</div>;
  if (auth.user)
    return (
      <div className="account">
        <span>
          {tr('Sesión', 'Signed in')}: <b>{auth.user.name}</b> <span className="muted">({auth.user.email})</span>
        </span>
        <button className="link" onClick={() => void auth.signOut()}>
          {tr('Cerrar sesión', 'Sign out')}
        </button>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = mode === 'in' ? await auth.signIn(email.trim(), pass) : await auth.signUp(name.trim() || email.split('@')[0], email.trim(), pass);
    setBusy(false);
    if (r) setErr(r);
  };

  return (
    <form className="account-form" onSubmit={submit}>
      <div className="seg" role="group" aria-label={tr('Cuenta', 'Account')}>
        <button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
          {tr('Iniciar sesión', 'Sign in')}
        </button>
        <button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
          {tr('Crear cuenta', 'Create account')}
        </button>
      </div>
      {mode === 'up' && <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder={tr('Nombre en el juego', 'In-game name')} autoComplete="nickname" />}
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr('Correo', 'Email')} autoComplete="email" />
      <input type="password" required minLength={8} value={pass} onChange={(e) => setPass(e.target.value)} placeholder={tr('Contraseña (8+ caracteres)', 'Password (8+ characters)')} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
      {err && <div className="toast inline">{err}</div>}
      <button className="primary" disabled={busy}>
        {mode === 'in' ? tr('Entrar', 'Sign in') : tr('Crear cuenta', 'Create account')}
      </button>
    </form>
  );
}
