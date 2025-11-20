# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript (if you have a build script, otherwise we run directly)
# For this setup, we will use ts-node directly to save time
RUN npm install -g ts-node typescript

# Expose the port Render assigns
EXPOSE 3000

# Start command
CMD ["npm", "run", "dev"]