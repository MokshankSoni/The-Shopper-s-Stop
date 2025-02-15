import { createContext, useState } from "react";
import { products } from "../assets/assets";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 100;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
   const navigate = useNavigate()

  // Function to add items to cart
  const addToCart = (itemId, size) => {
    if (!size) {
      alert("Please select a size before adding to cart.");
      return;
    }

    setCartItems((prevCart) => {
      let updatedCart = { ...prevCart };

      if (updatedCart[itemId]) {
        updatedCart[itemId] = { ...updatedCart[itemId] }; // Ensure reactivity
        updatedCart[itemId][size] = (updatedCart[itemId][size] || 0) + 1;
      } else {
        updatedCart[itemId] = { [size]: 1 };
      }

      return updatedCart;
    });
  };

  // Function to update quantity in cart
  const updateQuantity = (itemId, size, newQuantity) => {
    setCartItems((prevCart) => {
      let updatedCart = { ...prevCart };

      if (newQuantity > 0) {
        if (!updatedCart[itemId]) updatedCart[itemId] = {};
        updatedCart[itemId] = { ...updatedCart[itemId] }; // Ensure reactivity
        updatedCart[itemId][size] = newQuantity;
      } else {
        if (updatedCart[itemId]) {
          delete updatedCart[itemId][size]; // Remove size if 0
          if (Object.keys(updatedCart[itemId]).length === 0) {
            delete updatedCart[itemId]; // Remove item if empty
          }
        }
      }

      return updatedCart;
    });
  };

  // Function to get total count of items in cart
  const getCartCount = () => {
    return Object.values(cartItems).reduce(
      (total, item) =>
        total + Object.values(item).reduce((sum, qty) => sum + qty, 0),
      0
    );
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
    navigate
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
