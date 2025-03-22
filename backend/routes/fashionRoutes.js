import express from "express";
import multer from "multer";
import {uploadImageAndPredict}  from "../controllers/fashionController.js";

const fashionRoutes = express.Router();
const upload = multer({ dest: "uploads/" });

fashionRoutes.post("/uploadImageAndPredict", upload.single("image"), uploadImageAndPredict);

export default fashionRoutes;
