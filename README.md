# LaundryOS

Indore's smartest laundry service — Next.js 14 + Supabase + PWA

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in all values in .env.local

# 3. Run Supabase schema
# Paste supabase/schema.sql into Supabase SQL Editor and run

# 4. Create first admin
# Supabase Auth dashboard → Add User (admin@laundreos.in)
# Then run in SQL Editor:
# INSERT INTO admins (id, name, email, is_super_admin)
# VALUES ('[uuid]', 'Admin', 'admin@laundreos.in', true);

# 5. Create Supabase Storage buckets (all public)
# - order-photos
# - profile-photos
# - garment-photos
# - support-attachments

# 6. Configure Supabase Auth
# - Email confirmations: OFF
# - Site URL: https://laundreos.vercel.app
# - Redirect URLs: https://laundreos.vercel.app/**, http://localhost:3000/**

# 7. Generate VAPID keys for push notifications
npx web-push generate-vapid-keys
# Copy output to .env.local

# 8. Start dev server
npm run dev
```

## Folder Structure

```
src/
├── app/
│   ├── (customer)/         # Customer panel
│   ├── admin/              # Admin panel
│   ├── rider/              # Rider panel
│   └── api/                # API routes
├── components/
│   ├── customer/
│   ├── admin/
│   ├── rider/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── razorpay.ts
│   ├── slots.ts
│   ├── credits.ts
│   ├── notifications.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── middleware.ts
```

## Panels

| Panel    | URL           | Auth              |
|----------|---------------|-------------------|
| Customer | /login        | Public signup     |
| Admin    | /admin/login  | Admin-created only|
| Rider    | /rider/login  | Admin-created only|

## Deploy

Connect GitHub repo to Vercel, add all env vars from `.env.local.example`.
