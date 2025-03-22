import os
import numpy as np
from numpy.linalg import norm
import requests
from io import BytesIO
from PIL import Image
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import pymongo
from typing import List, Optional, Dict, Any, Union
import json
import io
import traceback
import logging
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fashion Recommender API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = "mongodb+srv://Moksh:mongoDep2%40@cluster0.30fs0.mongodb.net"
client = pymongo.MongoClient(MONGO_URI)
db = client["shoppers-stop"]
collection = db["products"]

# TensorFlow Serving URL for REST API
TENSORFLOW_SERVING_URL = os.getenv("TF_SERVING_URL", "http://tf-serving:8501")
MODEL_NAME = "fashion_recommender"

# User agent for image requests
USER_AGENT = "Fashion-Recommender-API/1.0 (github.com/your-repo; your-email@example.com)"


class ImageUrl(BaseModel):
    url: HttpUrl


class ImageArray(BaseModel):
    instances: List[List[List[List[float]]]]  # [batch, height, width, channels]


class RecommendationRequest(BaseModel):
    image_url: Optional[HttpUrl] = None
    product_id: Optional[str] = None
    num_recommendations: int = 5


class RecommendationResponse(BaseModel):
    recommendations: List[dict]
    query_embedding: Optional[List[float]] = None


def preprocess_image(img_data):
    """Preprocess an image for the model."""
    try:
        logger.info("Starting image preprocessing")
        img = Image.open(img_data).convert("RGB")
        logger.info(f"Original image size: {img.size}")
        
        img = img.resize((224, 224))
        logger.info("Image resized to 224x224")
        
        img_array = np.array(img)
        logger.info(f"Image array shape: {img_array.shape}")
        
        # Log pixel value statistics before normalization
        logger.info(f"Pixel value range before normalization: [{np.min(img_array)}, {np.max(img_array)}]")
        logger.info(f"Pixel mean before normalization: {np.mean(img_array)}")
        
        expanded_img_array = np.expand_dims(img_array, axis=0)
        normalized_array = expanded_img_array / 255.0
        
        # Log normalized array statistics
        logger.info(f"Normalized array shape: {normalized_array.shape}")
        logger.info(f"Normalized pixel range: [{np.min(normalized_array)}, {np.max(normalized_array)}]")
        logger.info(f"Normalized pixel mean: {np.mean(normalized_array)}")
        
        return normalized_array
    except Exception as e:
        logger.error(f"Error in image preprocessing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")


def get_embedding_from_tensorflow_serving(img_array):
    """Get embedding from TensorFlow Serving."""
    try:
        logger.info("Getting embedding from TensorFlow Serving")
        serving_url = f"{TENSORFLOW_SERVING_URL}/v1/models/{MODEL_NAME}/versions/1:predict"
        
        # Ensure img_array is in the correct format
        if isinstance(img_array, np.ndarray):
            payload = {
                "instances": img_array.tolist()
            }
        else:
            payload = {
                "instances": img_array
            }
        
        logger.info(f"Sending request to TensorFlow Serving at {serving_url}")
        response = requests.post(serving_url, json=payload, timeout=10)

        if response.status_code != 200:
            logger.error(f"TensorFlow Serving error: {response.text}")
            raise HTTPException(status_code=500,
                                detail=f"TensorFlow Serving error: {response.text}")

        result = response.json()
        logger.info("Received response from TensorFlow Serving")

        # Extract the embedding from the response
        if "predictions" in result:
            embedding = np.array(result["predictions"])
            logger.info(f"Raw embedding shape: {embedding.shape}")
            
            # If the response has shape [1, features], flatten it
            if len(embedding.shape) > 1 and embedding.shape[0] == 1:
                embedding = embedding[0]
                logger.info(f"Flattened embedding shape: {embedding.shape}")
            
            # Log embedding statistics before normalization
            logger.info(f"Embedding stats before normalization - Mean: {np.mean(embedding)}, Std: {np.std(embedding)}")
            logger.info(f"Embedding range before normalization: [{np.min(embedding)}, {np.max(embedding)}]")
            
            # Normalize the embedding
            embedding = embedding / norm(embedding)
            
            # Log normalized embedding statistics
            logger.info(f"Normalized embedding stats - Mean: {np.mean(embedding)}, Std: {np.std(embedding)}")
            logger.info(f"Normalized embedding range: [{np.min(embedding)}, {np.max(embedding)}]")
            
            return embedding
        else:
            logger.error("Invalid response format from TensorFlow Serving")
            raise HTTPException(status_code=500,
                                detail="Invalid response format from TensorFlow Serving")
    except requests.exceptions.RequestException as e:
        logger.error(f"Could not connect to TensorFlow Serving: {str(e)}")
        raise HTTPException(status_code=503,
                            detail=f"Could not connect to TensorFlow Serving: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting embedding: {str(e)}")
        raise HTTPException(status_code=500,
                            detail=f"Error getting embedding: {str(e)}")


def find_similar_products(embedding, num_recommendations=5):
    """Find similar products based on embedding."""
    global embedding_list
    try:
        logger.info("Starting similar products search")
        
        # Ensure embedding is a flat list
        if isinstance(embedding, list) and len(embedding) == 1:
            embedding = embedding[0]
            logger.info("Flattened single-item embedding list")

        embedding_list = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
        logger.info(f"Embedding list length: {len(embedding_list)}")

        pipeline = [
            {
                "$search": {
                    "index": "vector_index",
                    "knnBeta": {
                        "vector": embedding_list,
                        "path": "embedding",
                        "k": num_recommendations
                    }
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "name": 1,
                    "price": 1,
                    "brand": 1,
                    "image": 1,
                    "score": {"$meta": "searchScore"}
                }
            }
        ]

        # Execute the aggregation and convert cursor to list
        results = list(collection.aggregate(pipeline))
        
        if not results:
            logger.info("No similar products found in database using primary pipeline.")
            return []
            
        # Log similarity scores
        logger.info("Similarity scores for found products:")
        for result in results:
            logger.info(f"Product {result.get('_id')}: Score {result.get('score')}")

        return results

    except Exception as e:
        logger.error(f"MongoDB aggregate error (primary pipeline): {str(e)}")
        try:
            logger.info("Attempting fallback pipeline")
            # Fallback pipeline (without filter)
            fallback_pipeline = [
                {
                    "$search": {
                        "index": "vector_index",
                        "knnBeta": {
                            "vector": embedding_list,
                            "path": "embedding",
                            "k": num_recommendations
                        }
                    }
                },
                {
                    "$project": {
                        "_id": {"$toString": "$_id"},
                        "name": 1,
                        "price": 1,
                        "brand": 1,
                        "image": 1,
                        "score": {"$meta": "searchScore"}
                    }
                }
            ]

            fallback_results = list(collection.aggregate(fallback_pipeline))

            if not fallback_results:
                logger.info("No similar products found in database using fallback pipeline.")
                return []

            # Log fallback similarity scores
            logger.info("Fallback similarity scores:")
            for result in fallback_results:
                logger.info(f"Product {result.get('_id')}: Score {result.get('score')}")

            return fallback_results

        except Exception as fallback_error:
            logger.error(f"Fallback MongoDB aggregate error: {str(fallback_error)}")
            error_msg = str(fallback_error)
            raise HTTPException(
                status_code=500,
                detail=f"Error finding similar products: {error_msg}"
            )


@app.post("/v1/models/{model_name}/versions/{version}:predict")
async def model_predict(model_name: str, version: str, file: UploadFile = File(...)):
    """Handle direct image upload and return predictions in TensorFlow Serving format."""
    try:
        # Validate model name
        if model_name != MODEL_NAME:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        # Process the uploaded image
        contents = await file.read()
        img_data = BytesIO(contents)
        img_array = preprocess_image(img_data)
        
        # Get embedding from TensorFlow Serving
        embedding = get_embedding_from_tensorflow_serving(img_array)
        
        # Find similar products
        similar_products = find_similar_products(embedding, num_recommendations=5)
        
        # Format response to match TensorFlow Serving format
        return {
            "predictions": similar_products
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get product recommendations based on image URL or product ID."""
    try:
        embedding = None

        # Case 1: Get recommendations based on image URL
        if request.image_url:
            # Add custom headers to comply with image hosts' policies
            headers = {"User-Agent": USER_AGENT}

            try:
                response = requests.get(str(request.image_url), headers=headers, timeout=10)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                raise HTTPException(status_code=400,
                                    detail=f"Error downloading image: {str(e)}")

            img_data = BytesIO(response.content)
            img_array = preprocess_image(img_data)
            embedding = get_embedding_from_tensorflow_serving(img_array)

        # Case 2: Get recommendations based on product ID
        elif request.product_id:
            try:
                product = collection.find_one({"_id": request.product_id})
                if not product:
                    raise HTTPException(status_code=404, detail="Product not found")
                if "embedding" not in product:
                    raise HTTPException(status_code=404,
                                        detail="Product has no embedding")

                embedding = np.array(product["embedding"])
            except pymongo.errors.PyMongoError as e:
                raise HTTPException(status_code=500,
                                    detail=f"Database error: {str(e)}")
        else:
            raise HTTPException(status_code=400,
                                detail="Either image_url or product_id must be provided")

        # Find similar products
        similar_products = find_similar_products(embedding, request.num_recommendations)

        return {
            "recommendations": similar_products,
            "query_embedding": embedding.tolist() if hasattr(embedding, 'tolist') else embedding
        }
    except HTTPException:
        # Re-raise existing HTTPExceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        error_traceback = traceback.format_exc()
        print(f"Error in recommendations: {str(e)}\n{error_traceback}")
        raise HTTPException(status_code=500,
                            detail=f"Error in recommendations: {str(e)}")


@app.post("/upload-image", response_model=RecommendationResponse)
async def upload_image(file: UploadFile = File(...), num_recommendations: int = 5):
    """Get recommendations from an uploaded image."""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400,
                                detail="Uploaded file is not an image")

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400,
                                detail="Empty file uploaded")

        img_data = BytesIO(contents)

        # Add specific error handling for each step
        try:
            img_array = preprocess_image(img_data)
        except Exception as img_error:
            raise HTTPException(status_code=400,
                                detail=f"Error processing image: {str(img_error)}")

        try:
            embedding = get_embedding_from_tensorflow_serving(img_array)
        except Exception as tf_error:
            raise HTTPException(status_code=500,
                                detail=f"Error getting embedding from TensorFlow: {str(tf_error)}")

        try:
            similar_products = find_similar_products(embedding, num_recommendations)
        except Exception as db_error:
            raise HTTPException(status_code=500,
                                detail=f"Error finding similar products: {str(db_error)}")

        return {
            "recommendations": similar_products,
            "query_embedding": embedding.tolist() if hasattr(embedding, 'tolist') else embedding
        }
    except HTTPException:
        # Re-raise existing HTTPExceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        error_traceback = traceback.format_exc()
        print(f"Error in upload-image: {str(e)}\n{error_traceback}")
        raise HTTPException(status_code=500,
                            detail=f"Error processing image: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8501)

