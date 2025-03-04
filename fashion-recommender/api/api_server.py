import os
import numpy as np
from numpy.linalg import norm
import requests
from io import BytesIO
from PIL import Image
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import pymongo
from typing import List, Optional
import json
import io
import traceback
import logging
from fastapi import HTTPException

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
        img = Image.open(img_data).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img)
        expanded_img_array = np.expand_dims(img_array, axis=0)
        return expanded_img_array / 255.0  # Normalize to [0,1]
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")


def get_embedding_from_tensorflow_serving(img_array):
    """Get embedding from TensorFlow Serving."""
    try:
        serving_url = f"{TENSORFLOW_SERVING_URL}/v1/models/{MODEL_NAME}:predict"
        payload = {
            "instances": img_array.tolist()
        }
        response = requests.post(serving_url, json=payload, timeout=10)

        if response.status_code != 200:
            raise HTTPException(status_code=500,
                                detail=f"TensorFlow Serving error: {response.text}")

        result = response.json()

        # Extract the embedding from the response
        if "predictions" in result:
            embedding = np.array(result["predictions"])
            # If the response has shape [1, features], flatten it
            if len(embedding.shape) > 1 and embedding.shape[0] == 1:
                embedding = embedding[0]
            # Normalize the embedding
            embedding = embedding / norm(embedding)
            return embedding
        else:
            raise HTTPException(status_code=500,
                                detail="Invalid response format from TensorFlow Serving")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503,
                            detail=f"Could not connect to TensorFlow Serving: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"Error getting embedding: {str(e)}")


import logging
from fastapi import HTTPException

def find_similar_products(embedding, num_recommendations=5):
    """Find similar products based on embedding."""
    global embedding_list
    try:
        # Ensure embedding is a list for MongoDB
        embedding_list = embedding.tolist() if hasattr(embedding, 'tolist') else embedding

        pipeline = [
            {
                "$search": {
                    "index": "vector_index",
                    "knnBeta": {
                        "vector": embedding_list,
                        "path": "embedding",
                        "k": num_recommendations
                        # Removed the empty filter object
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

        # If no results found, return empty list instead of error
        if not results:
            logging.info("No similar products found in database using primary pipeline.")
            return []

        return results

    except Exception as e:
        logging.error(f"MongoDB aggregate error (primary pipeline): {str(e)}")
        try:
            # Fallback pipeline (without filter)
            fallback_pipeline = [
                {
                    "$search": {
                        "index": "vector_index",
                        "knnBeta": {
                            "vector": embedding_list,
                            "path": "embedding",
                            "k": num_recommendations
                            # Removed the empty filter object here too
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
                logging.info("No similar products found in database using fallback pipeline.")
                return []

            return fallback_results

        except Exception as fallback_error:
            logging.error(f"Fallback MongoDB aggregate error: {str(fallback_error)}")
            # Return detailed error information
            error_msg = str(fallback_error)
            raise HTTPException(
                status_code=500,
                detail=f"Error finding similar products: {error_msg}"
            )


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

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get product recommendations based on image URL or product ID."""
    try:
        embedding = None

        # Case 1: Get recommendations based on image URL
        if request.image_url:
            response = requests.get(str(request.image_url))
            response.raise_for_status()
            img_data = BytesIO(response.content)
            img_array = preprocess_image(img_data)
            embedding = get_embedding_from_tensorflow_serving(img_array)

        # Case 2: Get recommendations based on product ID
        elif request.product_id:
            product = collection.find_one({"_id": request.product_id})
            if not product or "embedding" not in product:
                raise HTTPException(status_code=404, detail="Product not found or product has no embedding")
            embedding = np.array(product["embedding"])

        else:
            raise HTTPException(status_code=400, detail="Either image_url or product_id must be provided")

        # Find similar products
        similar_products = find_similar_products(embedding, request.num_recommendations)

        return {
            "recommendations": similar_products,
            "query_embedding": embedding.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in recommendations: {str(e)}")


@app.post("/upload-image", response_model=RecommendationResponse)
async def upload_image(file: UploadFile = File(...), num_recommendations: int = 5):
    """Get recommendations from an uploaded image."""
    try:
        contents = await file.read()
        img_data = BytesIO(contents)
        img_array = preprocess_image(img_data)
        embedding = get_embedding_from_tensorflow_serving(img_array)

        # Find similar products
        similar_products = find_similar_products(embedding, num_recommendations)

        return {
            "recommendations": similar_products,
            "query_embedding": embedding.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8501)

