#!/bin/bash

# TechBlog Development Setup Script

echo "🚀 Starting TechBlog Development Environment..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Install backend dependencies and seed database
echo "📦 Setting up backend..."
cd backend
npm install
npm run db:seed
echo "✅ Backend ready!"

# Start backend in background
npm run dev &
BACKEND_PID=$!
echo "🔧 Backend running (PID: $BACKEND_PID)"

cd ..

# Install frontend-user dependencies
echo "📦 Setting up frontend-user..."
cd frontend-user
npm install
npm run dev &
FRONTEND_USER_PID=$!
echo "🌐 Frontend-user running (PID: $FRONTEND_USER_PID)"

cd ..

# Install frontend-admin dependencies
echo "📦 Setting up frontend-admin..."
cd frontend-admin
npm install
npm run dev &
FRONTEND_ADMIN_PID=$!
echo "🔐 Frontend-admin running (PID: $FRONTEND_ADMIN_PID)"

cd ..

echo ""
echo "✨ All services started!"
echo ""
echo "📍 Services:"
echo "   Backend API:    http://localhost:3001"
echo "   Frontend User:  http://localhost:3000"
echo "   Frontend Admin: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait

# Cleanup
kill $BACKEND_PID $FRONTEND_USER_PID $FRONTEND_ADMIN_PID 2>/dev/null
