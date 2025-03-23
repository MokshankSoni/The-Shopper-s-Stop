import React from 'react'
import {assets} from '../assets/assets.js'
import { FRONTEND_APP_URL } from '../App'

const Navbar = ({setToken}) => {

  const handleLogout = () => {
    // First clear all tokens and storage
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    
    // Then redirect to frontend login page directly
    window.location.replace(`${FRONTEND_APP_URL}`);
  }

  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <img className='w-[max(10%,80px)]' src={assets.logo} alt="" />
      <button onClick={handleLogout} className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'>Logout</button>
    </div>
  )
}

export default Navbar
