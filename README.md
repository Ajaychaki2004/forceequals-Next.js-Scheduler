# Appointment Booking App

A full-stack Next.js application for appointment booking with Google Calendar integration. Sellers can connect their Google Calendar and buyers can book appointments with real-time availability checking.

## Features

- **Authentication**: Google OAuth2 with NextAuth.js
- **Role-based Access**: Separate interfaces for buyers and sellers
- **Google Calendar Integration**: Real-time availability and automatic event creation
- **Professional Dashboard**: Seller dashboard with calendar view and statistics
- **Appointment Management**: Comprehensive booking system with status tracking
- **Responsive Design**: Mobile-first design with professional styling
- **Database Integration**: MongoDB with encrypted refresh token storage

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Authentication**: NextAuth.js with Google OAuth2
- **Database**: MongoDB with Mongoose
- **Calendar API**: Google Calendar API v3
- **Deployment**: Vercel-ready configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or Atlas)
- Google Cloud Console project with Calendar API enabled

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd appointment-booking-app
npm install
\`\`\`

### 2. Environment Setup

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in the required environment variables (see Configuration section below).

### 3. Database Setup

If using local MongoDB:

\`\`\`bash
# Start MongoDB service
mongod

# The app will automatically create the necessary collections
\`\`\`

For MongoDB Atlas:
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get your connection string
3. Add it to `MONGODB_URI` in `.env.local`

### 4. Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to your `.env.local`

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/appointment-booking` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-xxx` |
| `ENCRYPTION_KEY` | 32-character key for encrypting refresh tokens | Generate with `openssl rand -hex 16` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Development redirect URL | `http://localhost:3000` |

## Project Structure

\`\`\`
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth.js configuration
│   │   ├── appointments/         # Appointment CRUD operations
│   │   ├── calendar/             # Google Calendar API integration
│   │   └── sellers/              # Seller management
│   ├── appointments/             # Shared appointments view
│   ├── buyer/                    # Buyer-specific pages
│   ├── seller/                   # Seller-specific pages
│   ├── auth/                     # Authentication pages
│   ├── globals.css               # Global styles with design tokens
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── appointments/             # Appointment-related components
│   ├── buyer/                    # Buyer interface components
│   ├── seller/                   # Seller interface components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── models/                   # Database models
│   ├── auth.ts                   # Authentication utilities
│   ├── google-calendar.ts        # Google Calendar service
│   └── mongodb.ts                # Database connection
└── types/                        # TypeScript type definitions
\`\`\`

## User Flows

### Seller Flow

1. **Sign Up**: Register as a seller with Google OAuth2
2. **Connect Calendar**: Authorize Google Calendar access
3. **Dashboard**: View appointments, calendar, and statistics
4. **Manage Appointments**: Accept, reschedule, or cancel bookings

### Buyer Flow

1. **Sign Up**: Register as a buyer with Google OAuth2
2. **Find Sellers**: Browse available sellers
3. **Check Availability**: View real-time calendar availability
4. **Book Appointment**: Select time slot and confirm booking
5. **Manage Bookings**: View and manage scheduled appointments

## API Endpoints

### Authentication
- `GET/POST /api/auth/*` - NextAuth.js endpoints

### Appointments
- `GET /api/appointments` - List user's appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/[id]` - Get appointment details
- `PATCH /api/appointments/[id]` - Update appointment status
- `DELETE /api/appointments/[id]` - Delete appointment

### Sellers
- `GET /api/sellers` - List all sellers
- `POST /api/sellers` - Update seller information
- `GET /api/sellers/[id]` - Get seller details

### Calendar Integration
- `GET /api/calendar/availability` - Get seller availability
- `POST /api/calendar/book` - Book appointment with calendar event
- `GET /api/calendar/events` - Get calendar events
- `PATCH /api/calendar/events/[id]` - Update calendar event
- `DELETE /api/calendar/events/[id]` - Delete calendar event

## Database Schema

### Users Collection (NextAuth.js)
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  image: String,
  role: "buyer" | "seller",
  emailVerified: Date,
  // ... other NextAuth fields
}
\`\`\`

### Sellers Collection
\`\`\`javascript
{
  _id: ObjectId,
  googleId: String,
  name: String,
  email: String,
  refreshToken: String, // Encrypted
  role: "seller",
  isCalendarConnected: Boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Appointments Collection
\`\`\`javascript
{
  _id: ObjectId,
  buyerId: String,
  buyerEmail: String,
  buyerName: String,
  sellerId: String,
  sellerEmail: String,
  sellerName: String,
  eventId: String, // Google Calendar Event ID
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  status: "scheduled" | "cancelled" | "completed",
  meetingLink: String,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to update these for production:
- `NEXTAUTH_URL` - Your production domain
- `MONGODB_URI` - Production MongoDB connection
- Update Google OAuth2 redirect URIs

## Security Features

- **Encrypted Refresh Tokens**: Google refresh tokens are encrypted before database storage
- **Role-based Access Control**: API endpoints validate user roles
- **Session Management**: Secure session handling with NextAuth.js
- **Input Validation**: All API endpoints validate and sanitize inputs
- **CORS Protection**: Proper CORS configuration for API routes

## Troubleshooting

### Common Issues

1. **Calendar not connecting**
   - Verify Google Calendar API is enabled
   - Check OAuth2 redirect URIs
   - Ensure proper scopes are requested

2. **Database connection issues**
   - Verify MongoDB is running (local) or connection string (Atlas)
   - Check network connectivity and firewall settings

3. **Authentication problems**
   - Verify `NEXTAUTH_SECRET` is set
   - Check Google OAuth2 credentials
   - Ensure `NEXTAUTH_URL` matches your domain

### Debug Mode

Enable debug logging by adding to `.env.local`:

\`\`\`bash
NEXTAUTH_DEBUG=true
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
