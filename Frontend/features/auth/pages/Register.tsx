import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '@/components/feedback/toast'
import Reveal from '@/components/ui/Reveal'
import { registerSchema } from '@/validate/schemas'
import { useAuth } from '@/context/AuthContext'
import { registerUser } from '../auth.service'

const Register = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = registerSchema.safeParse({ name, email, password, phone, address });
    if (!parsed.success) {
      showToast(parsed.error.issues[0].message, 'error');
      return;
    }
    const payload = parsed.data;

    try {
      const { success, message } = await registerUser(payload);
      if (success) {
        showToast('Account created successfully. Please sign in.', 'success');
        navigate('/login');
      } else {
        showToast(message || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast((error as Error).message, 'error');
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
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-2">Create your account</p>
        </div>

        <input className={inputClass + " mb-5"} type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass + " mb-5"} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass + " mb-5"} type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input className={inputClass + " mb-5"} type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="flex justify-between text-ink-soft my-5 text-xs">
          <p className="cursor-pointer hover:text-espresso transition-colors">Forgot password?</p>
          <p onClick={() => navigate('/login')} className="cursor-pointer text-gold font-medium">Login instead</p>
        </div>

        <button className="btn-primary w-full">Create Account</button>

        <p className="text-center text-[11px] text-ink-soft mt-5">
          By continuing you agree to our Terms & Privacy.
        </p>
      </form>
    </Reveal>
  );
};

export default Register;