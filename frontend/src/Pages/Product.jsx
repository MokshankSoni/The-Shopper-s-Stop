import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProductPage = () => {
  const { productId } = useParams(); // Get product ID from URL
  const { products, addToCart } = useContext(ShopContext); // Get products from context
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const foundProduct = products.find((item) => item._id.toString() === productId);
    setProduct(foundProduct);
  }, [productId, products]);

  if (!product) {
    return (
      <div className="text-center text-gray-500 mt-10">Product not found.</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Side - Product Image */}
        <div className="flex flex-col items-center">
          <img
            src={product.image[0]}
            alt={product.name}
            className="w-80 h-auto object-contain"
          />
        </div>

        {/* Right Side - Product Details */}
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-red-500 flex items-center gap-1 mt-2">
            ★★★★☆ <span className="text-gray-500">(122)</span>
          </p>
          <p className="text-2xl font-bold mt-3">${product.price}</p>
          <p className="text-gray-600 mt-3">{product.description}</p>

          {/* Size Selection */}
          <p className="mt-5 font-medium">Select Size</p>
          <div className="flex gap-3 mt-2">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <button
                key={size}
                className={`px-4 py-2 border rounded-md ${
                  selectedSize === size ? "border-black" : "border-gray-300"
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(product._id, selectedSize)}
            className="bg-black text-white w-full py-3 mt-5 font-medium"
          >
            ADD TO CART
          </button>

          {/* Additional Info */}
          <div className="mt-5 text-gray-600 text-sm">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description and Reviews Section */}
      <div className="mt-16 mb-20 border rounded-md p-5">
        <div className="flex gap-10 border-b pb-2">
          <p className="font-medium border-b-2 border-black pb-2">
            Description
          </p>
          <p className="text-gray-500">Reviews (122)</p>
        </div>
        <div className="mt-3 text-gray-600">
          <p>{product.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
