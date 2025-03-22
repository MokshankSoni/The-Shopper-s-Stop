# Fashion Recommender System

A deep learning-based fashion recommendation system that provides similar product recommendations based on image similarity.

## Features

- Image-based product recommendations
- Vector similarity search using MongoDB Atlas
- RESTful API with FastAPI
- Docker containerization
- TensorFlow Serving for model deployment

## Prerequisites

- Python 3.9+
- Docker and Docker Compose
- MongoDB Atlas account

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/MokshankSoni/The-Shopper-s-Stop.git
cd The-Shopper-s-Stop
```

2. Download the model files:

   - The model files are too large for GitHub and are stored separately
   - Download the model from: [Google Drive Link] (you'll need to upload your model to Google Drive and share the link)
   - Extract the downloaded files to `fashion-recommender/fashion_recommender_model/1/`

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string in `.env` if needed

5. Start the services:

```bash
docker-compose up -d
```

## API Endpoints

- `POST /upload-image`: Upload an image file for recommendations
- `POST /recommendations`: Get recommendations using image URL or product ID
- `GET /health`: Check API health status

## Model Information

The model is based on ResNet50V2 architecture and has been fine-tuned for fashion image feature extraction. The model files are stored separately due to their size.

## License

[Your chosen license]

## Contributing

[Your contribution guidelines]
