import React, { useState } from 'react';

const SubscriptionForm = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Subscribing user:', { email });
  };

  return (
    <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Subscribe now & get 20% off</h2>
      <p className="text-gray-600 mb-6 text-center">
      Sign up for our newsletter to receive exclusive offers and updates."
      </p>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          placeholder='Enter your email:'
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-gray-100 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <button
          type="submit"
          className="bg-indigo-500 text-white px-4 py-2 rounded-r-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          SUBSCRIBE
        </button>
      </form>
    </div>
  );
};

export default SubscriptionForm;