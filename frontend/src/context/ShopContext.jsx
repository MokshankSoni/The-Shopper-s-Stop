import { createContext, useEffect, useState } from "react";
import {toast} from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { use } from "react";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 100;
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products,setProducts] = useState([]);
  const [token,setToken] = useState('')
  const [role, setRole] = useState('')
  const navigate = useNavigate()

  // Function to add items to cart
  const addToCart = async(itemId, size) => {
    if (!size) {
      alert("Please select a size before adding to cart.");
      return;
    }

    let cartData = structuredClone(cartItems);

    if(cartData[itemId]){
      if(cartData[itemId][size]){
        cartData[itemId][size] += 1;
      }
      else{
        cartData[itemId][size] = 1;
      }
    }
    else{
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    setCartItems(cartData);

    if (token) {
      try {
        const response = await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size }, 
          { headers: { token } }
        );

        if (response.data.success) {
          toast.success(response.data.message);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error(error.response?.data?.message || "Failed to add to cart.");
      }
    }
  };

  // Function to get total count of items in cart
  const getCartCount = () => {
    let totalCount = 0;
    for(const items in cartItems){
      for(const item in cartItems[items]){
        try {
          if(cartItems[items][item]>0){
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          
        }
      }
    }
    return totalCount;
  };

  // Function to update quantity in cart
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);
    
    if(token){
      try {
        await axios.post(
          backendUrl + '/api/cart/update',
          {itemId, size, quantity},
          { headers: { token } }
        )
      } catch (error) {
        console.error("Error updating cart:", error);
        toast.error(error.response?.data?.message || "Failed to update cart.");
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for(const items in cartItems){
      let itemInfo = products.find((product)=>product._id === items)
      for(const item in cartItems[items]){
        try { 
          if(cartItems[items][item] > 0){
            totalAmount += itemInfo.price * cartItems[items][item]
          }
        } catch (error) {
          
        }
      }
     }
     return totalAmount;
  }

  const getProductsData = async () => {
    try {
      const headers = token ? { token } : {};
      const response = await axios.get(backendUrl + '/api/product/list', { headers });
      if(response.data.success){
        setProducts(response.data.products)
      } else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to fetch products");
    }
  }

  const getUserCart = async (token) => {
    if (!token) return; // Don't attempt to fetch cart if no token
    
    try {
      const response = await axios.post(
        backendUrl + '/api/cart/get',
        {},
        { headers: { token } }
      )

      if(response.data.success){
        setCartItems(response.data.cartData)
      }
    } catch (error) {
      console.log(error);
      // Only show error if it's not a 401 (Unauthorized) error
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Failed to fetch cart");
      }
    }
  }

  useEffect(()=>{
    getProductsData()
  },[])

  useEffect(()=>{
    const storedToken = localStorage.getItem('token')
    if(!token && storedToken){
      setToken(storedToken)
      setRole(localStorage.getItem('role'))
      getUserCart(storedToken)
    }
  },[])

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    setCartItems,
    role,
    setRole
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
