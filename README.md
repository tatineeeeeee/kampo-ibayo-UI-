# Kampo Ibayo Resort — Booking & Reservation System

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-yellow)

A full-stack web application for managing bookings and reservations at **Kampo Ibayo Resort**, an eco-friendly camping resort in General Trias, Cavite, Philippines.

## Features

- **Real-time booking** — availability calendar with conflict prevention and dynamic pricing
- **Dual payment processing** — PayMongo (GCash, Cards) + manual bank transfer with proof upload
- **Admin dashboard** — booking management, financial reports, user management, analytics
- **Multi-channel notifications** — automated emails (Nodemailer) + SMS reminders (SMSGate)
- **AI chatbot** — 200+ FAQ responses with natural language processing
- **Review system** — multi-category ratings, photo uploads, admin moderation
- **OCR verification** — automatic payment proof verification via Tesseract.js
- **PDF receipts** — downloadable booking confirmations and reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Frontend | React 19, TypeScript 5, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Row-Level Security) |
| Auth | Supabase Auth |
| Payments | PayMongo API |
| Email | Nodemailer (Gmail SMTP) |
| SMS | SMSGate |
| Hosting | Vercel (with cron jobs) |

## Getting Started

### Prerequisites

- Node.js 20+ (see [.nvmrc](.nvmrc))
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git
cd kampo-ibayo-UI-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see .env.example for details)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests (Vitest)
```

## Project Structure

```
app/
  admin/         # Admin dashboard (bookings, payments, reports, users, settings)
  api/           # API routes (bookings, email, SMS, admin endpoints)
  auth/          # Authentication pages
  book/          # Booking workflow
  components/    # Reusable React components
  contexts/      # React context providers
  hooks/         # Custom React hooks
  utils/         # Utility functions and services
  legal/         # Terms, FAQ, house rules
public/          # Static assets (images, icons)
docs/            # Project documentation
```

## Documentation

Detailed documentation is available in the [docs/](docs/) folder:

- [Installation Guide](docs/INSTALLATION_GUIDE.md) — setup and deployment
- [System Documentation](docs/SYSTEM_DOCUMENTATION.md) — system overview
- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) — architecture details
- [User Manual](docs/USER_MANUAL.md) — guide for guests and admins
- [Testing Documentation](docs/TESTING_DOCUMENTATION.md) — testing procedures

## Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy

## Team

- **Dai Ren B. Dacasin**
- **Justine Cesar L. Ocampo**
- **John Reign Reyes**

Cavite State University — Trece Martires City Campus

## License

This project is licensed under the [MIT License](LICENSE).
