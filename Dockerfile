# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (optimizes cache)
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the TypeScript code (Creates the 'dist' folder)
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the app using the production script
CMD ["npm", "start"]