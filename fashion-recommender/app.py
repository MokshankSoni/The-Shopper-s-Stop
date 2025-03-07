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
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.layers import GlobalMaxPooling2D
from tensorflow.keras.applications.resnet50 import ResNet50

# 🔗 Connect to MongoDB Atlas
MONGO_URI = "mongodb+srv://Moksh:mongoDep2%40@cluster0.30fs0.mongodb.net"  # Replace with your MongoDB URI
client = pymongo.MongoClient(MONGO_URI)
db = client["shoppers-stop"]  # Database name
collection = db["products"]  # Collection name

# 🎯 Load Model Using TFSMLayer (TensorFlow Serving)
model_path = "fashion_recommender_model/1"  # Path to TensorFlow Serving model

if os.path.exists(model_path):
    print(f"✅ Loading model using `TFSMLayer` from {model_path}...")
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.Lambda(lambda x: tf.image.resize(x, (224, 224))),
        tf.keras.layers.Rescaling(1.0 / 255),  # Normalization
        tf.keras.layers.TFSMLayer(model_path, call_endpoint="serving_default")
    ])
else:
    print("🚀 Model not found! Creating and saving it.")

    # 1. Create the model
    base_model = ResNet50(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False
    model = tf.keras.Sequential([base_model, GlobalMaxPooling2D()])

    # 2. Important: Run inference on a dummy input to ensure all variables are initialized
    dummy_input = tf.random.normal((1, 224, 224, 3))
    _ = model(dummy_input)  # This ensures all variables (including batch norm) are created


    # 3. Create a concrete function with the model's call method
    @tf.function(input_signature=[tf.TensorSpec(shape=[None, 224, 224, 3], dtype=tf.float32)])
    def serving_fn(input_tensor):
        return {"predictions": model(input_tensor)}


    # 4. Save the model with the serving signature
    tf.saved_model.save(model, model_path, signatures={"serving_default": serving_fn})
    print(f"✅ Model saved at {model_path} with serving signature.")


# 🚀 Function to Extract Features from Image URL
def extract_features(img_path, model):
    try:
        # If img_path is a URL, fetch image data using requests
        if img_path.startswith("http"):
            response = requests.get(img_path)
            response.raise_for_status()  # Ensure we got the image successfully
            img = Image.open(BytesIO(response.content)).convert("RGB")
            img = img.resize((224, 224))
            img_array = np.array(img)
        else:
            # Otherwise, load local file
            img = image.load_img(img_path, target_size=(224, 224))
            img_array = image.img_to_array(img)

        expanded_img_array = np.expand_dims(img_array, axis=0)
        preprocessed_img = preprocess_input(expanded_img_array)

        # Check if model is using TFSMLayer (has different output format)
        if isinstance(model, tf.keras.Sequential) and any(
                isinstance(layer, tf.keras.layers.TFSMLayer) for layer in model.layers):
            result = model(preprocessed_img)
            if isinstance(result, dict) and "predictions" in result:
                result = result["predictions"].numpy().flatten()
            else:
                result = result.numpy().flatten()
        else:
            result = model(preprocessed_img).numpy().flatten()

        normalized_result = result / norm(result)  # Normalize embedding
        return normalized_result
    except Exception as e:
        print(f"Error processing {img_path}: {e}")
        return None


# 📥 Fetch Products from MongoDB
products = list(collection.find({}, {"_id": 1, "image": 1}))

# 🚀 Process Each Product & Save Embeddings
for product in tqdm(products):
    if isinstance(product["image"], list) and len(product["image"]) > 0:
        img_path = product["image"][0]  # Use the first image from the list
        embedding = extract_features(img_path, model)

        if embedding is not None:
            collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"embedding": embedding.tolist()}}
            )
            print(f"✅ Updated embedding for {product['_id']}")
    else:
        print(f"⚠️ No image found for {product['_id']}")

print("🎉 Embedding process completed!")