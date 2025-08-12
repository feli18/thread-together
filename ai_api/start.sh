#!/bin/bash
# Start script for AI Tag Generator service

echo "Starting AI Tag Generator service..."

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port $PORT
