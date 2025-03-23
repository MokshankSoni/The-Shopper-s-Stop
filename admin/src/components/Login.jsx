import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = ({setToken}) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('customer')

    const onSubmitHandler = async(e) => {
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/user/login', {
                email,
                password,
                role
            })
            if(response.data.success) {
                setToken(response.data.token)
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('role', response.data.role)
                if(response.data.role === 'admin') {
                    navigate('/admin/Add')
                } else {
                    navigate('/')
                }
            } 
            else {
                toast.error(response.data.message)
            }
        } catch(error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Login failed')
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center w-full'>
            <div className='bg-white shadow-lg shadow-gray-600/30 rounded-lg px-8 py-6 max-w-md'>
                <h1 className='text-2xl font-bold mb-4'>Login</h1>
                <form onSubmit={onSubmitHandler}>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Email Address</p>
                        <input 
                            onChange={(e)=>setEmail(e.target.value)} 
                            value={email} 
                            className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' 
                            type='email' 
                            placeholder='your@email.com' 
                            required
                        />
                    </div>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Password</p>
                        <input 
                            onChange={(e)=>setPassword(e.target.value)} 
                            value={password} 
                            className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' 
                            type='password' 
                            placeholder='Enter your password' 
                            required
                        />
                    </div>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Role</p>
                        <select 
                            onChange={(e)=>setRole(e.target.value)} 
                            value={role}
                            className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none'
                            required
                        >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button className='mt-2 w-full py-2 px-4 rounded-md text-white bg-black' type='submit'>
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login
