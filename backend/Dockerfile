FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create data directory
RUN mkdir -p data

EXPOSE 3001

# Use a startup script that seeds only if needed
CMD ["sh", "-c", "node dist/seed-if-empty.js && npm start"]
