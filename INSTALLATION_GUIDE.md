# THE KAMPO WAY: Installation & Deployment Guide
## Complete Setup Instructions for Kampo Ibayo Booking System

**Project**: The Kampo Way - Booking and Reservation System for Kampo Ibayo in General Trias, Cavite  
**Team**: DAI REN B. DACASIN, JUSTINE CESAR L. OCAMPO, JOHN REIGN REYES  
**Institution**: Cavite State University - Trece Martires City Campus  
**Version**: 2.0 (November 2025)  
**Technology**: Next.js 15.5.2, React 19.1.0, Supabase, TypeScript

## Prerequisites

### Development Environment
- **Node.js**: Version 18.17.0 or higher (LTS recommended)
- **npm**: Version 9.0.0 or higher (or yarn 1.22.0+)
- **Git**: Version 2.40.0 or higher for version control
- **Code Editor**: VS Code with recommended extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint for code linting
- **Browser**: Chrome/Firefox with developer tools for testing

### Required External Accounts
1. **Supabase Account** (supabase.com): 
   - PostgreSQL database hosting
   - Authentication service
   - Row-level security (RLS)
   - Real-time subscriptions
   
2. **PayMongo Account** (paymongo.com):
   - Payment processing for Philippines
   - GCash and card payment support
   - Test and live API keys
   
3. **Gmail Account** with App Password:
   - SMTP email service for notifications
   - 2FA must be enabled for app passwords
   - Secure email delivery system
   
4. **Vercel Account** (vercel.com):
   - Recommended hosting platform
   - Automatic deployments from Git
   - Edge network and CDN
   
5. **GitHub Account** (github.com):
   - Code repository hosting
   - Version control and collaboration
   - CI/CD integration with Vercel

6. **Semaphore Account** (semaphore.co) - Optional:
   - SMS notifications for Philippines
   - Check-in reminders and alerts

## Local Development Setup

### Step 1: Clone Repository
```bash
# Clone the repository
git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git

# Navigate to project directory
cd kampo-ibayo-UI-

# Install dependencies
npm install
```

### Step 2: Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayMongo Configuration (Test Mode)
PAYMONGO_SECRET_KEY=sk_test_your_paymongo_secret_key

# Email Configuration
GMAIL_USER=kampoibayo@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Application URL (for emails)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Database Setup

#### Supabase Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to create all necessary tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  special_requests TEXT,
  brings_pet BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_by TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  payment_intent_id TEXT,
  payment_status TEXT
);

-- Guest reviews table
CREATE TABLE guest_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_location TEXT,
  approved BOOLEAN DEFAULT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  resubmission_count INTEGER DEFAULT 0 CHECK (resubmission_count >= 0),
  original_submission_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review photos table
CREATE TABLE review_photos (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES guest_reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance settings table
CREATE TABLE maintenance_settings (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  message TEXT DEFAULT 'We are temporarily closed for maintenance. Please check back soon!',
  enabled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default maintenance settings
INSERT INTO maintenance_settings (is_active, message) 
VALUES (FALSE, 'We are temporarily closed for maintenance. Please check back soon!');

-- Booking dates helper table (optional)
CREATE TABLE booking_dates (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin policies (create admin user first)
CREATE POLICY "Admins can manage all data" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all reviews" ON guest_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
```

### Step 4: Create Admin User
1. Go to **Supabase Authentication** in your dashboard
2. Create a new user with your admin email
3. Copy the user ID
4. Go to **SQL Editor** and run:
```sql
INSERT INTO users (auth_id, name, email, role) 
VALUES ('your-copied-user-id', 'Admin Name', 'admin@kampoibayo.com', 'admin');
```

### Step 5: Start Development Server
```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
```

## External Service Configuration

### PayMongo Setup
1. Sign up at [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Complete business verification (for live mode - optional for testing)
3. Get test API keys from dashboard:
   - Secret Key: `sk_test_...`
   - Public Key: `pk_test_...` (not needed for this setup)
4. Add secret key to `.env.local`

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password in `.env.local` (not your regular Gmail password)

### Supabase Configuration
1. Create project at [Supabase](https://supabase.com)
2. Get project URL and anon key from Settings → API
3. Configure authentication providers if needed
4. Set up database tables using SQL above

## Production Deployment

### Vercel Deployment (Recommended)

#### Step 1: Prepare for Deployment
```bash
# Build the application to check for errors
npm run build

# Commit all changes to git
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Deploy to Vercel
1. Sign up at [Vercel](https://vercel.com)
2. Connect your GitHub account
3. Import your repository
4. Configure environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_BASE_URL` to your domain
5. Deploy

#### Step 3: Custom Domain (Optional)
1. Purchase domain (e.g., kampoibayo.com)
2. Add domain in Vercel dashboard
3. Configure DNS settings as instructed
4. Update environment variables with new domain

### Alternative Deployment Options

#### Netlify Deployment
```bash
# Build the application
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=.next
```

#### Self-Hosted Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "kampo-ibayo" -- start
```

## Environment Variables Reference

### Required Variables
```env
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Payments (Required for booking functionality)
PAYMONGO_SECRET_KEY=sk_test_your-secret-key

# Email (Required for notifications)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Application URL (Required for email links)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Optional Variables
```env
# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Error Tracking (Optional)
SENTRY_DSN=your-sentry-dsn
```

## Database Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
```sql
-- Clean up old pending bookings (>7 days)
UPDATE bookings 
SET status = 'cancelled', 
    cancelled_by = 'system', 
    cancelled_at = NOW(),
    cancellation_reason = 'Automatic cancellation - payment not completed'
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '7 days';

-- Archive completed bookings older than 1 year
UPDATE bookings 
SET status = 'archived' 
WHERE status = 'completed' 
  AND check_out_date < NOW() - INTERVAL '1 year';
```

#### Monthly Tasks
```sql
-- Update user statistics
-- Export data for backup
-- Review performance metrics
```

### Backup Strategy
1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Manual Exports**: Export critical data monthly
3. **Code Backups**: GitHub repository serves as code backup
4. **Environment Backup**: Document all environment variables

## Security Configuration

### Production Security Checklist
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set secure environment variables
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS settings
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

### API Security
```typescript
// Example API security middleware
export async function middleware(request: NextRequest) {
  // Rate limiting
  // Authentication checks
  // CORS configuration
  return NextResponse.next();
}
```

## Monitoring and Maintenance

### Health Checks
1. **Database Connection**: Monitor Supabase dashboard
2. **Payment Processing**: Check PayMongo webhook status
3. **Email Delivery**: Monitor SMTP connection
4. **Website Availability**: Use uptime monitoring service

### Performance Monitoring
- **Page Load Times**: Monitor with Vercel Analytics
- **Database Queries**: Review slow queries in Supabase
- **Error Rates**: Track API errors and failures
- **User Experience**: Monitor conversion rates

### Update Procedures
```bash
# Regular updates
npm update

# Security updates
npm audit
npm audit fix

# Deploy updates
git add .
git commit -m "Update dependencies"
git push origin main
```

## Troubleshooting

### Common Installation Issues

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install correct version using nvm
nvm install 18
nvm use 18
```

#### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
1. Check Supabase project URL and keys
2. Verify network connectivity
3. Check RLS policies
4. Review API logs in Supabase dashboard

#### Email Configuration Issues
1. Verify Gmail app password (not regular password)
2. Check 2FA is enabled on Gmail account
3. Test SMTP connection
4. Review email service logs

### Getting Help
- **Documentation**: Reference this guide and system documentation
- **GitHub Issues**: Report bugs in repository
- **Supabase Support**: Database and authentication issues
- **PayMongo Support**: Payment processing issues
- **Community**: Next.js and React communities

---

**Installation Guide Version**: 1.0  
**Last Updated**: October 2025  
**Compatible With**: Kampo Ibayo Booking System v1.0  
**Prerequisites**: Node.js 18+, Modern web browser