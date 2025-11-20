FROM node:20

# Create app directory
WORKDIR /app

# Copy package manifests first and install dependencies
COPY package.json package-lock.json* ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy rest of the source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

# Start the compiled app (src/index.ts compiles to dist/src/index.js)
CMD ["node", "dist/src/index.js"]
