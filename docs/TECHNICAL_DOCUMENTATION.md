# THE KAMPO WAY: Technical Documentation
## Comprehensive System Architecture and Development Guide

**Project**: The Kampo Way - Booking and Reservation System for Kampo Ibayo in General Trias, Cavite  
**Development Team**: DAI REN B. DACASIN, JUSTINE CESAR L. OCAMPO, JOHN REIGN REYES  
**Institution**: Cavite State University - Trece Martires City Campus  
**Version**: 2.0 (November 2025)  
**Last Updated**: November 1, 2025

## System Architecture

### Overview
The Kampo Ibayo Booking System follows a modern full-stack architecture using Next.js with TypeScript, providing both frontend user interfaces and backend API functionality in a single application.

### Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│   Next.js App    │◄──►│   Supabase DB   │
│  (Users/Admin)  │    │ (Frontend + API) │    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   External APIs  │
                       │  • PayMongo      │
                       │  • Gmail SMTP    │
                       └──────────────────┘
```

### Technology Stack

#### Frontend Technologies
- **Next.js 15.5.2**: React framework with App Router and Turbopack
- **React 19.1.0**: Modern React with concurrent features and new hooks
- **TypeScript 5.x**: Type-safe JavaScript with strict type checking
- **Tailwind CSS 4.0**: Utility-first CSS framework with JIT compilation
- **Lucide React**: Modern icon library with 1000+ icons
- **React Icons**: Additional icon sets (FontAwesome, etc.)
- **React Hooks**: Custom hooks for state management and business logic
- **Recharts 3.3.0**: Data visualization library for analytics charts

#### Backend Technologies
- **Next.js API Routes**: RESTful API endpoints
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Relational database
- **Nodemailer**: Email sending service

#### External Integrations
- **PayMongo API**: Payment processing
- **Gmail SMTP**: Email notifications
- **Vercel**: Hosting and deployment

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    users    │       │    bookings     │       │ guest_reviews   │
├─────────────┤   1:N ├─────────────────┤   1:N ├─────────────────┤
│ id (PK)     │◄──────┤ user_id (FK)    │──────►│ booking_id (FK) │
│ auth_id     │       │ id (PK)         │       │ id (PK)         │
│ name        │       │ guest_name      │       │ user_id (FK)    │
│ email       │       │ guest_email     │       │ rating          │
│ phone       │       │ check_in_date   │       │ review_text     │
│ role        │       │ check_out_date  │       │ approved        │
│ created_at  │       │ total_amount    │       │ created_at      │
└─────────────┘       │ status          │       └─────────────────┘
                      │ created_at      │
                      │ cancelled_by    │       ┌─────────────────┐
                      │ cancelled_at    │       │ review_photos   │
                      └─────────────────┘   1:N ├─────────────────┤
                                          ──────►│ review_id (FK)  │
                                                 │ id (PK)         │
                                                 │ photo_url       │
                                                 │ caption         │
                                                 └─────────────────┘
```

### Table Specifications

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  special_requests TEXT,
  brings_pet BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_by TEXT,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  payment_intent_id TEXT,
  payment_status TEXT
);
```

#### guest_reviews
```sql
CREATE TABLE guest_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  booking_id INTEGER REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_location TEXT,
  approved BOOLEAN DEFAULT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  resubmission_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: User authentication
**Body**: `{ email, password }`
**Response**: `{ user, session }`

### Booking Management Endpoints

#### POST /api/bookings/create
**Purpose**: Create new booking
**Authentication**: Required
**Body**:
```json
{
  "guest_name": "string",
  "guest_email": "string",
  "guest_phone": "string",
  "check_in_date": "YYYY-MM-DD",
  "check_out_date": "YYYY-MM-DD",
  "number_of_guests": "number",
  "total_amount": "number",
  "special_requests": "string",
  "brings_pet": "boolean"
}
```
**Response**: `{ success: boolean, booking_id: number }`

#### POST /api/admin/confirm-booking
**Purpose**: Admin confirms pending booking
**Authentication**: Admin required
**Body**: `{ bookingId: number }`
**Response**: `{ success: boolean, message: string }`

#### POST /api/user/cancel-booking
**Purpose**: User cancels their booking
**Authentication**: Required
**Body**: `{ bookingId: number, cancellationReason: string }`
**Response**: `{ success: boolean, message: string }`

### Payment Processing Endpoints

#### POST /api/paymongo/create-payment-intent
**Purpose**: Initialize payment with PayMongo
**Body**: `{ amount: number, bookingId: number }`
**Response**: `{ success: boolean, payment_intent: object }`

#### POST /api/paymongo/create-payment-method
**Purpose**: Create payment method
**Body**: `{ userId: string, type: string }`
**Response**: `{ success: boolean, payment_method: object }`

#### POST /api/paymongo/attach-payment-intent
**Purpose**: Attach payment method to intent
**Body**: `{ payment_intent_id: string, payment_method_id: string }`
**Response**: `{ success: boolean, checkout_url: string }`

### Email Notification Endpoints

#### POST /api/email/booking-confirmation
**Purpose**: Send booking confirmation emails
**Body**: `{ bookingDetails: object }`
**Response**: `{ success: boolean, messageId: string }`

#### POST /api/email/simple-send
**Purpose**: General email sending
**Body**: `{ to: string, subject: string, html: string }`
**Response**: `{ success: boolean, messageId: string }`

## Security Implementation

### Authentication & Authorization
- **Supabase Auth**: Industry-standard authentication
- **JWT Tokens**: Secure session management
- **Role-based Access**: User vs Admin permissions
- **Row-level Security**: Database-level access control

### Data Protection
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Next.js built-in protection

### API Security
- **Authentication Middleware**: Protected admin routes
- **Rate Limiting**: Prevent API abuse
- **HTTPS Encryption**: All communications encrypted
- **Environment Variables**: Sensitive data protection

## Performance Optimization

### Frontend Optimization
- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Load only necessary JavaScript
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Browser and CDN caching

### Database Optimization
- **Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimized database calls
- **Real-time Updates**: Supabase real-time subscriptions

### Deployment Optimization
- **CDN Distribution**: Global content delivery
- **Compression**: Gzip compression for assets
- **Minification**: Minimized CSS/JS files
- **Serverless Functions**: Scalable API endpoints

## Error Handling

### Client-Side Error Handling
```typescript
try {
  const response = await fetch('/api/bookings/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  
  if (!response.ok) {
    throw new Error('Booking creation failed');
  }
  
  const result = await response.json();
  // Handle success
} catch (error) {
  console.error('Booking error:', error);
  showErrorToast('Failed to create booking. Please try again.');
}
```

### Server-Side Error Handling
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.guest_name || !body.check_in_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process request
    const result = await createBooking(body);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### Unit Testing
- **Components**: React component functionality
- **Utilities**: Helper function validation
- **API Routes**: Endpoint logic testing

### Integration Testing
- **Database Operations**: CRUD functionality
- **Payment Flow**: PayMongo integration
- **Email System**: Notification delivery

### User Acceptance Testing
- **Booking Flow**: Complete user journey
- **Admin Operations**: Management functionality
- **Mobile Responsiveness**: Cross-device compatibility

## Development Workflow

### Local Development
```bash
# Clone repository
git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit validation

### Deployment Process
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Environment variables configured in Vercel dashboard
```

## Monitoring & Maintenance

### System Monitoring
- **Error Tracking**: Console error logging
- **Performance Monitoring**: Page load metrics
- **Database Health**: Supabase dashboard monitoring
- **Payment Status**: PayMongo webhook monitoring

### Regular Maintenance
- **Security Updates**: Monthly dependency updates
- **Database Cleanup**: Archive old completed bookings
- **Performance Review**: Monthly performance analysis
- **Backup Verification**: Database backup validation

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Author**: Development Team  
**Review Date**: Every 6 months