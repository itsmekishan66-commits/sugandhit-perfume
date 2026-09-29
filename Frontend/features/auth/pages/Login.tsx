import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '@/components/feedback/toast'
import Reveal from '@/components/ui/Reveal'
import { loginSchema } from '@/validate/schemas'
import { useAuth } from '@/context/AuthContext'
import { loginUser } from '../auth.service'

const Login = () => {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const message = parsed.error.issues[0].message;
      setError(message);
      showToast(message, 'error');
      return;
    }
    const payload = parsed.data;

    setBusy(true);
    try {
      const { success, token: nextToken, message } = await loginUser(payload);
      if (success) {
        setToken(nextToken);
        showToast('Welcome back to Sugandhit.', 'success');
        navigate('/');
      } else {
        const reason = message || 'We could not sign you in. Please try again.';
        setError(reason);
        showToast(reason, 'error');
      }
    } catch (err) {
      const reason = (err as Error).message;
      setError(reason);
      showToast(reason, 'error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const inputClass = "w-full px-5 py-3.5 rounded-full bg-white/80 border border-gold/25 focus:border-gold transition-colors text-sm";

  return (
    <Reveal className="min-h-[70vh] flex items-center justify-center py-10">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md card-lux rounded-4xl p-8 md:p-10 text-sm">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-semibold">Sugandhit<span className="gold-text">.</span></p>
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-2">Sign in to continue</p>
        </div>

        <input
          className={inputClass + " mb-5"}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          required
        />

        <div className="flex justify-between text-ink-soft my-5 text-xs">
          <p className="cursor-pointer hover:text-espresso transition-colors">Forgot password?</p>
          <p onClick={() => navigate('/register')} className="cursor-pointer text-gold font-medium">Create account</p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-2xl border border-red-300/60 bg-red-50/80 px-4 py-3 text-xs leading-snug text-red-700"
          >
            <span className="font-medium"></span>
            <span className="min-w-0 flex-1">{error}</span>
          </p>
        )}

        <button className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-[11px] text-ink-soft mt-5">
          By continuing you agree to our Terms & Privacy.
        </p>
      </form>
    </Reveal>
  );
};

export default Login;