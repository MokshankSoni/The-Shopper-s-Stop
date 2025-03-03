import mongoose from "mongoose";

const connectDB = async ()=>{
    mongoose.connection.on('connected',()=>{
        console.log("do connected");
        
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/shoppers-stop`)
}

export default connectDB;