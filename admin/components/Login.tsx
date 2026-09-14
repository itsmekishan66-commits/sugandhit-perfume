import { useState } from 'react'
import type { FormEvent } from 'react'
import { backendUrl } from '../config'
import { toast } from 'react-toastify'
import { adminLoginSchema } from '../validate/schemas'

interface LoginProps {
  setToken: (token: string) => void;
}

const Login = ({ setToken }: LoginProps) => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = adminLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    try {
      const response = await fetch(backendUrl + '/api/user/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token)
        try {
          await fetch(backendUrl + '/api/note/seed', { method: 'POST', headers: { token: data.token } })
        } catch (err) {
          console.log(err)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message)
    }
  }

  return (
    <div className='w-full max-w-md card-lux rounded-4xl p-8 md:p-10 text-sm'>
      <div className='text-center mb-8'>
        <span className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-br from-gold-soft to-gold font-display text-2xl italic text-ink/60 shadow-lg shadow-gold/30 mb-4'>S</span>
        <h1 className='font-display text-3xl font-semibold'>Sugandhit<span className='gold-text'>.</span></h1>
        <p className='text-xs tracking-luxe uppercase text-ink-soft mt-2'>Admin Panel · Perfume Studio</p>
      </div>

      <form onSubmit={onSubmitHandler}>

        <div className='mb-4'>
          <p className='text-sm font-medium text-ink-soft mb-2'>Email Address</p>
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
          <p className='text-sm font-medium text-ink-soft mb-2'>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='w-full px-4 py-3 rounded-xl bg-white/70 border border-gold/25 focus:border-gold outline-none transition-colors'
            type='password'
            placeholder='Enter your password'
            required
          />
        </div>

        <button className='btn-primary mt-2 w-full' type='submit'>Login</button>
      </form>
    </div>
  )
}

export default Login