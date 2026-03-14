# Inbound Monitoring System

A serverless, real-time inbound email logging dashboard with OTP detection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INBOUND EMAIL FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐      ┌─────────────────────┐      ┌────────────────────┐
    │   Sender     │      │  Cloudflare Email   │      │  Cloudflare Worker │
    │  (Email)     │ ───▶ │     Routing         │ ───▶ │   (Email Bridge)   │
    └──────────────┘      └─────────────────────┘      └─────────┬──────────┘
                                                                  │
                                                                  │ POST /api/inbound
                                                                  │ x-api-key header
                                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  /api/inbound (webhook) │  │         Dashboard UI (Next.js)          │   │
│  │  - Parse raw email      │  │  - Real-time email table                │   │
│  │  - OTP detection        │  │  - Email detail drawer                  │   │
│  │  - Store to Supabase    │  │  - OTP badge & copy                     │   │
│  └───────────┬─────────────┘  └───────────────────┬─────────────────────┘   │
│              │                                    │                          │
│  ┌───────────┴────────────────────────────────────┴─────────────────────┐   │
│  │                     /api/cron/cleanup                                 │   │
│  │                  (Vercel Cron - every 24h)                            │   │
│  │                  Deletes emails older than 24h                        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  emails table                                                        │    │
│  │  - id (uuid)                                                         │    │
│  │  - created_at (timestamptz)                                          │    │
│  │  - recipient, sender, subject                                        │    │
│  │  - body_html, body_text, raw_content                                 │    │
│  │  - is_otp (boolean)                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  RLS: SELECT → anon allowed | INSERT → service_role only                    │
│  Realtime: Enabled for live updates                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL with Realtime)
- **Email Bridge**: Cloudflare Workers (Email Routing handler)
- **Hosting**: Vercel (with Cron Jobs for cleanup)

## Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Inbound Webhook Security
INBOUND_SECRET=your_secret_key_for_cloudflare_worker
```

## Setup Instructions

### 1. Supabase Setup

Run the migration script in `supabase/migrations/001_create_emails_table.sql` in your Supabase SQL Editor.

### 2. Cloudflare Email Routing

1. Deploy `cloudflare/worker.ts` to Cloudflare Workers
2. Set environment variables in Cloudflare:
   - `WEBHOOK_URL`: Your Vercel deployment URL + `/api/inbound`
   - `API_KEY`: Same value as `INBOUND_SECRET`
3. Configure Email Routing to forward to the Worker

### 3. Deploy to Vercel

```bash
npm run build
vercel deploy --prod
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- 🔒 Stealth mode UI ("Inbound Monitoring System")
- ⚡ Real-time email updates via Supabase Realtime
- 🎯 Automatic OTP detection (6-digit codes)
- 📋 One-click OTP copy
- 🗑️ Auto-cleanup of emails older than 24 hours
- 🎨 Dark mode "Stealth" aesthetic
- 📱 Responsive design (optimized for MacBook Pro 14")
