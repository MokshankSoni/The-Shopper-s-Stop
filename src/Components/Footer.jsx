import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-4 text-black">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Home</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">About us</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Delivery</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Privacy policy</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4 text-black">Categories</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Shirts</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Pants</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Dresses</a></li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Accessories</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4 text-black">Get in Touch</h3>
          <ul className="space-y-2">
            <li className="text-gray-600">+1-000-000-0000</li>
            <li className="text-gray-600">greatstackdev@gmail.com</li>
            <li><a href="#" className="hover:text-gray-600 text-gray-600">Instagram</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4 text-black">Newsletter</h3>
          <p className="mb-4 text-gray-600">Subscribe to our newsletter for exclusive offers and updates.</p>
          <form className="flex">
            <input type="email" placeholder="Enter your email" className="flex-1 bg-gray-100 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#004cd6] focus:border-[#004cd6]" />
            <button type="submit" className="bg-[#004cd6] text-white px-4 py-2 rounded-r-md hover:bg-[#0057e6] focus:outline-none focus:ring-2 focus:ring-[#004cd6] focus:ring-offset-2">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} greatstack.dev. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;