import React, { useContext, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const NavBar = () => {
  const [visible, setVisible] = useState(false);
  const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);

  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token');
    setToken('');
    setCartItems({});
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium">
      <Link to="/">
        <img src="/src/assets/logo.png" className="w-36" alt="Logo" />
      </Link>
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/Home" className="flex flex-col items-center gap-1">
          <p>Home</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/Collection" className="flex flex-col items-center gap-1">
          <p>Collection</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/AboutUs" className="flex flex-col items-center gap-1">
          <p>About Us</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/ContactUs" className="flex flex-col items-center gap-1">
          <p>Contact Us</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>
      
      <div className="flex items-center gap-6">
        <img
          onClick={() => setShowSearch(true)}
          src="/src/assets/search_icon.png"
          className="w-5 cursor-pointer"
          alt=""
        />

        <div className="group relative">
          <img onClick={() => token ? null : navigate('/login')}
            src="/src/assets/profile_icon.png"
            className="w-5 cursor-pointer"
            alt=""
          />
          
          {token && 
          <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-4">
            <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">
              <p className="cursor-pointer hover:text-black"> My profile </p>
              <p onClick={() => navigate('/orders')} className="cursor-pointer hover:text-black"> My Orders </p>
              <p onClick={logout} className="cursor-pointer hover:text-black"> Logout </p>
            </div>
          </div>}
        </div>

        <Link to="/cart" className="relative">
          <img src="/src/assets/cart_icon.png" className="w-5 min-w-5" alt="" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {getCartCount()}
          </p>
        </Link>

        <Link to="/fashion-recommender">
          <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
            Fashion Recommender
          </button>
        </Link>

        <img
          onClick={() => setVisible(true)}
          src="/src/assets/menu_icon.png"
          className="w-5 cursor-pointer sm:hidden"
          alt=""
        />
      </div>
      
      {/* Sidebar menu for smaller screens */}
      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${
          visible ? "w-full" : "w-0"
        }`}
      >
        <div className="flex flex-col text-gray-600">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-4 p-3 cursor-pointer"
          >
            <img
              className="h-4 rotate-180"
              src="/src/assets/dropdown_icon.png"
              alt=""
            />
            <p>Back</p>
          </div>
          <NavLink onClick={() => setVisible(false)} className="py-2 p1-6 border" to="/Home">Home</NavLink>
          <NavLink onClick={() => setVisible(false)} className="py-2 p1-6 border" to="/Collection">Collection</NavLink>
          <NavLink onClick={() => setVisible(false)} className="py-2 p1-6 border" to="/AboutUs">About Us</NavLink>
          <NavLink onClick={() => setVisible(false)} className="py-2 p1-6 border" to="/ContactUs">Contact Us</NavLink>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
