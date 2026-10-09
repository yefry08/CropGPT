import { useState } from 'react';
import type { AuthState } from '../hooks/useAuth';

export function AccountBox({ auth }: { auth: AuthState }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.loading) return <div className="muted">Comprobando sesión…</div>;
  if (auth.user)
    return (
      <div className="account">
        <span>
          Sesión: <b>{auth.user.name}</b> <span className="muted">({auth.user.email})</span>
        </span>
        <button className="link" onClick={() => void auth.signOut()}>
          Cerrar sesión
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
      <div className="seg" role="group" aria-label="Cuenta">
        <button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
          Iniciar sesión
        </button>
        <button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
          Crear cuenta
        </button>
      </div>
      {mode === 'up' && <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Nombre en el juego" autoComplete="nickname" />}
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" autoComplete="email" />
      <input type="password" required minLength={8} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña (8+ caracteres)" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
      {err && <div className="toast inline">{err}</div>}
      <button className="primary" disabled={busy}>
        {mode === 'in' ? 'Entrar' : 'Crear cuenta'}
      </button>
    </form>
  );
}
