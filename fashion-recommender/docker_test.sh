#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}       FASHION RECOMMENDER DOCKER ENVIRONMENT TEST      ${NC}"
echo -e "${BLUE}========================================================${NC}"

# Check if Docker is running
echo -e "\n${YELLOW}Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
else
  echo -e "${GREEN}Docker is running!${NC}"
fi

# Check if docker-compose exists
echo -e "\n${YELLOW}Checking if docker-compose is installed...${NC}"
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}docker-compose could not be found. Please install it and try again.${NC}"
  exit 1
else
  echo -e "${GREEN}docker-compose is installed!${NC}"
fi

# Check if containers are running
echo -e "\n${YELLOW}Checking if fashion recommender containers are running...${NC}"
tf_serving_running=$(docker ps --filter "name=tf-serving" --format "{{.Names}}" | wc -l)
api_running=$(docker ps --filter "name=api" --format "{{.Names}}" | wc -l)

if [ "$tf_serving_running" -eq 0 ] || [ "$api_running" -eq 0 ]; then
  echo -e "${RED}One or more containers are not running.${NC}"

  echo -e "\n${YELLOW}Starting the containers with docker-compose...${NC}"
  docker-compose up -d

  echo -e "\n${YELLOW}Waiting for containers to start (30 seconds)...${NC}"
  sleep 30

  # Check again if containers are running
  tf_serving_running=$(docker ps --filter "name=tf-serving" --format "{{.Names}}" | wc -l)
  api_running=$(docker ps --filter "name=api" --format "{{.Names}}" | wc -l)

  if [ "$tf_serving_running" -eq 0 ] || [ "$api_running" -eq 0 ]; then
    echo -e "${RED}Failed to start containers. Please check docker-compose logs.${NC}"
    echo -e "${YELLOW}Logs for tf-serving:${NC}"
    docker-compose logs tf-serving
    echo -e "${YELLOW}Logs for api:${NC}"
    docker-compose logs api
    exit 1
  else
    echo -e "${GREEN}Containers started successfully!${NC}"
  fi
else
  echo -e "${GREEN}All containers are running!${NC}"
fi

# Test TensorFlow Serving REST API
echo -e "\n${YELLOW}Testing TensorFlow Serving REST API...${NC}"
tf_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8501/v1/models/fashion_recommender)

if [ "$tf_response" -eq 200 ]; then
  echo -e "${GREEN}TensorFlow Serving REST API is working!${NC}"
  echo -e "${YELLOW}Model information:${NC}"
  curl -s http://localhost:8501/v1/models/fashion_recommender | jq .
else
  echo -e "${RED}TensorFlow Serving REST API is not responding correctly. (Status: $tf_response)${NC}"
  echo -e "${YELLOW}Checking TensorFlow Serving logs:${NC}"
  docker-compose logs tf-serving
fi

# Test API health endpoint
echo -e "\n${YELLOW}Testing API health endpoint...${NC}"
api_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$api_response" -eq 200 ]; then
  echo -e "${GREEN}API health endpoint is working!${NC}"
  echo -e "${YELLOW}Health response:${NC}"
  curl -s http://localhost:8000/health | jq .
else
  echo -e "${RED}API health endpoint is not responding correctly. (Status: $api_response)${NC}"
  echo -e "${YELLOW}Checking API logs:${NC}"
  docker-compose logs api
fi

# Check network connectivity between containers
echo -e "\n${YELLOW}Testing network connectivity between containers...${NC}"
docker-compose exec api curl -s http://tf-serving:8501/v1/models/fashion_recommender > /dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}API container can connect to TensorFlow Serving container!${NC}"
else
  echo -e "${RED}API container cannot connect to TensorFlow Serving container.${NC}"
  echo -e "${YELLOW}Checking network configuration:${NC}"
  docker network ls
  docker network inspect fashion-recommender-network
fi

echo -e "\n${BLUE}========================================================${NC}"
echo -e "${BLUE}                 TEST COMPLETED                         ${NC}"
echo -e "${BLUE}========================================================${NC}"
echo -e "${YELLOW}To run the Python testing script, execute:${NC}"
echo -e "python model_testing.py"