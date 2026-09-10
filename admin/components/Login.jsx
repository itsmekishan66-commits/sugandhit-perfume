import { useState } from 'react'
import PropTypes from 'prop-types'
import { backendUrl } from '../config'
import { toast } from 'react-toastify'

const Login = ({setToken}) => {

    const [email,setEmail]= useState('')
    const [password,setPassword]= useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const formData = {email,password};
            const response = await fetch(backendUrl + '/api/user/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
             setToken(data.token)
             try { await fetch(backendUrl + '/api/note/seed', { method: 'POST', headers: { token: data.token } }) } catch (err) { console.log(err) }
            } else {
             toast.error(data.message)
            }
            
        } catch (error) {
           console.log(error);
           toast.error(error.message)
        }
    }
  return (
    <div className='bg-white/90 backdrop-blur shadow-2xl rounded-3xl px-10 py-12 max-w-md border border-orange-100 w-full'>
        <div className='flex flex-col items-center mb-8'>
          <span className='w-12 h-12 rounded-full bg-gradient-to-br from-[#7c2d12] to-[#C586A5] mb-4'></span>
          <h1 className='text-3xl font-bold gradient-text'>Sugandhit</h1>
          <p className='text-gray-400 text-sm mt-1'>Admin Panel · Perfume Studio</p>
        </div>

        <form onSubmit={onSubmitHandler}>

            <div className='mb-4'>
                <p className='text-sm font-medium text-gray-700 mb-2'>Email Address</p>
                <input onChange={(e)=>setEmail(e.target.value)} value={email} className='rounded-xl w-full px-4 py-3 border border-orange-100 outline-none focus:ring-2 focus:ring-[#C586A5]/40 bg-[#fdf6ef]/50' type='email' placeholder='your@email.com' required />
            </div>
            <div className='mb-6'>
                <p className='text-sm font-medium text-gray-700 mb-2'>Password</p>
                <input onChange={(e)=>setPassword(e.target.value)} value={password} className='rounded-xl w-full px-4 py-3 border border-orange-100 outline-none focus:ring-2 focus:ring-[#C586A5]/40 bg-[#fdf6ef]/50' type='password' placeholder='Enter your password' required />
            </div>

            <button className='mt-2 w-full py-3 rounded-xl text-white bg-gradient-to-r from-[#7c2d12] to-[#C586A5] font-medium hover:opacity-90 transition-opacity' type='submit'>Login</button>
        </form>
      </div>
  )
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired
}

export default Login