import { createContext } from "react";
import { products } from "../assets/assets";
export const ShopContext = createContext();

const ShopContextprovider =(props) =>{
    
    const currency = '₹';
    const delivery_fee = 100;
    
    const value = {
        products , currency, delivery_fee
    }
    return(
        <ShopContext.Provider value ={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextprovider;