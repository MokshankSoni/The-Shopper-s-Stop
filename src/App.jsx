import React from 'react'
import {Routes,Route} from 'react-router-dom'
import Home from './Pages/Home'
import Collection from './Pages/Collection'
import AboutUs from './Pages/AboutUs'
import ContactUs from './Pages/ContactUs'
import Product from './Pages/Product'
import Cart from './Pages/Cart'
import NavBar from './Components/NavBar'
import Login from './Pages/Login'
import PlaceOrder from './Pages/PlaceOrder'
import Footer from './Components/Footer'
const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <NavBar />
      <Routes>
        <Route path = '/' element = {<Home/>} />
        <Route path = '/Home' element = {<Home/>} />
        <Route path = '/Collection' element = {<Collection/>} />
        <Route path = '/AboutUs' element = {<AboutUs/>} />
        <Route path = '/ContactUs' element = {<ContactUs/>} />
        <Route path = '/Product/:productId' element = {<Product/>} />
        <Route path = '/Collection' element = {<Collection/>} />
        <Route path = '/Cart' element = {<Cart/>} />
        <Route path = '/Login' element = {<Login/>} />
        <Route path = '/PlaceOrder' element = {<PlaceOrder/>} />
      </Routes>
      <Footer/>
    </div>
  )
}

export default App
