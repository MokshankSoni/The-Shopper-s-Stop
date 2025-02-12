import { createContext, useEffect, useState } from "react";
import { products } from "../assets/assets";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 100;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});

  // Function to add items to cart
  const addToCart = (itemId, size) => {
    if (!size) {
      alert("Please select a size before adding to cart.");
      return;
    }

    setCartItems((prevCart) => {
      let updatedCart = { ...prevCart };

      if (updatedCart[itemId]) {
        if (updatedCart[itemId][size]) {
          updatedCart[itemId][size] += 1;
        } else {
          updatedCart[itemId][size] = 1;
        }
      } else {
        updatedCart[itemId] = { [size]: 1 };
      }

      return updatedCart;
    });
  };

 const getCartCount=()=>{
  let totalcount = 0;
  for(const items in cartItems){
    for(const item in cartItems[items]){
      try {
        if(cartItems[items][item] > 0){
          totalcount += cartItems[items][item];
        }
      } catch (error) {
        
      }
    }
  }
  return totalcount;
 }
 const updateQuantity= async (itemId,size,quantity) =>{
    let cartData = structuredClone(cartItems) ;
    cartData[itemId][size] = quantity;
    setCartItems(cartData)
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
    updateQuantity
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
