# Use a base image with Node
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (faster builds if code changes later)
COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=5173

# Expose the port that Vite runs on
EXPOSE 5173

# Start in dev mode with host binding for Docker
CMD ["npm", "run", "dev"]