# Use a base image with Node
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (faster builds if code changes later)
COPY package*.json ./
RUN npm install

COPY . .

# Start in dev mode
CMD ["npm", "run", "dev"]
