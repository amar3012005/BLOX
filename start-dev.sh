#!/bin/bash
echo "Starting development environment..."

# Start the backend server
echo "Starting backend server..."
cd server
node app.js &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start the frontend
echo "Starting frontend..."
cd ..
npm start &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

# Wait for processes
wait
