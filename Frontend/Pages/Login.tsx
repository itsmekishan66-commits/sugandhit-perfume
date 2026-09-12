import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../Context/ShopContextObject'
import { toast } from 'react-toastify'
import Reveal from '../Components/Reveal'
import { loginSchema } from '../validate/schemas'

const Login = () => {
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const payload = parsed.data;

    try {
      const success = await fetch(backendUrl + '/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await success.json();
      if (success.ok) {
        setToken(data.token || '');
        localStorage.setItem('token', data.token || '');
        toast.success('Welcome back to Sugandhit.');
        navigate('/');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const inputClass = "w-full px-5 py-3.5 rounded-full bg-white/80 border border-gold/25 focus:border-gold transition-colors text-sm";

  return (
    <Reveal className="min-h-[70vh] flex items-center justify-center py-10">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md card-lux rounded-[2rem] p-8 md:p-10 text-sm">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-semibold">Sugandhit<span className="gold-text">.</span></p>
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-2">Sign in to continue</p>
        </div>

        <input className={inputClass + " mb-5"} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="flex justify-between text-ink-soft my-5 text-xs">
          <p className="cursor-pointer hover:text-espresso transition-colors">Forgot password?</p>
          <p onClick={() => navigate('/register')} className="cursor-pointer text-gold font-medium">Create account</p>
        </div>

        <button className="btn-primary w-full">Sign In</button>

        <p className="text-center text-[11px] text-ink-soft mt-5">
          By continuing you agree to our Terms & Privacy.
        </p>
      </form>
    </Reveal>
  );
};

export default Login;