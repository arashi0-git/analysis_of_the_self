FROM node:20-alpine

ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Run the application
CMD ["npm", "run", "dev"]
