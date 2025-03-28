# VeeFriends Card Game Deployment Guide

This guide explains how to deploy the VeeFriends Card Game application to a production environment and troubleshoot common issues.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Prerequisites](#deployment-prerequisites)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [MongoDB Configuration](#mongodb-configuration)
6. [Nginx Configuration](#nginx-configuration)
7. [Socket.IO Configuration](#socketio-configuration)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

The VeeFriends Card Game consists of:

- **Frontend**: React Native app (works in web browsers and as a native app)
- **Backend**: Express.js server with Socket.IO for real-time communication
- **Database**: MongoDB for user accounts and game data
- **Proxy Server**: Nginx for routing requests and WebSocket support

## Deployment Prerequisites

- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Nginx web server
- SSL certificate (Let's Encrypt recommended)
- Domain name configured with DNS

## Frontend Deployment

1. Build the React Native web version:

```bash
npm run build:web
```

2. Deploy the build files to your web server:

```bash
# Example: Copy to Nginx's web root
cp -r web-build/* /var/www/veefriends/
```

## Backend Deployment

### Option 1: Manual Deployment

1. Clone the repository on your server

2. Install dependencies:

```bash
cd backend
npm install --production
```

3. Configure environment variables in `.env`:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/veefriends-game
JWT_SECRET=your-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://vf.studioboost.pro
```

4. Start the server (preferably using PM2):

```bash
pm2 start src/server.js --name veefriends-backend
```

### Option 2: Docker Deployment

1. Build the Docker image:

```bash
cd backend
docker build -t veefriends-backend .
```

2. Run with Docker Compose:

```bash
docker-compose up -d
```

## MongoDB Configuration

### Using Local MongoDB

1. Install MongoDB:

```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

2. Create the database and user:

```bash
mongo
> use veefriends-game
> db.createUser({
    user: "veefriends",
    pwd: "secure-password",
    roles: [{ role: "readWrite", db: "veefriends-game" }]
  })
```

### Using MongoDB Atlas

1. Create a cluster on MongoDB Atlas
2. Create a database user with read/write permissions
3. Get your connection string and add it to `.env`

## Nginx Configuration

1. Copy the provided `nginx.conf` to your server:

```bash
sudo cp backend/nginx.conf /etc/nginx/sites-available/veefriends
```

2. Create a symlink to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/veefriends /etc/nginx/sites-enabled/
```

3. Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Socket.IO Configuration

The Socket.IO connection is critical for the multiplayer functionality. We've configured it with these best practices:

### Backend Socket.IO Settings

- Using polling transport only initially (more reliable across networks)
- Extended timeouts for better reliability
- Configured CORS to allow connections from all origins in development
- Strict CORS in production

### Frontend Socket.IO Settings

- Multiple fallback URLs to improve connection reliability
- Same-origin relative URL support
- Progressive connection retries with increasing backoff
- Error reporting and connection status feedback

## Troubleshooting

### XHR Poll Error

If you see "xhr poll error" in the console:

1. **Check CORS configuration**:
   - Ensure the domain in `allowedOrigins` matches exactly
   - Try accessing the `/socket-test` endpoint directly to verify connectivity

2. **Check Nginx proxy settings**:
   - Verify the `/socket.io/` location block in nginx.conf
   - Make sure headers and timeout settings are correct

3. **Check firewall settings**:
   - Make sure port 3000 is accessible if directly connecting
   - Or ensure that Nginx can forward requests to the backend

4. **Try different connection URLs**:
   - Frontend is configured to try multiple URLs
   - Same-origin relative URL (`//`) often works best in production

5. **Debugging steps**:
   - Check browser console for detailed error messages
   - Check backend logs for connection attempts
   - Use browser network tools to inspect failed XHR requests

### Connection Stuck on "Connecting to server..."

1. Verify the backend is running:
   ```bash
   pm2 status
   # or
   docker ps
   ```

2. Check MongoDB connection:
   ```bash
   # Check logs for MongoDB connection errors
   pm2 logs veefriends-backend
   ```

3. Try connecting with a guest account which bypasses MongoDB authentication

## Production Checklist

- [ ] SSL certificate is valid and not expired
- [ ] MongoDB credentials are secure and working
- [ ] Server firewall allows connections on ports 80, 443, and 3000 (if directly accessing)
- [ ] Proper CORS configuration for your domain
- [ ] Backend running with PM2 or Docker for auto-restart
- [ ] Nginx configured for WebSocket support
- [ ] `.env` file contains all required environment variables
- [ ] Logging is properly configured for debugging
