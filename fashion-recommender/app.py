import tensorflow as tf
import numpy as np
from numpy.linalg import norm
import os
import pymongo
from tqdm import tqdm
import requests
from io import BytesIO
from PIL import Image
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import ResNet50V2
from tensorflow.keras.applications.resnet_v2 import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔗 Connect to MongoDB Atlas
MONGO_URI = "mongodb+srv://Moksh:mongoDep2%40@cluster0.30fs0.mongodb.net"
client = pymongo.MongoClient(MONGO_URI)
db = client["shoppers-stop"]
collection = db["products"]

# 🎯 Model Configuration
IMG_SIZE = 224
EMBEDDING_SIZE = 2048  # Updated to match MongoDB index dimensions
model_path = "fashion_recommender_model/1"

def create_model():
    """Create an improved model for fashion feature extraction"""
    # Use ResNet50V2 as base model (better performance than ResNet50)
    base_model = ResNet50V2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Create improved model architecture
    model = tf.keras.Sequential([
        base_model,
        GlobalAveragePooling2D(),  # Better than MaxPooling for fashion features
        BatchNormalization(),  # Add batch normalization for better feature distribution
        Dense(2048, activation='relu'),  # Updated to match embedding size
        Dropout(0.5),  # Add dropout for regularization
        BatchNormalization(),
        Dense(EMBEDDING_SIZE, activation=None),  # Final embedding layer
        tf.keras.layers.Lambda(lambda x: tf.math.l2_normalize(x, axis=1))  # L2 normalization
    ])
    
    return model

if os.path.exists(model_path):
    logger.info(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)
else:
    logger.info("Creating new model...")
    model = create_model()
    
    # Create serving function
    @tf.function(input_signature=[tf.TensorSpec(shape=[None, IMG_SIZE, IMG_SIZE, 3], dtype=tf.float32)])
    def serving_fn(input_tensor):
        return {"predictions": model(input_tensor)}
    
    # Save model
    tf.saved_model.save(model, model_path, signatures={"serving_default": serving_fn})
    logger.info(f"Model saved at {model_path}")

def preprocess_image(img_path):
    """Enhanced image preprocessing for fashion items"""
    try:
        # Load and convert image
        if img_path.startswith("http"):
            response = requests.get(img_path)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content)).convert("RGB")
        else:
            img = Image.open(img_path).convert("RGB")
        
        # Resize with better quality
        img = img.resize((IMG_SIZE, IMG_SIZE), Image.Resampling.LANCZOS)
        
        # Convert to array
        img_array = image.img_to_array(img)
        
        # Expand dimensions
        expanded_img_array = np.expand_dims(img_array, axis=0)
        
        # Preprocess using ResNetV2 preprocessing
        preprocessed_img = preprocess_input(expanded_img_array)
        
        return preprocessed_img
    except Exception as e:
        logger.error(f"Error preprocessing image {img_path}: {e}")
        return None

def extract_features(img_path, model):
    """Extract fashion-specific features from image"""
    try:
        # Preprocess image
        preprocessed_img = preprocess_image(img_path)
        if preprocessed_img is None:
            return None
            
        # Get embedding
        embedding = model.predict(preprocessed_img)
        
        # Embedding is already L2 normalized by the model
        return embedding.flatten()
    except Exception as e:
        logger.error(f"Error extracting features from {img_path}: {e}")
        return None

# Process products and update embeddings
logger.info("Starting to process products...")
products = list(collection.find({}, {"_id": 1, "image": 1}))

for product in tqdm(products):
    if isinstance(product["image"], list) and len(product["image"]) > 0:
        img_path = product["image"][0]
        embedding = extract_features(img_path, model)
        
        if embedding is not None:
            # Update embedding in database
            collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"embedding": embedding.tolist()}}
            )
            logger.info(f"Updated embedding for product {product['_id']}")
    else:
        logger.warning(f"No image found for product {product['_id']}")

logger.info("Embedding process completed!")


