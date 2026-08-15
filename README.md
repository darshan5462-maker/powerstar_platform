# POWERSTAR — Complete UI Components Package

## What's in this zip

### src/components/
- **layout/** — Sidebar, PageHeader, MobileNav (bottom tab bar for mobile)
- **ui/** — Badge, Avatar, StatCard, LiveMap (Leaflet), ProviderMap
- **customer/** — CustomerHome, CustomerBook, CustomerTrack, BookingConfirmPage
- **provider/** — ProviderHome, ActiveJobCard, ProviderProfile, ProviderKyc
- **admin/** — AdminKyc, AdminProviders

### src/hooks/
- **useProviderLocation.ts** — GPS broadcasting hook (auto-sends location to Supabase when online)

### src/styles/
- **globals.css** — Full design system (tokens, buttons, badges, animations)

### public/
- **manifest.json** — PWA manifest (installable on mobile)
- **icon-192.png, icon-512.png, icon-maskable-512.png** — App icons

### sql/ — Run in Supabase SQL Editor IN ORDER:
1. `01_location_tracking.sql` — provider_locations + customer_locations tables
2. `02_fix_bookings_rls.sql` — booking RLS policies
3. `03_fix_booking_update_rls.sql` — provider can start/complete jobs
4. `04_fix_kyc_storage.sql` — KYC storage bucket (public) + policies
5. `05_provider_services.sql` — multi-service per provider table
6. `06_enable_realtime.sql` — enable realtime on all tables
7. `07_providers_rls.sql` — provider table open read policy

## Quick setup

### 1. Copy files into your project (merge, don't replace entire src/)
### 2. Run all SQL files in Supabase SQL Editor
### 3. Add to CustomerDashboard.tsx:
```tsx
import { CustomerMobileNav } from '@/components/layout/MobileNav'
// Wrap sidebar:
<div className="desktop-only"><Sidebar .../></div>
// At bottom of return:
<CustomerMobileNav />
```
### 4. Add to ProviderDashboard.tsx:
```tsx
import { ProviderMobileNav } from '@/components/layout/MobileNav'
<div className="desktop-only"><Sidebar .../></div>
<ProviderMobileNav />
```
### 5. Add to globals.css:
```css
@media (max-width: 767px) {
  .desktop-only { display: none !important }
  .page-content { padding: 14px 14px 80px !important }
}
```
### 6. Add to ProviderHome.tsx:
```tsx
import { useProviderLocation } from '@/hooks/useProviderLocation'
// Inside component after useState lines:
useProviderLocation(profile?.id, online && kycStatus === 'verified')
```
### 7. Add Razorpay key to Vercel env:
VITE_RAZORPAY_KEY_ID=rzp_test_xxx

