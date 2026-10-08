import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'react-toastify'
import { adminLoginSchema } from '@/validate/schemas';
import { useAuth } from '@/context/useAuth';
import FormErrors from '@/components/feedback/FormErrors';
import RequiredMark from '@/components/ui/RequiredMark';
import { useFormErrors } from '@/hooks/useFormErrors';

const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { errors, validate, clearErrors } = useFormErrors()

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = adminLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      return validate(parsed.error.issues.map((issue) => issue.message));
    }
    setBusy(true);
    try {
      await login(email, password);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='w-full max-w-md card-lux rounded-4xl p-8 md:p-10 text-sm'>
      <div className='text-center mb-8'>
        <span className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-br from-gold-soft to-gold font-display text-2xl italic text-ink/60 shadow-lg shadow-gold/30 mb-4'>S</span>
        <h1 className='font-display text-3xl font-semibold'>Sugandhit<span className='gold-text'>.</span></h1>
        <p className='text-xs tracking-luxe uppercase text-ink-soft mt-2'>Admin Panel · Perfume Studio</p>
      </div>

      <form onSubmit={onSubmitHandler} onChangeCapture={clearErrors} noValidate>
        <div className='mb-4'>
          <p className='text-sm font-medium text-ink-soft mb-2'>Email Address<RequiredMark /></p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='w-full px-4 py-3 rounded-xl bg-white/70 border border-gold/25 focus:border-gold outline-none transition-colors'
            type='email'
            placeholder='your@email.com'
            required
          />
        </div>
        <div className='mb-6'>
          <p className='text-sm font-medium text-ink-soft mb-2'>Password<RequiredMark /></p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='w-full px-4 py-3 rounded-xl bg-white/70 border border-gold/25 focus:border-gold outline-none transition-colors'
            type='password'
            placeholder='Enter your password'
            required
          />
        </div>

        <div className='mt-2 flex flex-col items-start gap-3'>
          <FormErrors errors={errors} />
          <button className='btn-primary w-full disabled:opacity-50' type='submit' disabled={busy}>
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login