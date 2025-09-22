# Kampo Ibayo Resort - Booking & Management System

A comprehensive web application for resort bookings and management, built with Next.js 15, TypeScript, and Supabase. Designed for Kampo Ibayo, an eco-friendly camping resort located in General Trias, Cavite, Philippines.

## Features

### Public Features
- **Responsive Landing Page** - Mobile-first design optimized for all devices
- **Interactive Gallery** - Showcase of resort facilities and amenities
- **Amenities Display** - Detailed view of available services and facilities
- **Customer Reviews** - Testimonials and ratings from previous guests
- **Contact Information** - Multiple contact methods with integrated Google Maps
- **Real-time Availability** - Live booking calendar with available dates

### User Features
- **User Authentication** - Secure registration and login system
- **Online Booking** - Reserve accommodations with date selection
- **Booking Management** - View, modify, and cancel existing reservations
- **Profile Management** - Update personal information and preferences
- **Booking History** - Complete record of past and upcoming stays

### Admin Features
- **User Management** - Comprehensive user account administration
- **Booking Administration** - Complete oversight of all reservations
- **Analytics Dashboard** - Booking statistics and revenue insights
- **Payment Tracking** - Monitor payment status and financial records
- **Customer Support** - Tools for handling guest inquiries and issues

### Technical Features
- **Mobile-First Design** - Responsive layout for all screen sizes
- **Role-Based Access** - Different permissions for users and administrators
- **Real-Time Updates** - Live data synchronization across devices
- **Security** - Row-level security and authentication protection

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development environment
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **React Chart.js 2** - Data visualization for analytics

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database management
- **Supabase Auth** - User authentication and authorization

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Turbopack** - Fast bundler for development and production
- **TypeScript** - Static type checking and code intelligence

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Git

### Quick Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git
   cd kampo-ibayo-UI-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

### For Team Members

To test the application with existing data:

1. **Get Environment File**
   Request the `.env.local` file from the project maintainer via email or messaging.

2. **Setup and Run**
   ```bash
   git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git
   cd kampo-ibayo-UI-
   npm install
   # Add the provided .env.local file to the root directory
   npm run dev
   ```

**Note:** You will be working with shared database. Use test data when creating bookings and be mindful of existing information.

## Development

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Key Dependencies

**Core Framework:**
- `next@15.5.2` - React framework with App Router
- `react@19.1.0` - React library
- `typescript@^5` - TypeScript for type safety

**UI & Styling:**
- `tailwindcss@^4` - Utility-first CSS framework
- `lucide-react@^0.543.0` - Modern icon library
- `react-icons@^5.5.0` - Popular icon library

**Database & Authentication:**
- `@supabase/supabase-js@^2.57.4` - Supabase client
- `supabase@^2.40.7` - Supabase CLI tools

**Forms & Components:**
- `react-datepicker@^8.7.0` - Date picker component
- `chart.js@^4.5.0` - Chart library for analytics

## Project Structure

```
kampo-ibayo/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   │   ├── bookings/            # Booking management
│   │   ├── users/               # User management
│   │   ├── payments/            # Payment tracking
│   │   ├── reports/             # Analytics & reports
│   │   ├── settings/            # Admin settings
│   │   └── help/                # Help & support
│   ├── api/                     # API routes
│   │   └── admin/               # Admin API endpoints
│   ├── auth/                    # Authentication pages
│   ├── book/                    # Booking pages
│   ├── bookings/                # User booking management
│   ├── components/              # Reusable components
│   ├── hooks/                   # Custom React hooks
│   ├── profile/                 # User profile pages
│   ├── settings/                # User settings
│   ├── utils/                   # Utility functions
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   └── supabaseClient.tsx       # Supabase configuration
├── public/                      # Static assets
│   ├── gallery1-6.jpg          # Resort photos
│   ├── pool.jpg                 # Hero image
│   └── *.svg                    # Icons and graphics
├── database.types.ts            # TypeScript types for database
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Configuration

### Tailwind CSS
Custom configuration with mobile-first responsive design:
- **xs: 475px** - Extra small devices (custom breakpoint)
- **sm: 640px** - Small devices (phones)
- **md: 768px** - Medium devices (tablets)
- **lg: 1024px** - Large devices (laptops)
- **xl: 1280px** - Extra large devices (desktops)

### Key Components
- **Enhanced Navigation** - Mobile-friendly with grouped sections
- **Interactive Gallery** - Responsive image showcase
- **Booking Interface** - Intuitive date selection and reservation
- **Admin Dashboard** - Comprehensive management tools
- **Trust Badges** - Security and reliability indicators

## Deployment

### Recommended Platforms

**Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

**Netlify**
```bash
npm run build
# Upload build folder
```

**Self-hosted**
```bash
npm run build
npm run start
```

## Documentation

- [USER_DEACTIVATION_SYSTEM.md](./USER_DEACTIVATION_SYSTEM.md) - User management system
- [AUTO_EXPIRATION_DOCS.md](./AUTO_EXPIRATION_DOCS.md) - Automatic booking expiration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary to Kampo Ibayo Resort.

## Support

For technical support or questions:
- **Email**: kampoibayo@gmail.com
- **Phone**: +63 945 277 9541
- **Location**: 132 Ibayo, Brgy Tapia, General Trias, Cavite

---

Built with React, Next.js, and Supabase for Kampo Ibayo Resort
