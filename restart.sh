#!/bin/bash

# Kill any running Next.js processes
pkill -f "next"

# Clean up
rm -rf .next

# Install dependencies if needed
npm install

# Start the development server
npm run dev 