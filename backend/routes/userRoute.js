import express from 'express';
import { loginUser, registerUser } from '../controllers/userController.js';
import { verifyToken, isAdmin, isCustomer } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

// Protected routes
userRouter.get('/profile', verifyToken, (req, res) => {
    res.json({ user: req.user });
});

// Admin only routes
userRouter.get('/admin/dashboard', verifyToken, isAdmin, (req, res) => {
    res.json({ message: 'Admin dashboard access granted' });
});

// Customer only routes
userRouter.get('/customer/dashboard', verifyToken, isCustomer, (req, res) => {
    res.json({ message: 'Customer dashboard access granted' });
});

export default userRouter;