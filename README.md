# 🛍️ Shopper's Stop

A full-stack e-commerce platform with:

- Customer-facing frontend
- Admin dashboard
- Node.js/Express backend (REST API)
- Deep learning-based fashion recommender microservice

---

## 📚 Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [Frontend Features](#frontend-features)
- [Admin Panel Features](#admin-panel-features)
- [Fashion Recommender System](#fashion-recommender-system)
- [Tech Stack](#tech-stack)

---

## 🗂️ Project Structure

```
Shopper's stop/
  ├── admin/                # Admin dashboard (React + Vite)
  ├── backend/              # Node.js/Express REST API
  ├── fashion-recommender/  # FastAPI + TensorFlow Serving
  └── frontend/             # Customer-facing React app
```

---

## ✨ Features

- **Frontend**: Product browsing, search, cart, checkout, order history, authentication, and fashion recommendations.
- **Admin**: Product management, order management, user management.
- **Backend**: RESTful API, JWT authentication, product/order/cart/user endpoints, payment integration (Stripe, Razorpay).
- **Fashion Recommender**: Suggests similar products using deep learning and image similarity.

---

## ⚙️ Setup & Installation

### 📦 Prerequisites

- Node.js (v18+ recommended)
- Python 3.9+ (for recommender)
- Docker & Docker Compose (for recommender)
- MongoDB (Atlas)

### 🚀 1. Clone the Repository

```bash
git clone https://github.com/MokshankSoni/The-Shopper-s-Stop/tree/main/fashion-recommender
cd Shopper's\ stop
```

### 🛠️ 2. Backend Setup

```bash
cd backend
npm install
# For development (with auto-reload)
npm run server
# For production
npm start
```

- Configure environment variables in `.env` (MongoDB URI, JWT secret, etc.)

### 🌐 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 🧑‍💼 4. Admin Dashboard Setup

```bash
cd admin
npm install
npm run dev
```

### 🧠 5. Fashion Recommender

See [`fashion-recommender/README.md`](fashion-recommender/README.md) for detailed setup. In summary:

```bash
cd fashion-recommender
pip install -r requirements.txt
docker-compose up -d
```

- Download and place the model as described in the recommender's README.

---

### Fashion Recommender Endpoint

- `POST /api/fashion/uploadImageAndPredict` – Upload image and get recommendations (auth required)

---

## 🛍️ Frontend Features

The customer-facing frontend is built with React, Vite, and Tailwind CSS. It provides a modern, responsive shopping experience with the following features:

- **Homepage**: Hero section, latest collection, bestsellers, and store policies.
- **Product Browsing**: View all products, filter by category/subcategory, and sort by price.
- **Product Details**: View detailed product info, select size, and add to cart.
- **Search**: Search for products by name.
- **Cart**: View, update, and remove items; see cart totals and shipping fee.
- **Checkout**: Enter delivery information, Cash On Delivery and place orders.
- **Order History**: View past orders (after login).
- **Authentication**: Register and login as customer or admin; JWT-based auth.
- **Fashion Recommender**: Upload an image to get visually similar product recommendations using the ML microservice.
- **Navigation**: Responsive navbar, sidebar for mobile, and footer with company info and newsletter.
- **Policies**: Easy exchange, 7-day return, and 24/7 support.

---

## 🧑‍💼 Admin Panel Features

The admin dashboard (React + Vite) allows store managers to:

- **Login**: Secure admin login with JWT.
- **Product Management**: Add new products (with images, categories, sizes), view all products, and remove products.
- **Session Handling**: Token-based session management.

---

## 🧠 Fashion Recommender System

A deep learning-based microservice that provides similar product recommendations based on image similarity.

- **🧬 Features**:
  - Image-based product recommendations
  - Vector similarity search using MongoDB Atlas
  - RESTful API with FastAPI
  - Docker containerization
  - TensorFlow Serving for model deployment
- **Endpoints**:
  - `POST /upload-image`: Upload an image file for recommendations
  - `POST /recommendations`: Get recommendations using image URL or product ID
  - `GET /health`: Check API health status
- **Model**: Based on ResNet50V2, fine-tuned for fashion image feature extraction.

---

## 🧰 Tech Stack

- **Frontend/Admin:** React, Vite, Tailwind CSS, Axios, React Router, React Toastify
- **Backend:** Node.js, Express, MongoDB, JWT, Cloudinary
- **Recommender:** Python, FastAPI, TensorFlow, Docker, MongoDB Atlas

---
