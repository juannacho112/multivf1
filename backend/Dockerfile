FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy app source code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
