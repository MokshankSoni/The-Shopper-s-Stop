import axios from "axios";
import fs from 'fs';
import sharp from 'sharp';
import mongoose from 'mongoose';
import FormData from 'form-data';
import Product from '../models/productModel.js'; // Product model

export const uploadImageAndPredict = async (req, res) => {
    console.log("Entered fashion controller");
    
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imagePath = req.file.path;
        console.log(`Sending raw image to FastAPI for preprocessing : ${imagePath}`);
        
        // Update URL to match your Docker container setup
        const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/v1/models/fashion_recommender/versions/1:predict";

        //const MODEL_API_URL = process.env.MODEL_API_URL || "http://localhost:8501/v1/models/fashion_recommender/versions/1:predict";

        // Read and preprocess the image
        // Create FormData to send raw image file
        const formData = new FormData();
        formData.append("file", fs.createReadStream(imagePath));

        console.log("Sending image to FastAPI server...");

        // Step 1: Send raw image file to FastAPI model API
        const apiResponse = await axios.post(FASTAPI_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        // Check if we got a valid response with predictions
        if (!apiResponse.data || !apiResponse.data.predictions) {
            throw new Error("Invalid response from API server");
        }

        console.log(`Received ${apiResponse.data.predictions.length} recommendations from API`);
        
        console.log(apiResponse.data.predictions);
        

        // Step 2: The API now directly returns product recommendations
        // Extract product IDs from the predictions
        const recommendations = apiResponse.data.predictions;
        
        // The recommendations already contain needed product details,
        // but we might want to fetch additional details not included in the API response
        
        // Check if we need to fetch additional details from database
        // If the API response has all needed details, we can skip this step
        const enhancedRecommendations = await Promise.all(
            recommendations.map(async (product) => {
                // If response already has all needed details, just format and return
                if (product._id && product.name && product.price && product.image) {
                    return {
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
                        brand: product.brand || "",
                        score: product.score || 1.0
                    };
                }
                
                // Otherwise, fetch additional details from database
                try {
                    const productDetails = await Product.findById(product._id);
                    if (!productDetails) {
                        return {
                            _id: product._id,
                            name: product.name || "Product not found",
                            price: product.price || 0,
                            imageUrl: product.image || null,
                            score: product.score || 0
                        };
                    }
                    
                    return {
                        _id: productDetails._id,
                        name: productDetails.name,
                        price: productDetails.price,
                        imageUrl: productDetails.image && Array.isArray(productDetails.image) && 
                                  productDetails.image.length > 0 ? productDetails.image[0] : null,
                        brand: productDetails.brand || "",
                        score: product.score || 1.0
                    };
                } catch (error) {
                    console.error(`Error fetching details for product ${product._id}:`, error);
                    return {
                        _id: product._id,
                        name: product.name || "Error fetching details",
                        price: product.price || 0,
                        imageUrl: product.image || null,
                        score: product.score || 0
                    };
                }
            })
        );

        // Step 3: Return formatted recommendations to frontend
        res.json({
            message: "Recommendations retrieved successfully",
            recommendations: enhancedRecommendations.map(rec => ({
                _id: rec._id,
                name: rec.name,
                price: rec.price,
                imageUrl: rec.imageUrl,
                brand: rec.brand || "",
                score: typeof rec.score === 'number' ? rec.score.toFixed(4) : rec.score
            }))
        });
        
    } catch (error) {
        console.error("Error processing image:", error);
        
        // Log detailed error information
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
        }
        
        res.status(500).json({ 
            message: "Server error", 
            error: error.response ? error.response.data : error.message 
        });
    } finally {
        // Clean up the uploaded file
        try {
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log(`Deleted temporary file: ${req.file.path}`);
            }
        } catch (unlinkError) {
            console.error("Error deleting temporary file:", unlinkError);
        }
    }
};

// Add a direct API endpoint handler that doesn't require file upload
export const getRecommendationsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }
        
        // API URL for recommendations by product ID
        const API_URL = process.env.API_URL || "http://localhost:8501/recommendations";
        
        // Request recommendations by product ID
        const apiResponse = await axios.post(API_URL, {
            product_id: productId,
            num_recommendations: 5
        });
        
        if (!apiResponse.data || !apiResponse.data.recommendations) {
            throw new Error("Invalid response from API server");
        }
        
        // Format recommendations for frontend
        const recommendations = apiResponse.data.recommendations.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
            brand: product.brand || "",
            score: typeof product.score === 'number' ? product.score.toFixed(4) : product.score
        }));
        
        res.json({
            message: "Recommendations retrieved successfully",
            recommendations
        });
        
    } catch (error) {
        console.error("Error getting recommendations by product ID:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.response ? error.response.data : error.message 
        });
    }
};

// Add an endpoint for image URL-based recommendations
export const getRecommendationsByImageUrl = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ message: "Image URL is required" });
        }
        
        // API URL for recommendations by image URL
        const API_URL = process.env.API_URL || "http://localhost:8501/recommendations";
        
        // Request recommendations by image URL
        const apiResponse = await axios.post(API_URL, {
            image_url: imageUrl,
            num_recommendations: 5
        });
        
        if (!apiResponse.data || !apiResponse.data.recommendations) {
            throw new Error("Invalid response from API server");
        }
        
        // Format recommendations for frontend
        const recommendations = apiResponse.data.recommendations.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
            brand: product.brand || "",
            score: typeof product.score === 'number' ? product.score.toFixed(4) : product.score
        }));
        
        res.json({
            message: "Recommendations retrieved successfully",
            recommendations
        });
        
    } catch (error) {
        console.error("Error getting recommendations by image URL:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.response ? error.response.data : error.message 
        });
    }
};




// import axios from "axios";
// import fs from 'fs';
// import sharp from 'sharp';
// import mongoose from 'mongoose';
// import Product from '../models/productModel.js'; // Assuming you have a Product model

// // Function to calculate cosine similarity between two vectors
// const calculateCosineSimilarity = (vectorA, vectorB) => {
//     if (vectorA.length !== vectorB.length) {
//         throw new Error('Vectors must have the same length');
//     }
    
//     let dotProduct = 0;
//     let normA = 0;
//     let normB = 0;
    
//     for (let i = 0; i < vectorA.length; i++) {
//         dotProduct += vectorA[i] * vectorB[i];
//         normA += vectorA[i] * vectorA[i];
//         normB += vectorB[i] * vectorB[i];
//     }
    
//     normA = Math.sqrt(normA);
//     normB = Math.sqrt(normB);
    
//     if (normA === 0 || normB === 0) {
//         return 0;
//     }
    
//     return dotProduct / (normA * normB);
// };

// export const uploadImageAndPredict = async (req, res) => {
//     console.log("entered fashion controller");
    
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: "No file uploaded" });
//         }

//         const imagePath = req.file.path;
//         console.log(`Processing uploaded image: ${imagePath}`);
        
//         const MODEL_API_URL = "http://localhost:8501/v1/models/fashion_recommender/versions/1:predict";

//         // Read the image file and process it correctly for the model
//         const imageBuffer = await sharp(imagePath)
//             .resize(224, 224)  // Resize to 224x224
//             .raw()             // Get raw pixel data
//             .toBuffer();
        
//         // Convert buffer to 3D array [224][224][3] and normalize
//         const width = 224;
//         const height = 224;
//         const channels = 3;
        
//         // Create properly shaped 3D array
//         const imageArray = [];
//         for (let y = 0; y < height; y++) {
//             const row = [];
//             for (let x = 0; x < width; x++) {
//                 const pixel = [];
//                 for (let c = 0; c < channels; c++) {
//                     const idx = (y * width + x) * channels + c;
//                     pixel.push(imageBuffer[idx] / 255.0);
//                 }
//                 row.push(pixel);
//             }
//             imageArray.push(row);
//         }
        
//         console.log("Sending image to TensorFlow Serving for embedding generation");
        
//         // Create payload for TensorFlow Serving
//         const payload = {
//             instances: [imageArray]
//         };

//         // Step 1: Get embedding vector from TensorFlow Serving
//         const tfResponse = await axios.post(MODEL_API_URL, payload, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         //console.log("Raw response from TensorFlow Serving:", JSON.stringify(tfResponse.data, null, 2));

//         //console.log("response data just after processing -- ",tfResponse);
//         //console.log("Received response from TensorFlow Serving");
//         //console.log("Raw response from TensorFlow Serving:", JSON.stringify(tfResponse.data, null, 2));


//         // Extract the embedding vector from the response
//         if (!tfResponse.data || !tfResponse.data.predictions || !tfResponse.data.predictions[0]) {
//             throw new Error("Invalid response from TensorFlow Serving");
//         }

//         console.log(`Number of embeddings returned: ${tfResponse.data.predictions.length}`);

//         const queryEmbedding = tfResponse.data.predictions[0];
//         console.log(`Generated embedding vector of length: ${queryEmbedding.length}`);
        
//         // Step 2: Retrieve stored embeddings from MongoDB Atlas
//         console.log("Retrieving product embeddings from database");
//         const products = await Product.find(
//             { embedding: { $exists: true } }, 
//             { 
//                 _id: 1, 
//                 name: 1, 
//                 brand: 1, 
//                 price: 1, 
//                 image: 1,  // Array of image URLs
//                 embedding: 1 
//             }
//         );

//         console.log("---------------------------------------------------");
        
//         products.slice(0, 5).forEach((product, index) => {
//             if (!product.embedding || !Array.isArray(product.embedding) || product.embedding.length === 0) {
//                 console.log(`Product ${index + 1}: No valid embedding found`);
//             } else {
//                 console.log(`Product ${index + 1}: ${product.embedding.slice(0, 5)}`);
//             }
//         });

        
//         if (!products || products.length === 0) {
//             return res.status(404).json({ 
//                 message: "No products with embeddings found in the database" 
//             });
//         }
        
//         // Filter out products with invalid embeddings
//         // const validProducts = products.filter(product => 
//         //     product.embedding && Array.isArray(product.embedding) && product.embedding.length > 0
//         // );

//         console.log(`Found ${products.length} products with embeddings`);
        
//         // Step 3 & 4: Calculate similarity scores and find top 5 similar products
//         let productsWithSimilarity = []; 

//         productsWithSimilarity = products.map(product => {
            
//             // if (!product.embedding || !Array.isArray(product.embedding) || !Array.isArray(queryEmbedding)) {
//             //     return {
//             //         _id: product._id,
//             //         name: product.name,
//             //         brand: product.brand,
//             //         price: product.price,
//             //         imageUrl: product.image && Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : null,
//             //         score: 0  // Default score for invalid embeddings
//             //     };
//             // }
            
//             const similarity = calculateCosineSimilarity(queryEmbedding, product.embedding);
            
//             // Get the first image URL from the image array
//             let imageUrl = null;
//             if (product.image && Array.isArray(product.image) && product.image.length > 0) {
//                 imageUrl = product.image[0];
//             }
            
//             return {
//                 _id: product._id,
//                 name: product.name,
//                 brand: product.brand,
//                 price: product.price,
//                 imageUrl: imageUrl,  // The first image from the array
//                 score: similarity
//             };
//         });
        
//         // Sort by similarity score (descending) and take top 5
//         const topRecommendations = productsWithSimilarity
//             .sort((a, b) => b.score - a.score)
//             .slice(0, 5);
        
//         console.log(`Top recommendation score: ${topRecommendations[0]?.score}`);
        
//         // Step 5: Return results to frontend
//         res.json({
//             message: "Recommendations retrieved successfully",
//             recommendations: topRecommendations.map(rec => ({
//                 _id: rec._id,
//                 name: rec.name,
//                 price: rec.price,
//                 imageUrl: rec.imageUrl,  // First image from the array
//                 score: rec.score.toFixed(4)
//             }))
//         });
        
//     } catch (error) {
//         console.error("Error processing image:", error);
        
//         // Log detailed error information
//         if (error.response) {
//             console.error("Response data:", error.response.data);
//             console.error("Response status:", error.response.status);
//             console.error("Response headers:", error.response.headers);
//         }
        
//         res.status(500).json({ 
//             message: "Server error", 
//             error: error.response ? error.response.data : error.message 
//         });
//     } finally {
//         // Clean up the uploaded file
//         try {
//             if (fs.existsSync(req.file?.path)) {
//                 fs.unlinkSync(req.file.path);
//                 console.log(`Deleted temporary file: ${req.file.path}`);
//             }
//         } catch (unlinkError) {
//             console.error("Error deleting temporary file:", unlinkError);
//         }
//     }
// };