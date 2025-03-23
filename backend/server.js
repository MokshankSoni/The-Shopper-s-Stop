import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import connectCloudinary from './config/cloudinary.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import fashionRoutes from './routes/fashionRoutes.js'
import { verifyToken } from './middleware/authMiddleware.js'
import { listProducts } from './controllers/productController.js'

//App config
const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

//middlewares
app.use(express.json())
app.use(cors())

// Public routes
app.use('/api/user', userRouter)
app.get('/api/product/list', listProducts)

// Protected routes - require authentication
app.use('/api/product', verifyToken, productRouter);
app.use('/api/cart', verifyToken, cartRouter)
app.use('/api/order', verifyToken, orderRouter)
app.use("/api/fashion", verifyToken, fashionRoutes);

app.get('/',(req,res)=>{
    res.send('API working')
})

app.listen(port,()=>console.log('server started on PORT : '+ port))  