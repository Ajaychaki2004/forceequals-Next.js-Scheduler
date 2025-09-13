# Deployment Guide

This guide covers deploying the Appointment Booking App to various platforms.

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub repository with your code
- Vercel account
- Production MongoDB database
- Google Cloud Console project

### Step 1: Prepare for Production

1. **Update Google OAuth2 Settings**
   - Go to Google Cloud Console → Credentials
   - Add production redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

2. **Set up Production Database**
   - Use MongoDB Atlas for production
   - Create a production cluster
   - Get the connection string

### Step 2: Deploy to Vercel

1. **Connect Repository**
   \`\`\`bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Deploy from command line
   vercel
   \`\`\`
   
   Or connect via Vercel dashboard:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment Variables**
   
   In Vercel dashboard, add these environment variables:
   
   \`\`\`bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appointment-booking
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ENCRYPTION_KEY=your-32-character-encryption-key
   \`\`\`

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Check deployment logs for any issues

### Step 3: Post-Deployment

1. **Test Authentication**
   - Try signing in as both buyer and seller
   - Verify Google Calendar connection works

2. **Test Booking Flow**
   - Create a test appointment
   - Verify calendar events are created
   - Check email notifications

## Alternative Deployment Options

### Railway

1. **Create Railway Project**
   \`\`\`bash
   npm install -g @railway/cli
   railway login
   railway init
   \`\`\`

2. **Add Environment Variables**
   \`\`\`bash
   railway variables set MONGODB_URI=your-mongodb-uri
   railway variables set NEXTAUTH_SECRET=your-secret
   # ... add all other variables
   \`\`\`

3. **Deploy**
   \`\`\`bash
   railway up
   \`\`\`

### DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Choose Node.js environment

2. **Configure Build Settings**
   \`\`\`yaml
   # .do/app.yaml
   name: appointment-booking
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/appointment-booking
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: MONGODB_URI
       value: your-mongodb-uri
     # ... add other environment variables
   \`\`\`

### Self-Hosted (Docker)

1. **Create Dockerfile**
   \`\`\`dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   \`\`\`

2. **Create docker-compose.yml**
   \`\`\`yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - MONGODB_URI=mongodb://mongo:27017/appointment-booking
         - NEXTAUTH_SECRET=your-secret
         # ... other environment variables
       depends_on:
         - mongo
   
     mongo:
       image: mongo:6
       ports:
         - "27017:27017"
       volumes:
         - mongo_data:/data/db
   
   volumes:
     mongo_data:
   \`\`\`

3. **Deploy**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

## Environment-Specific Configurations

### Development
\`\`\`bash
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/appointment-booking
\`\`\`

### Staging
\`\`\`bash
NEXTAUTH_URL=https://staging-your-app.vercel.app
MONGODB_URI=mongodb+srv://staging-cluster.mongodb.net/appointment-booking
\`\`\`

### Production
\`\`\`bash
NEXTAUTH_URL=https://your-app.vercel.app
MONGODB_URI=mongodb+srv://production-cluster.mongodb.net/appointment-booking
\`\`\`

## Performance Optimization

### Database Indexing

Add these indexes to your MongoDB collections:

\`\`\`javascript
// Users collection
db.users.createIndex({ "email": 1 })

// Sellers collection
db.sellers.createIndex({ "email": 1 })
db.sellers.createIndex({ "googleId": 1 })

// Appointments collection
db.appointments.createIndex({ "buyerId": 1 })
db.appointments.createIndex({ "sellerId": 1 })
db.appointments.createIndex({ "startTime": 1 })
db.appointments.createIndex({ "eventId": 1 })
\`\`\`

### Caching Strategy

Consider implementing caching for:
- Seller availability data
- User session data
- Calendar events

### Monitoring

Set up monitoring for:
- API response times
- Database connection health
- Google Calendar API rate limits
- Error rates

## Security Checklist

- [ ] All environment variables are set securely
- [ ] Google OAuth2 redirect URIs are configured correctly
- [ ] Database connection uses authentication
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is implemented for API endpoints
- [ ] Input validation is in place
- [ ] Refresh tokens are encrypted
- [ ] Session security is configured properly

## Troubleshooting Deployment Issues

### Common Problems

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify values are correct (especially URLs)

3. **Database Connection Problems**
   - Test connection string locally first
   - Check network access and firewall rules
   - Verify database user permissions

4. **Google OAuth2 Issues**
   - Confirm redirect URIs match exactly
   - Check that Calendar API is enabled
   - Verify client ID and secret are correct

### Getting Help

- Check deployment platform documentation
- Review application logs
- Test locally with production environment variables
- Use debugging tools provided by your platform
