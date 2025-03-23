import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import {Routes, Route, useLocation} from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '$'
export const FRONTEND_APP_URL = 'http://localhost:5173' // Replace with your frontend app URL/port

const App = () => {
  const location = useLocation();
  const [token, setToken] = useState(() => {
    // Check URL parameters first, then localStorage
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      return urlToken;
    }
    return localStorage.getItem('token') || '';
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Clean up URL if token was passed as parameter
      const params = new URLSearchParams(location.search);
      if (params.has('token')) {
        window.history.replaceState({}, '', location.pathname);
      }
    }
  }, [token, location]);

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer/>
      {
        token === ""
          ? <Login setToken={setToken}/>
          : <>
            <Navbar setToken={setToken} />
            <hr />
            <div className='flex w-full'>
              <Sidebar/>
              <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/add' element={<Add token={token} />}/>
                <Route path='/list' element={<List token={token} />}/>
                <Route path='/orders' element={<Orders token={token} />}/>
              </Routes>
              </div>
            </div>
          </>
      }
    </div>
  )
}

export default App
