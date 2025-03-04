import requests
import json
import base64
from PIL import Image
import io
import matplotlib.pyplot as plt
import numpy as np
import os
from urllib.parse import urlparse
import time

# Configuration
TF_SERVING_URL = "http://localhost:8501"  # TensorFlow Serving URL
API_URL = "http://localhost:8000"  # API Server URL

# Use a direct image URL instead of a Google redirect
TEST_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/800px-Cat03.jpg"
TEST_IMAGE_PATH = "test_image.jpg"  # Local path to save test image

# Directory for local test images
LOCAL_IMAGE_DIR = "./"  # Change this to your local image directory
USE_LOCAL_IMAGES = True  # Set to True to use local images instead of downloading


def find_local_image():
    """Find the first jpg/jpeg/png image in the local directory"""
    if not os.path.exists(LOCAL_IMAGE_DIR):
        print(f"❌ Local image directory {LOCAL_IMAGE_DIR} does not exist")
        return None

    for file in os.listdir(LOCAL_IMAGE_DIR):
        lower_file = file.lower()
        if lower_file.endswith('.jpg') or lower_file.endswith('.jpeg') or lower_file.endswith('.png'):
            image_path = os.path.join(LOCAL_IMAGE_DIR, file)
            print(f"✅ Found local image: {image_path}")
            return image_path

    print(f"❌ No jpg/jpeg/png images found in {LOCAL_IMAGE_DIR}")
    return None


def download_test_image(url, save_path):
    """Download a test image from URL"""
    try:
        print(f"🌐 Downloading test image from {url}...")
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Verify we got an image before saving
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                print(f"❌ URL did not return an image (Content-Type: {content_type})")
                return False

            with open(save_path, 'wb') as f:
                f.write(response.content)

            # Verify the saved file is a valid image
            try:
                with Image.open(save_path) as img:
                    # Just opening it is enough to validate
                    width, height = img.size
                    print(f"✅ Valid image downloaded (size: {width}x{height})")
                print(f"✅ Test image saved to {save_path}")
                return True
            except Exception as e:
                print(f"❌ Downloaded file is not a valid image: {e}")
                # Remove the invalid file
                if os.path.exists(save_path):
                    os.remove(save_path)
                return False
        else:
            print(f"❌ Failed to download image: {response.status_code}")
            print(f"Response: {response.text[:200]}")  # Show first 200 chars of response
            return False
    except Exception as e:
        print(f"❌ Error downloading image: {e}")
        return False


def test_tf_serving_health():
    """Test TensorFlow Serving health"""
    print("\n🔍 Testing TensorFlow Serving health...")
    try:
        url = f"{TF_SERVING_URL}/v1/models/fashion_recommender"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            model_info = response.json()
            print(f"✅ TensorFlow Serving is healthy!")
            print(f"📊 Model info: {json.dumps(model_info, indent=2)}")
            return True
        else:
            print(f"❌ TensorFlow Serving returned status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to TensorFlow Serving: {e}")
        return False


def test_api_health():
    """Test API health endpoint"""
    print("\n🔍 Testing API health...")
    try:
        url = f"{API_URL}/health"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            health_info = response.json()
            print(f"✅ API is healthy! Status: {health_info.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to API: {e}")
        return False


def test_direct_inference(image_path):
    """Test inference directly through TensorFlow Serving"""
    print("\n🔍 Testing direct inference through TensorFlow Serving...")
    try:
        # Load and preprocess image
        img = Image.open(image_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0  # Normalize to [0,1]

        # Create payload for TensorFlow Serving
        payload = {
            "instances": [img_array.tolist()]
        }

        # Send request to TensorFlow Serving
        url = f"{TF_SERVING_URL}/v1/models/fashion_recommender:predict"
        start_time = time.time()
        response = requests.post(url, json=payload)
        inference_time = time.time() - start_time

        if response.status_code == 200:
            result = response.json()

            # Check if we have predictions
            if "predictions" not in result or not result["predictions"]:
                print(f"❌ No predictions found in response: {result}")
                return False

            embedding = result.get("predictions", [])[0]
            embedding_size = len(embedding)

            print(f"✅ Direct inference successful!")
            print(f"⏱️ Inference time: {inference_time:.3f} seconds")
            print(f"📊 Embedding size: {embedding_size}")
            print(f"📊 First 5 values of embedding: {embedding[:5]}")
            return True
        else:
            print(f"❌ TensorFlow Serving inference failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during direct inference: {e}")
        return False


def test_api_url_recommendations():
    """Test recommendations API with image URL"""
    print("\n🔍 Testing API recommendations with image URL...")
    try:
        # Create payload for API
        payload = {
            "image_url": TEST_IMAGE_URL,
            "num_recommendations": 5
        }

        # Send request to API
        url = f"{API_URL}/recommendations"
        start_time = time.time()
        response = requests.post(url, json=payload)
        api_time = time.time() - start_time

        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            query_embedding = result.get("query_embedding", [])

            print(f"✅ API recommendations successful!")
            print(f"⏱️ API response time: {api_time:.3f} seconds")
            print(f"📊 Query embedding size: {len(query_embedding)}")
            print(f"🛍️ Found {len(recommendations)} similar products")

            # Display some information about the recommendations
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"\n🛍️ Recommendation {i}:")
                print(f"   Product ID: {rec.get('_id', 'Unknown')}")
                print(f"   Name: {rec.get('name', 'Unknown')}")
                print(f"   Brand: {rec.get('brand', 'Unknown')}")
                print(f"   Price: {rec.get('price', 'Unknown')}")
                print(f"   Similarity Score: {rec.get('score', 'Unknown')}")

            return True
        else:
            print(f"❌ API recommendations failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during API recommendations: {e}")
        return False


def test_api_upload_image(image_path):
    """Test image upload API"""
    print("\n🔍 Testing API with image upload...")
    try:
        # Prepare the image file for upload
        with open(image_path, 'rb') as img_file:
            # First verify it's a valid image
            try:
                img = Image.open(img_file)
                img_file.seek(0)  # Reset file pointer after reading
            except Exception as e:
                print(f"❌ Invalid image file: {e}")
                return False

            files = {'file': (os.path.basename(image_path), img_file, 'image/jpeg')}
            payload = {'num_recommendations': 5}

            # Send request to API
            url = f"{API_URL}/upload-image"
            start_time = time.time()
            response = requests.post(url, files=files, data=payload)
            api_time = time.time() - start_time

            if response.status_code == 200:
                result = response.json()
                recommendations = result.get("recommendations", [])

                print(f"✅ API image upload successful!")
                print(f"⏱️ API response time: {api_time:.3f} seconds")
                print(f"🛍️ Found {len(recommendations)} similar products")

                # Display some information about the recommendations
                for i, rec in enumerate(recommendations[:3], 1):
                    print(f"\n🛍️ Recommendation {i}:")
                    print(f"   Product ID: {rec.get('_id', 'Unknown')}")
                    print(f"   Name: {rec.get('name', 'Unknown')}")
                    print(f"   Price: {rec.get('price', 'Unknown')}")

                return True
            else:
                print(f"❌ API image upload failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
    except Exception as e:
        print(f"❌ Error during API image upload: {e}")
        return False


def visualize_test_image(image_path):
    """Display the test image"""
    try:
        img = Image.open(image_path)
        plt.figure(figsize=(6, 6))
        plt.imshow(img)
        plt.title("Test Image")
        plt.axis('off')
        plt.show()
        print("✅ Test image displayed!")
    except Exception as e:
        print(f"❌ Error displaying image: {e}")


def run_all_tests():
    """Run all tests in sequence"""
    print("🚀 Starting Fashion Recommender Testing Suite")
    print("============================================")

    # Get image path (either local or downloaded)
    image_path = None

    # Try to use local image if specified
    if USE_LOCAL_IMAGES:
        image_path = find_local_image()

    # If no local image found or not using local images, try to download
    if image_path is None:
        if os.path.exists(TEST_IMAGE_PATH):
            # Check if existing file is a valid image
            try:
                with Image.open(TEST_IMAGE_PATH) as img:
                    image_path = TEST_IMAGE_PATH
                    print(f"✅ Using existing test image: {TEST_IMAGE_PATH}")
            except:
                print(f"❌ Existing test image is invalid, redownloading...")
                os.remove(TEST_IMAGE_PATH)

        if image_path is None:
            # Need to download the image
            if download_test_image(TEST_IMAGE_URL, TEST_IMAGE_PATH):
                image_path = TEST_IMAGE_PATH

    # If we still don't have a valid image, we can't proceed with some tests
    if image_path is None:
        print(f"❌ No valid test image available. Some tests will be skipped.")
    else:
        print(f"✅ Using test image: {image_path}")

    # Run tests
    tests = [
        ("TensorFlow Serving Health", test_tf_serving_health),
        ("API Health", test_api_health)
    ]

    # Add image-dependent tests only if we have a valid image
    if image_path is not None:
        tests.extend([
            ("Direct TensorFlow Serving Inference", lambda: test_direct_inference(image_path)),
            ("API URL Recommendations", test_api_url_recommendations),
            ("API Image Upload", lambda: test_api_upload_image(image_path))
        ])

    results = {}
    for name, test_func in tests:
        print(f"\n{'=' * 50}")
        print(f"Running Test: {name}")
        print(f"{'=' * 50}")
        try:
            success = test_func()
            results[name] = "✅ PASSED" if success else "❌ FAILED"
        except Exception as e:
            print(f"❌ Exception during test: {e}")
            results[name] = "❌ ERROR"

    # Print summary
    print(f"\n{'=' * 50}")
    print("TEST SUMMARY")
    print(f"{'=' * 50}")
    for name, result in results.items():
        print(f"{result} - {name}")

    # Display test image
    if image_path is not None:
        visualize_test_image(image_path)


if __name__ == "__main__":
    run_all_tests()



# import requests
# import json
# import base64
# from PIL import Image
# import io
# import matplotlib.pyplot as plt
# import numpy as np
# import os
# from urllib.parse import urlparse
# import time
#
# # Configuration
# TF_SERVING_URL = "http://localhost:8501"  # TensorFlow Serving URL
# API_URL = "http://localhost:8000"  # API Server URL
# TEST_IMAGE_URL = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Ffree-photos-vectors%2Fcasual-shirt-png&psig=AOvVaw2OsapvNyMLlnDog5rPhEfE&ust=1740890867439000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCKD0pYCK6IsDFQAAAAAdAAAAABAE"
# TEST_IMAGE_PATH = "test_image.jpg"  # Local path to save test image
#
#
# def download_test_image(url, save_path):
#     """Download a test image from URL"""
#     print(f"🌐 Downloading test image from {url}...")
#     response = requests.get(url)
#     if response.status_code == 200:
#         with open(save_path, 'wb') as f:
#             f.write(response.content)
#         print(f"✅ Test image saved to {save_path}")
#         return True
#     else:
#         print(f"❌ Failed to download image: {response.status_code}")
#         return False
#
#
# def test_tf_serving_health():
#     """Test TensorFlow Serving health"""
#     print("\n🔍 Testing TensorFlow Serving health...")
#     try:
#         url = f"{TF_SERVING_URL}/v1/models/fashion_recommender"
#         response = requests.get(url, timeout=10)
#         if response.status_code == 200:
#             model_info = response.json()
#             print(f"✅ TensorFlow Serving is healthy!")
#             print(f"📊 Model info: {json.dumps(model_info, indent=2)}")
#             return True
#         else:
#             print(f"❌ TensorFlow Serving returned status code: {response.status_code}")
#             print(f"Response: {response.text}")
#             return False
#     except requests.exceptions.RequestException as e:
#         print(f"❌ Error connecting to TensorFlow Serving: {e}")
#         return False
#
#
# def test_api_health():
#     """Test API health endpoint"""
#     print("\n🔍 Testing API health...")
#     try:
#         url = f"{API_URL}/health"
#         response = requests.get(url, timeout=10)
#         if response.status_code == 200:
#             health_info = response.json()
#             print(f"✅ API is healthy! Status: {health_info.get('status', 'unknown')}")
#             return True
#         else:
#             print(f"❌ API returned status code: {response.status_code}")
#             print(f"Response: {response.text}")
#             return False
#     except requests.exceptions.RequestException as e:
#         print(f"❌ Error connecting to API: {e}")
#         return False
#
#
# def test_direct_inference(image_path):
#     """Test inference directly through TensorFlow Serving"""
#     print("\n🔍 Testing direct inference through TensorFlow Serving...")
#     try:
#         # Load and preprocess image
#         img = Image.open(image_path).convert("RGB")
#         img = img.resize((224, 224))
#         img_array = np.array(img) / 255.0  # Normalize to [0,1]
#
#         # Create payload for TensorFlow Serving
#         payload = {
#             "instances": [img_array.tolist()]
#         }
#
#         # Send request to TensorFlow Serving
#         url = f"{TF_SERVING_URL}/v1/models/fashion_recommender:predict"
#         start_time = time.time()
#         response = requests.post(url, json=payload)
#         inference_time = time.time() - start_time
#
#         if response.status_code == 200:
#             result = response.json()
#             embedding = result.get("predictions", [])[0]
#             embedding_size = len(embedding)
#
#             print(f"✅ Direct inference successful!")
#             print(f"⏱️ Inference time: {inference_time:.3f} seconds")
#             print(f"📊 Embedding size: {embedding_size}")
#             print(f"📊 First 5 values of embedding: {embedding[:5]}")
#             return True
#         else:
#             print(f"❌ TensorFlow Serving inference failed: {response.status_code}")
#             print(f"Response: {response.text}")
#             return False
#     except Exception as e:
#         print(f"❌ Error during direct inference: {e}")
#         return False
#
#
# def test_api_url_recommendations():
#     """Test recommendations API with image URL"""
#     print("\n🔍 Testing API recommendations with image URL...")
#     try:
#         # Create payload for API
#         payload = {
#             "image_url": TEST_IMAGE_URL,
#             "num_recommendations": 5
#         }
#
#         # Send request to API
#         url = f"{API_URL}/recommendations"
#         start_time = time.time()
#         response = requests.post(url, json=payload)
#         api_time = time.time() - start_time
#
#         if response.status_code == 200:
#             result = response.json()
#             recommendations = result.get("recommendations", [])
#             query_embedding = result.get("query_embedding", [])
#
#             print(f"✅ API recommendations successful!")
#             print(f"⏱️ API response time: {api_time:.3f} seconds")
#             print(f"📊 Query embedding size: {len(query_embedding)}")
#             print(f"🛍️ Found {len(recommendations)} similar products")
#
#             # Display some information about the recommendations
#             for i, rec in enumerate(recommendations[:3], 1):
#                 print(f"\n🛍️ Recommendation {i}:")
#                 print(f"   Product ID: {rec.get('_id', 'Unknown')}")
#                 print(f"   Name: {rec.get('name', 'Unknown')}")
#                 print(f"   Brand: {rec.get('brand', 'Unknown')}")
#                 print(f"   Price: {rec.get('price', 'Unknown')}")
#                 print(f"   Similarity Score: {rec.get('score', 'Unknown')}")
#
#             return True
#         else:
#             print(f"❌ API recommendations failed: {response.status_code}")
#             print(f"Response: {response.text}")
#             return False
#     except Exception as e:
#         print(f"❌ Error during API recommendations: {e}")
#         return False
#
#
# def test_api_upload_image(image_path):
#     """Test image upload API"""
#     print("\n🔍 Testing API with image upload...")
#     try:
#         # Prepare the image file for upload
#         with open(image_path, 'rb') as img_file:
#             files = {'file': (os.path.basename(image_path), img_file, 'image/jpeg')}
#             payload = {'num_recommendations': 5}
#
#             # Send request to API
#             url = f"{API_URL}/upload-image"
#             start_time = time.time()
#             response = requests.post(url, files=files, data=payload)
#             api_time = time.time() - start_time
#
#             if response.status_code == 200:
#                 result = response.json()
#                 recommendations = result.get("recommendations", [])
#
#                 print(f"✅ API image upload successful!")
#                 print(f"⏱️ API response time: {api_time:.3f} seconds")
#                 print(f"🛍️ Found {len(recommendations)} similar products")
#
#                 # Display some information about the recommendations
#                 for i, rec in enumerate(recommendations[:3], 1):
#                     print(f"\n🛍️ Recommendation {i}:")
#                     print(f"   Product ID: {rec.get('_id', 'Unknown')}")
#                     print(f"   Name: {rec.get('name', 'Unknown')}")
#                     print(f"   Price: {rec.get('price', 'Unknown')}")
#
#                 return True
#             else:
#                 print(f"❌ API image upload failed: {response.status_code}")
#                 print(f"Response: {response.text}")
#                 return False
#     except Exception as e:
#         print(f"❌ Error during API image upload: {e}")
#         return False
#
#
# def visualize_test_image(image_path):
#     """Display the test image"""
#     try:
#         img = Image.open(image_path)
#         plt.figure(figsize=(6, 6))
#         plt.imshow(img)
#         plt.title("Test Image")
#         plt.axis('off')
#         plt.show()
#         print("✅ Test image displayed!")
#     except Exception as e:
#         print(f"❌ Error displaying image: {e}")
#
#
# def run_all_tests():
#     """Run all tests in sequence"""
#     print("🚀 Starting Fashion Recommender Testing Suite")
#     print("============================================")
#
#     # Download test image
#     if not os.path.exists(TEST_IMAGE_PATH):
#         download_test_image(TEST_IMAGE_URL, TEST_IMAGE_PATH)
#
#     # Run tests
#     tests = [
#         ("TensorFlow Serving Health", test_tf_serving_health),
#         ("API Health", test_api_health),
#         ("Direct TensorFlow Serving Inference", lambda: test_direct_inference(TEST_IMAGE_PATH)),
#         ("API URL Recommendations", test_api_url_recommendations),
#         ("API Image Upload", lambda: test_api_upload_image(TEST_IMAGE_PATH))
#     ]
#
#     results = {}
#     for name, test_func in tests:
#         print(f"\n{'=' * 50}")
#         print(f"Running Test: {name}")
#         print(f"{'=' * 50}")
#         try:
#             success = test_func()
#             results[name] = "✅ PASSED" if success else "❌ FAILED"
#         except Exception as e:
#             print(f"❌ Exception during test: {e}")
#             results[name] = "❌ ERROR"
#
#     # Print summary
#     print(f"\n{'=' * 50}")
#     print("TEST SUMMARY")
#     print(f"{'=' * 50}")
#     for name, result in results.items():
#         print(f"{result} - {name}")
#
#     # Display test image
#     if os.path.exists(TEST_IMAGE_PATH):
#         visualize_test_image(TEST_IMAGE_PATH)
#
#
# if __name__ == "__main__":
#     run_all_tests()