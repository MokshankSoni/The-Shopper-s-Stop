import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from "react-toastify";

// Add this constant at the top of your file
const ADMIN_APP_URL = 'http://localhost:5174'; // Replace with your admin app URL/port

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)  

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('customer')

  const onSubmitHandler = async(event) => {
    event.preventDefault();
    try {
      if(currentState === 'Sign Up') {
        const response = await axios.post(backendUrl + '/api/user/register', {
          name,
          email,
          password,
          role: selectedRole
        })
        if(response.data.success) {
          setToken(response.data.token)
          // Store token in both localStorage and sessionStorage for cross-app access
          localStorage.setItem('token', response.data.token)
          sessionStorage.setItem('token', response.data.token)
          localStorage.setItem('role', response.data.role)
          sessionStorage.setItem('role', response.data.role)
          
          if(response.data.role === 'admin') {
            // Redirect to admin app with token
            window.location.href = `${ADMIN_APP_URL}/add?token=${response.data.token}`;
          } else {
            navigate('/')
          }
        } else {
          toast.error(response.data.message)
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', {
          email,
          password,
          role: selectedRole
        })
        if(response.data.success) {
          setToken(response.data.token)
          // Store token in both localStorage and sessionStorage for cross-app access
          localStorage.setItem('token', response.data.token)
          sessionStorage.setItem('token', response.data.token)
          localStorage.setItem('role', response.data.role)
          sessionStorage.setItem('role', response.data.role)
          
          if(response.data.role === 'admin') {
            // Redirect to admin app with token
            window.location.href = `${ADMIN_APP_URL}/add?token=${response.data.token}`;
          } else {
            navigate('/')
          }
        } else {
          toast.error(response.data.message)
        }        
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || 'Authentication failed')
    }
  }

  useEffect(() => {
    if(token) {
      const userRole = localStorage.getItem('role')
      if(userRole === 'admin') {
        navigate('/admin/Add')
      } else {
        navigate('/')
      }
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col item-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800'/>
      </div>
      {currentState === 'Login' ? '' : 
        <input 
          onChange={(e)=>setName(e.target.value)}  
          value={name} 
          type="text" 
          className='w-full px-3 py-2 border border-gray-800' 
          placeholder='Name' 
          required
        />
      }
      <input 
        onChange={(e)=>setEmail(e.target.value)}  
        value={email} 
        type="email" 
        className='w-full px-3 py-2 border border-gray-800' 
        placeholder='Email' 
        required
      />
      <input 
        onChange={(e)=>setPassword(e.target.value)}  
        value={password} 
        type="password" 
        className='w-full px-3 py-2 border border-gray-800' 
        placeholder='Password' 
        required
      />
      <select
        onChange={(e) => setSelectedRole(e.target.value)}
        value={selectedRole}
        className='w-full px-3 py-2 border border-gray-800'
        required
      >
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
      </select>
      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        {
          currentState === 'Login'
          ? <p onClick={()=>setCurrentState('Sign Up')} className='cursor-pointer'>Create account</p>
          : <p onClick={()=>setCurrentState('Login')} className='cursor-pointer'>Login Here</p>
        }
      </div>
      <button className='bg-black text-white font-light px-8 py-2 mt-4'>
        {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
      </button>
    </form>
  )
}

export default Login
