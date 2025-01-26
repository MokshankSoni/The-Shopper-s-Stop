import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./Productitem";

const BestSeller = () => {
    const { products } = useContext(ShopContext);
    const [bestseller, setBestSeller] = useState([]);

    useEffect(() => {
        if (products?.length) {
            const bestProduct = products.filter((item) => item.bestseller);
            setBestSeller(bestProduct.slice(0, 5));
        }
    }, [products]);

    return (
        <div className="my-10">
            <div className="text-center text-3xl py-8">
                <Title text1={"BEST"} text2={"SELLERS"} />
                <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
                    Discover our best-selling styles loved by shoppers worldwide!
                </p>
            </div>
            {bestseller.length === 0 ? (
                <p className="text-center text-gray-600">
                    No best-selling products available.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-6">
                    {bestseller.map((item, index) => (
                        <ProductItem
                            key={index}
                            id={item._id}
                            name={item.name}
                            image={item.image}
                            price={item.price}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BestSeller;
