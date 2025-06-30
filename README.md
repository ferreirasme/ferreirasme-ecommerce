# Ferreira's Me E-commerce

E-commerce platform for semi-jewelry store built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- **Product Catalog**: Browse products with search, filters, and categories
- **Shopping Cart**: Persistent cart with real-time updates
- **User Authentication**: Secure login with OTP via email
- **Checkout Process**: Complete order flow with address validation
- **Shipping Integration**: CTT (Portuguese postal service) integration
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Admin Features**: Order management and product administration (coming soon)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Email**: Resend
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for emails)
- CTT API credentials (optional, for shipping)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/ferreirasme-ecommerce.git
cd ferreirasme-ecommerce
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
# ... other variables
```

5. Run database migrations:
```bash
npm run setup-db
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) to view the application.

## 🗄️ Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in order:
   - `/supabase/schema.sql` - Base schema
   - `/supabase/migrations/001_customer_fields.sql` - Customer fields
   - `/supabase/migrations/002_fix_otp_table.sql` - OTP table

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables in your Vercel project settings.

## 📱 Mobile Development

For mobile testing during development, see [MOBILE_ACCESS_SETUP.md](./MOBILE_ACCESS_SETUP.md).

## 🔒 Security

- Input validation with Zod
- Rate limiting on API routes
- Secure authentication with Supabase
- Content Security Policy headers
- SQL injection protection via Supabase

## 📝 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Please contact the maintainers for contribution guidelines.

---

Built with ❤️ using Next.js and Supabase