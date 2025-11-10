# THE KAMPO WAY: Booking and Reservation System
## Kampo Ibayo Resort - General Trias, Cavite

A comprehensive web-based booking management system built for Kampo Ibayo Resort, an eco-friendly camping resort in General Trias, Cavite, Philippines. This system handles all aspects of resort operations from guest bookings to administrative management, featuring advanced payment processing, real-time notifications, and comprehensive analytics.

**Team**: DAI REN B. DACASIN, JUSTINE CESAR L. OCAMPO, JOHN REIGN REYES  
**Institution**: Cavite State University - Trece Martires City Campus  
**Version**: 2.0 (November 2025)  
**Technology Stack**: Next.js 15.5.2, React 19.1.0, TypeScript, Supabase

## Overview

This full-stack application provides a comprehensive booking solution for a 15-guest capacity resort, featuring real-time availability checking, integrated payment processing, and complete administrative oversight. Built with modern web technologies to ensure reliability, security, and optimal user experience.

## Core Features

### Advanced Guest Booking System
- **Real-time availability checking** with intelligent calendar and conflict prevention
- **Dynamic pricing engine** based on dates (₱9,000 weekdays / ₱12,000 weekends)
- **Dual payment options**: PayMongo integration (GCash, Cards) + Manual payment proof upload
- **Pet-friendly accommodations** with no additional charges
- **Comprehensive guest profiling** with special requests and dietary needs
- **Mobile-first responsive design** with Progressive Web App (PWA) capabilities

### Enterprise Administrative Dashboard
- **Complete booking oversight** - view, confirm, cancel, and manage all reservations
- **Advanced user management** - guest accounts, admin roles, and access controls
- **Comprehensive financial reporting** - revenue tracking, payment analytics, and export functionality
- **Operational management** - daily checklists, arrival/departure coordination
- **System maintenance controls** - graceful maintenance mode with custom messaging
- **Real-time notifications** - instant alerts for bookings, payments, and system events

### Multi-Channel Communication System
- **Automated email workflows** for all booking lifecycle events
- **SMS notification integration** for check-in reminders and urgent alerts
- **AI-powered chatbot** with natural language processing and 200+ FAQ responses
- **Professional email templates** with responsive design and resort branding
- **Admin notification dashboard** with real-time updates and action items

### Comprehensive Review and Rating System
- **Multi-category reviews** - overall, cleanliness, facilities, service, value, location
- **Photo upload system** with automatic optimization and moderation
- **Admin approval workflow** with quality control and response management
- **Public display integration** on homepage and booking pages for social proof
- **Anonymous review options** with privacy protection

### Advanced Features (Version 2.0)
- **Manual payment verification** - bank transfer proof upload and admin approval workflow
- **Enhanced photo management** - high-resolution image support with cloud storage
- **Legal compliance module** - complete policy management and user agreement tracking
- **Analytics and reporting** - comprehensive business intelligence with exportable reports
- **Security enhancements** - row-level security, input validation, and threat prevention

## Technical Stack

**Frontend**
- Next.js 15 with App Router and TypeScript
- Tailwind CSS for responsive design
- React 19 with modern hooks and concurrent features
- Lucide React for icons and Chart.js for analytics

**Backend & Database**
- Next.js API Routes for RESTful endpoints
- Supabase (PostgreSQL) with row-level security
- Supabase Auth for user authentication and authorization

**External Services**
- PayMongo API for payment processing
- Gmail SMTP via Nodemailer for email notifications
- Vercel for hosting and deployment

**Development Tools**
- TypeScript for type safety and developer experience
- ESLint for code quality assurance
- Turbopack for optimized builds

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- Git for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git
   cd kampo-ibayo-UI-
   npm install
   ```

2. **Environment Configuration**

   Create `.env.local` in the project root:
   ```env
   # Database Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Payment Processing
   PAYMONGO_SECRET_KEY=sk_test_your_paymongo_secret_key

   # Email Service
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password

   # Application Settings
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Database Setup**

   Execute the SQL schema in your Supabase project:
   ```bash
   # Run the database migrations found in INSTALLATION_GUIDE.md
   # This includes user tables, bookings, reviews, and RLS policies
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Create optimized production build with Turbopack
npm run start    # Start production server
npm run lint     # Run ESLint code quality checks
```

### Dependencies

**Core Framework**
- `next@15.5.2` - React framework with App Router
- `react@19.1.0` - React library
- `typescript@^5` - TypeScript for type safety

**UI & Components**
- `tailwindcss@^4` - Utility-first CSS framework
- `lucide-react@^0.543.0` - Modern icon library
- `react-datepicker@^8.7.0` - Date picker component
- `chart.js@^4.5.0` - Charts for admin analytics

**Backend Integration**
- `@supabase/supabase-js@^2.57.4` - Supabase client
- `nodemailer@^6.10.1` - Email service integration

## Project Structure

```
├── app/                          # Next.js 15 App Router
│   ├── admin/                    # Administrative interface
│   │   ├── bookings/            # Reservation management
│   │   ├── users/               # User account management
│   │   ├── payments/            # Financial tracking
│   │   ├── reports/             # Analytics and reporting
│   │   ├── reviews/             # Review moderation
│   │   └── settings/            # System configuration
│   ├── api/                     # Backend API routes
│   │   ├── admin/               # Admin-specific endpoints
│   │   ├── user/                # User management APIs
│   │   ├── email/               # Email notification system
│   │   └── paymongo/            # Payment processing APIs
│   ├── components/              # Reusable React components
│   │   ├── BookingSelector.tsx  # Date selection component
│   │   ├── ReviewSystem.tsx     # Review display system
│   │   ├── Chatbot.tsx          # AI customer support
│   │   └── ...                  # Additional UI components
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions and helpers
│   ├── contexts/                # React context providers
│   ├── auth/                    # Authentication pages
│   ├── book/                    # Booking workflow
│   ├── profile/                 # User account management
│   └── ...                      # Additional pages
├── public/                      # Static assets and images
├── database.types.ts            # TypeScript database schemas
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.ts               # Next.js build configuration
└── tsconfig.json                # TypeScript compiler options
```

## Resort Specifications

**Capacity & Pricing:**
- Maximum 15 guests
- 2 poolside AC family rooms + camping area + treehouse
- Dynamic pricing: ₱9,000 (weekdays) / ₱12,000 (weekends)
- Pet-friendly with no additional cost

**Operational Features:**
- Single resort management system
- Real-time booking conflict prevention
- Maintenance mode for temporary closures
- Automated daily operational reports

## Database Design

PostgreSQL database via Supabase with row-level security (RLS):

**Core Tables:**
- `users` - User accounts with role-based access (guest/admin)
- `bookings` - Reservations with status tracking (pending/confirmed/cancelled/completed)
- `guest_reviews` - Customer feedback with admin moderation workflow
- `review_photos` - Image uploads associated with reviews
- `maintenance_settings` - Resort operational status control

**Key Features:**
- Foreign key relationships ensuring data integrity
- Automatic timestamps for audit trails
- Comprehensive data validation and constraints

## Deployment

### Production Deployment

**Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

Configure environment variables in Vercel dashboard for production deployment.

**Docker Deployment**
```dockerfile
# Dockerfile included for containerized deployment
docker build -t kampo-ibayo .
docker run -p 3000:3000 kampo-ibayo
```

**Traditional Hosting**
```bash
npm run build
npm run start
```

## Documentation

- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - Complete setup and deployment guide
- [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) - System overview and specifications
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Architecture and implementation details
- [USER_MANUAL.md](./USER_MANUAL.md) - User guide for guests and administrators
- [TESTING_DOCUMENTATION.md](./TESTING_DOCUMENTATION.md) - Testing procedures and protocols

## Security & Performance

**Security Implementation:**
- Row-level security (RLS) with Supabase
- Input validation and SQL injection prevention
- Secure authentication and role-based access control
- HTTPS enforcement and secure headers

**Performance Optimization:**
- Server-side rendering with Next.js 15
- Optimized bundle size with code splitting
- Image optimization and lazy loading
- Turbopack for fast development and builds

## Support

**Technical Issues**: Create an issue in this repository
**Business Inquiries**: kampoibayo@gmail.com
**Resort Information**: +63 966 281 5123

---

**Kampo Ibayo Resort Booking System** - Built with Next.js 15, TypeScript, and Supabase