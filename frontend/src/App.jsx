import React from 'react'
import {Routes,Route} from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './Pages/Home'
import Collection from './Pages/Collection'
import AboutUs from './Pages/AboutUs'
import ContactUs from './Pages/ContactUs'
import Orders from './Pages/Orders'
import Product from './Pages/Product'
import Cart from './Pages/Cart'
import NavBar from './Components/NavBar'
import Login from './Pages/Login'
import PlaceOrder from './Pages/PlaceOrder'
import Footer from './Components/Footer'
import SearchBar from './Components/SearchBar'
import Verify from './Pages/Verify';
import FashionRecommender from './Pages/FashionRecommender';
const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <NavBar />
      <ToastContainer />
      <SearchBar/>
      <Routes>
        <Route path = '/' element = {<Home/>} />
        <Route path = '/Home' element = {<Home/>} />
        <Route path = '/Collection' element = {<Collection/>} />
        <Route path = '/fashion-recommender' element = {<FashionRecommender/>} />
        <Route path = '/AboutUs' element = {<AboutUs/>} />
        <Route path = '/ContactUs' element = {<ContactUs/>} />
        <Route path = '/Product/:productId' element = {<Product/>} />
        <Route path = '/Collection' element = {<Collection/>} />
        <Route path = '/Cart' element = {<Cart/>} />
        <Route path = '/Login' element = {<Login/>} />
        <Route path = '/PlaceOrder' element = {<PlaceOrder/>} />
        <Route path = '/Orders' element = {<Orders/>} />
        <Route path = '/Verify' element = {<Verify/>} />
         
      </Routes>
      <Footer/>
    </div>
  )
}

export default App
