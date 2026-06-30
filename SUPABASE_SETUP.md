# POWERSTAR v2 — Supabase Setup Guide (Beginner Friendly)
# Follow every step in order. Takes about 15 minutes.

---

## STEP 1 — Create Your Supabase Account

1. Open your browser → go to https://supabase.com
2. Click the big orange "Start your project" button
3. Sign up with GitHub (easiest) OR with your email
4. If email: check your inbox and click the confirmation link

---

## STEP 2 — Create a New Project

1. After logging in, you see the Supabase dashboard
2. Click "New project" (green button, top right)
3. Fill in:
   ┌─────────────────────────────────────┐
   │ Name:     powerstar                 │
   │ Password: (choose something strong) │
   │ Region:   Southeast Asia (Singapore)│
   │ Plan:     Free                      │
   └─────────────────────────────────────┘
4. Click "Create new project"
5. ⏳ Wait 1–2 minutes. You'll see a loading spinner. Be patient.

---

## STEP 3 — Get Your API Keys ← MOST IMPORTANT STEP

1. In your project, look at the LEFT SIDEBAR
2. Click the ⚙️ "Settings" icon (gear icon at bottom)
3. Click "API" in the settings menu
4. You will see this page:

   ┌────────────────────────────────────────────────────────┐
   │ Project Settings > API                                  │
   │                                                        │
   │ Project URL                                            │
   │ https://abcdefghijklmnop.supabase.co    [Copy]        │
   │                                                        │
   │ Project API Keys                                       │
   │                                                        │
   │ anon  public                                           │
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  [Copy]     │
   │                                                        │
   │ service_role  secret  ← ⚠️ DO NOT COPY THIS ONE      │
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  [Copy]     │
   └────────────────────────────────────────────────────────┘

5. Copy these TWO values (click the Copy buttons):
   → Project URL   (looks like https://XXXX.supabase.co)
   → anon public   (long string starting with eyJhbGci...)

   ⛔ NEVER copy the service_role key — that's for server use only

---

## STEP 4 — Add Keys to Your Project

1. In your POWERSTAR project folder, find the file: .env.example
2. Create a copy named: .env
   (Just duplicate the file and rename it)

3. Open .env in any text editor and replace the placeholders:

   BEFORE:
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   AFTER (paste YOUR actual values):
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Save the file. Keep it secret. Never share it or commit to git.

---

## STEP 5 — Run the Database Schema

1. In your Supabase project dashboard, look at the LEFT SIDEBAR
2. Click the "SQL Editor" icon (looks like >_ or a database icon)
3. Click "New query" button
4. A big text editor appears
5. Open the file: supabase/schema.sql from this project
6. Select ALL the text (Ctrl+A) and COPY it (Ctrl+C)
7. Click inside the Supabase SQL editor text box
8. PASTE everything (Ctrl+V)
9. Click the green "Run" button (or press Ctrl+Enter)
10. Wait a few seconds
11. You should see: "Success. No rows returned" ✅

If you see any error: make sure you pasted the COMPLETE file from the beginning.

This creates all these automatically:
  ✅ 10 database tables (profiles, bookings, providers, payments...)
  ✅ All column types and constraints
  ✅ Row Level Security (protects user data)
  ✅ Automatic triggers (profile creation, booking ref, rating updates)
  ✅ 42 service categories pre-seeded (all Karnataka services)
  ✅ Realtime enabled for live tracking

---

## STEP 6 — Create Storage Buckets (for KYC photos)

1. In LEFT SIDEBAR, click "Storage" (bucket icon)
2. Click "New bucket" button
3. Create FIRST bucket:
   Name: avatars
   Public bucket: ✅ YES (toggle on)
   → Click "Create bucket"

4. Click "New bucket" again
5. Create SECOND bucket:
   Name: kyc-documents
   Public bucket: ❌ NO (keep off — private)
   → Click "Create bucket"

---

## STEP 7 — Create Admin User

1. In LEFT SIDEBAR, click "Authentication" (person icon)
2. Click "Users" tab
3. Click "Add user" button → "Create new user"
4. Fill in:
   Email:           admin@powerstar.in
   Password:        Admin@2025!
   Auto Confirm:    ✅ YES (toggle on)
5. Click "Create user"

6. Now click "SQL Editor" again → "New query"
7. Paste this and Run:

UPDATE profiles
SET role = 'admin', full_name = 'POWERSTAR Admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@powerstar.in');

8. You should see: "Success. 1 row affected" ✅

---

## STEP 8 — Install and Run the App

Open your terminal in the powerstar2 folder and run:

  npm install

Wait for packages to install (1–2 minutes), then:

  npm run dev

Open browser: http://localhost:5173

---

## STEP 9 — Test Your 3 Portals

Login with these demo credentials:

  👤 CUSTOMER:
     Email:    customer@demo.com
     Password: demo1234
     (Register first with this email, then it works)

  👷 PROVIDER:
     Email:    provider@demo.com
     Password: demo1234
     (Register first as Provider role)

  ⚙️ ADMIN:
     Email:    admin@powerstar.in
     Password: Admin@2025!
     (Created in Step 7 above)

On the login page there are "Quick Demo" buttons that auto-fill credentials!

---

## STEP 10 — Deploy to Vercel (Make it Live)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Add New Project" → import your GitHub repo
4. IMPORTANT: Add your environment variables in Vercel:
   Click "Environment Variables" and add:
   → VITE_SUPABASE_URL     = (your Project URL from Step 3)
   → VITE_SUPABASE_ANON_KEY = (your anon key from Step 3)
5. Click "Deploy"
6. Your site is live in 2 minutes!

---

## Troubleshooting

Problem: "Missing Supabase env vars" error in console
Fix: Check your .env file exists and has both variables filled

Problem: Login works but redirects to wrong page / blank screen
Fix: In Supabase → SQL Editor → run:
     SELECT * FROM profiles WHERE id = auth.uid();
     If empty: the trigger didn't fire. Re-run the schema.sql

Problem: "infinite recursion detected in policy"
Fix: Drop all policies and re-run the schema:
     DROP POLICY IF EXISTS "public_verified" ON providers;

Problem: KYC upload fails
Fix: Make sure you created the "kyc-documents" bucket in Step 6

Problem: Realtime not working (live tracking)
Fix: Supabase → Database → Replication → Toggle on for:
     provider_locations, bookings, notifications

---

## Project File Structure

powerstar2/
├── .env.example          ← Copy to .env, add your keys
├── .env                  ← Your secret keys (don't commit!)
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── supabase/
│   └── schema.sql        ← Run this in Supabase SQL Editor
└── src/
    ├── main.tsx           ← App entry point
    ├── App.tsx            ← Routes & auth guards
    ├── styles/
    │   └── globals.css    ← Dark/Light theme + all styles
    ├── lib/
    │   └── supabase.ts    ← Supabase client
    ├── store/
    │   ├── authStore.ts   ← User auth state
    │   └── themeStore.ts  ← Dark/Light toggle
    ├── hooks/
    │   └── useAuth.ts     ← Auth hook
    ├── services/
    │   └── authService.ts ← Login, register, profile
    ├── data/
    │   ├── karnataka.ts   ← All 31 districts + cities
    │   └── services.ts    ← All 42 service categories
    ├── components/
    │   ├── ui/            ← Avatar, Badge, StatCard, Skeleton…
    │   ├── layout/        ← Sidebar, PageHeader
    │   ├── auth/          ← (auth flows)
    │   ├── customer/      ← Home, Book, Bookings, Track, Profile
    │   ├── provider/      ← Home, Jobs, Earnings, KYC, Profile
    │   └── admin/         ← Home, Bookings, Providers, KYC, Disputes…
    └── pages/
        ├── LandingPage.tsx
        ├── AuthPage.tsx
        ├── CustomerDashboard.tsx
        ├── ProviderDashboard.tsx
        └── AdminDashboard.tsx
