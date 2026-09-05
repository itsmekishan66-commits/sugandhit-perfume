import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../Context/ShopContext'
import { toast } from 'react-toastify'
import Reveal from '../Components/Reveal'

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Sign Up') {
        const { success } = await fetch(backendUrl + '/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await success.json();
        if (success.ok) {
          setToken(data.token || '');
          localStorage.setItem('token', data.token || '');
          toast.success('Account created — welcome to Sugandhit');
        } else {
          toast.error(data.message || 'Registration failed');
        }
      } else {
        const { success } = await fetch(backendUrl + '/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await success.json();
        if (success.ok) {
          setToken(data.token || '');
          localStorage.setItem('token', data.token || '');
          toast.success('Welcome back');
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      toast.error(error.message);
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
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-2">
            {currentState === 'Login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {currentState === 'Sign Up' && (
          <input className={inputClass + " mb-5"} type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className={inputClass + " mb-5"} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="flex justify-between text-ink-soft my-5 text-xs">
          <p className="cursor-pointer hover:text-espresso transition-colors">Forgot password?</p>
          <p
            onClick={() => { setCurrentState(currentState === 'Login' ? 'Sign Up' : 'Login'); setName(''); setEmail(''); setPassword(''); }}
            className="cursor-pointer text-gold font-medium"
          >
            {currentState === 'Login' ? 'Create account' : 'Login instead'}
          </p>
        </div>

        <button className="btn-primary w-full">
          {currentState === 'Login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="text-center text-[11px] text-ink-soft mt-5">
          By continuing you agree to our Terms & Privacy.
        </p>
      </form>
    </Reveal>
  );
};

export default Login;