import validator from "validator";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import userModel from "../models/userModel.js";

const createToken = (id, role) => {
    return jwt.sign({id, role}, process.env.JWT_SECRET);
}

//route for user login
const loginUser = async (req,res) => {
    try {
        const {email, password, role} = req.body;

        const user = await userModel.findOne({email});

        if(!user) {
            return res.json({success:false, message:"User doesn't exists"})
        }

        // Check if the selected role matches the user's actual role
        if(user.role !== role) {
            return res.json({success:false, message:"Invalid role for this user"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch) {
            const token = createToken(user._id, user.role)
            res.json({success:true, token, role: user.role})
        }
        else {
            res.json({success:false, message:'Invalid credentials'})
        }
    }
    catch(error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}

//Route for user register
const registerUser = async(req,res) => {
    try {
        const{name, email, password, role} = req.body;

        //checking user already exists or not
        const exists = await userModel.findOne({email});
        if(exists) {
            return res.json({success:false, message:"User already exists"})
        }

        //validating email format & strong password
        if(!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter a valid email"})
        }
        if(password.length<8) {
            return res.json({success:false, message:"Please enter a strong password"})
        }

        //hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            role: role || 'customer' // Default to customer if no role specified
        })

        const user = await newUser.save()

        const token = createToken(user._id, user.role)

        res.json({success:true, token, role: user.role})

    } catch(error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}

//route for admin login
const adminlogin = async(req,res) => {
    try {
        const{email, password} = req.body

        const user = await userModel.findOne({email, role: 'admin'});

        if(!user) {
            return res.json({success:false, message:"Admin not found"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch) {
            const token = createToken(user._id, user.role)
            res.json({success:true, token, role: user.role})
        }
        else {
            res.json({success:false, message:"Invalid credentials"})
        }
    }
    catch(error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}

export {loginUser, registerUser, adminlogin}