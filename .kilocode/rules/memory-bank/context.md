# Active Context: PSPCS - Powered Solar Piso Charging Station

## Current State

**Project Status**: ✅ Fully built and functional

The application is a complete web app for KLEOXM 111's Powered Solar Piso Charging Station (PSPCS) — a solar-powered phone charging station business.

## Recently Completed

- [x] Complete PSPCS web application build
- [x] Role-based authentication (Customer, Branch Owner, Company Owner)
- [x] Worklife verification for account creation (SUSTAINABILITY/ENVIRONMENT)
- [x] Charging station map with active/inactive markers
- [x] Interactive Leaflet/OpenStreetMap with color-coded markers (blue=KLEOXM, yellow=premium, green border=active, red border=inactive)
- [x] Charging session calculator (battery % to cost, 1 peso = 5 min)
- [x] GCash subscription system (₱50/month to 09469086926 - Earl Christian Rey)
- [x] Email notification to earlrey0322@gmail.com on new signups
- [x] Sound effects for UI interactions
- [x] Database setup with Drizzle ORM (SQLite)
- [x] JWT-based authentication
- [x] Beautiful dark theme UI with Tailwind CSS 4
- [x] Responsive design (mobile + desktop)
- [x] Company owner auto-gets lifetime premium on signup
- [x] Admin API for premium management (/api/admin/users)
- [x] Non-premium users see limited location data (no exact coordinates)
- [x] Subscription requests API (/api/subscription-requests) - POST creates, PATCH approves/rejects
- [x] Customer dashboard subscription request UI with plan selector (1 day, 1 week, 1 month, 1 year)
- [x] Branch-owner dashboard subscription request UI with plan selector
- [x] Company owner dashboard subscription requests timeline with approve/reject buttons
- [x] Added subscription_expiry and subscription_requests table to Supabase schema
- [x] Monthly payments API (/api/monthly-payments) for branch owner/other branch
- [x] Branch owner dashboard shows monthly payment request UI (₱200/month)
- [x] Other branch role added to signup with worklife answer "DEVELOPMENT"
- [x] Company owner dashboard shows monthly payment requests with "Set Premium" button
- [x] Subscription timer display on customer/branch-owner dashboards
- [x] Revenue tracking for subscription + monthly payments only
- [x] Station add blocked until monthly payment approved
- [x] Added better error logging and handling for subscription/monthly payment requests
- [x] View-based revenue system: ₱0.20 per view when someone views/clicks a station
- [x] Station tracking API (/api/stations/view) to record views and add points (0.1 pts/view)
- [x] Redemption system (/api/redemptions) - redeem points for free charging station, parts, coin slots, or cable
- [x] Branch owner dashboard: removed charging session revenue, added view-based revenue
- [x] Redemption UI with progress bar, modal for free station/GCash options
- [x] Added views and view_revenue columns to charging_stations table in Supabase
- [x] Added redemptions table to Supabase schema
- [x] Company owner can approve/deliver free station or GCash redemption requests
- [x] Added DELETE endpoint to subscription-requests API for company owner
- [x] Added DELETE endpoint to monthly-payments API for company owner
- [x] Company owner dashboard: added delete buttons for processed requests
- [x] Company owner can manually toggle premium status for any user (Set Premium/Unset Premium)
- [x] Added unpaid users timeline for company owner dashboard
- [x] Changed from ₱0.20 revenue to 0.1 points per view
- [x] New redemption tiers: 1000pts (full station), 500pts (station parts), 100pts (3 coin slots), 50pts (charging cable)
- [x] StationMap now calls view tracking API when station is clicked
- [x] Company owner dashboard now shows redemptions for approve/reject
- [x] Simplified company owner dashboard - only Unpaid and Requests sections
- [x] Locked station feature - regular users see "Buy premium to unlock" for non-KLEOXM stations
- [x] Account Status section (Premium/Regular) added to branch owner and customer dashboards
- [x] Subscription requests show "User X wants Y subscription" format
- [x] StationMap filter buttons: All, Active, Inactive, KLEOXM 111, Other Station
- [x] Color-coded company badges: KLEOXM 111 = yellow, Other = blue
- [x] Locked station message with "Subscribe Now" link to subscription section

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/app/page.tsx` | Landing page with hero, features, specs |
| `src/app/login/page.tsx` | Login page |
| `src/app/signup/page.tsx` | 3-step signup with role selection |
| `src/app/dashboard/customer/page.tsx` | Customer dashboard |
| `src/app/dashboard/branch-owner/page.tsx` | Branch Owner dashboard |
| `src/app/dashboard/company-owner/page.tsx` | Company Owner dashboard |
| `src/app/api/auth/` | Auth API routes (login, signup, me) |
| `src/app/api/stations/route.ts` | Charging stations CRUD |
| `src/app/api/stations/view/route.ts` | Track station views and add points (0.1 pts/view) |
| `src/app/api/sessions/route.ts` | Charging sessions CRUD |
| `src/app/api/subscription/route.ts` | GCash subscription |
| `src/app/api/subscription-requests/route.ts` | Subscription request system |
| `src/app/api/monthly-payments/route.ts` | Monthly payment requests for branch owners |
| `src/app/api/redemptions/route.ts` | Points redemption (1000pts=station, 500pts=parts, 100pts=coin slots, 50pts=cable) |
| `src/app/api/notifications/route.ts` | Notification management |
| `src/app/api/users/route.ts` | User management (company owner) |
| `src/app/api/admin/users/route.ts` | Admin premium toggle API |
| `src/db/schema.ts` | Database schema (users, stations, sessions, notifications) |
| `src/db/index.ts` | Database client with lazy initialization |
| `src/lib/auth.ts` | JWT token creation/verification |
| `src/lib/charging.ts` | Charging calculation logic |
| `src/lib/sample-data.ts` | Sample station data for Metro Manila |
| `src/components/DashboardShell.tsx` | Shared dashboard layout |
| `src/components/StationMap.tsx` | Station map with Google Maps iframe & location cards |
| `src/components/LeafletMap.tsx` | (removed) Leaflet map - replaced with Google Maps |
| `src/components/ChargingCalculator.tsx` | Battery-to-cost calculator |
| `src/components/SubscriptionCard.tsx` | GCash subscription component |

## Technical Details

### PSPCS Charging Specs
- Solar Panel with Rectifier Bridge-type Diode
- DC Voltage for Battery Charging
- Inverter Output: 220VAC
- Converter Transformer: 12VAC
- Rectifier: 12VAC to DC
- Final Output: 3.6VDC Rotary (charges all types)
- Rate: 1 Peso = 5 Minutes

### GCash Payment
- Number: 09469086926
- Name: Earl Christian Rey
- Pricing: 1 Day ₱20 | 1 Week ₱50 | 1 Month ₱100 | 3 Months ₱170 | 6 Months ₱220 | 1 Year ₱300

### Account Verification
- Company Owner: Must answer "SUSTAINABILITY"
- Branch Owner: Must answer "ENVIRONMENT"
- Customer: Any answer accepted

## Current Focus

The app is complete and ready for use. All features are implemented:
1. Landing page with product info
2. 3-role authentication with worklife verification
3. Interactive station map with Google Maps
4. Charging calculator
5. GCash subscription system with GCash payment details
6. Company owner management dashboard with user/subscription management
7. Subscription request system - users can request plans, company owner approves/rejects
8. Premium access control - non-premium users see limited location data

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Session 1 | Complete PSPCS app built with all features |
| 2026-03-29 | Replaced CSS map with interactive Leaflet/OpenStreetMap, color-coded markers (blue=KLEOXM, yellow=premium, green border=active, red border=inactive) |
| 2026-03-29 | Fixed deployment crash - skip db:migrate when DB_URL/DB_TOKEN not set |
| 2026-03-29 | Rewrote map with direct Leaflet API + next/dynamic for reliable rendering |
| 2026-03-29 | Replaced Leaflet with Google Maps embedded iframe, added location field to stations |
| 2026-03-29 | Station detail panel with side-by-side layout: details left, Google Maps right |
| 2026-03-29 | Fixed API data transformation - store uses lat/lng/addr, frontend expects latitude/longitude/address |
| 2026-03-29 | Added file-based persistent storage (data-store.json) - accounts survive server restarts |
| 2026-03-29 | Added Supabase cloud database integration for permanent data storage |
| 2026-03-29 | Fixed build error - lazy-load Supabase client, graceful fallback to local storage |
| 2026-03-29 | Added email verification via Supabase Auth with resend confirmation option |
| 2026-03-29 | Switched to SQLite database (better-sqlite3) for simple permanent storage |
| 2026-03-29 | Replaced SQLite with pure JSON file storage for serverless compatibility |
| 2026-03-29 | Added Supabase cloud database integration (ocrddgvdjogploplbblw) with hardcoded credentials for Cloudflare deployment |
| 2026-03-29 | Company owner auto-gets lifetime premium on signup, admin API for premium toggle |
| 2026-03-29 | Subscription request system - users request plans, company owner approves/rejects |
| 2026-03-29 | Added subscription_expiry and subscription_requests tables to Supabase schema |
| 2026-03-29 | Removed SubscriptionCard from company owner dashboard (auto lifetime premium) |
| 2026-03-29 | Subscription pricing: 1 Day ₱20, 1 Week ₱50, 1 Month ₱100, 3 Months ₱170, 6 Months ₱220, 1 Year ₱300 |
| 2026-03-29 | Added contact number field to company owner add station form |
| 2026-03-29 | Updated /api/users to read from Supabase (was using old globalThis._u) |
| 2026-03-29 | Fixed branch owner dashboard stats to show only My Stations + Active Stations |
| 2026-03-29 | Changed "Approve" button to "Set Premium" for monthly payments |
| 2026-03-29 | Added better error logging to subscription-requests and monthly-payments API routes |
| 2026-03-29 | Improved error handling in customer, branch owner, and company owner dashboards |
| 2026-03-29 | View-based revenue: ₱0.20 per station view, redemption at ₱100 (free station or GCash) |
| 2026-03-29 | Removed charging session revenue from branch owner, added views/viewRevenue to stations |
| 2026-03-29 | Added redemptions table and API for handling revenue redemption requests |
| 2026-03-30 | Added DELETE endpoints for subscription requests and monthly payments |
| 2026-03-30 | Company owner can delete processed requests and manually toggle user premium status |
| 2026-03-30 | Added unpaid users timeline showing branch owners/other branches who haven't paid |
| 2026-03-30 | Changed view system from ₱0.20 revenue to 0.1 points per view |
| 2026-03-30 | New redemption tiers: 1000pts (full station), 500pts (parts), 100pts (coin slots), 50pts (cable) |
| 2026-03-30 | Premium toggle changed to Set Premium / Unset Premium single button |
| 2026-03-30 | Added view tracking call to StationMap when station is clicked |
| 2026-03-30 | Added redemptions section to company owner dashboard for processing |
| 2026-03-30 | Simplified company owner dashboard - removed separate user tables, kept only Unpaid and Requests sections |
| 2026-03-30 | Added locked station feature - regular users see "Buy premium to unlock" when clicking non-KLEOXM stations |
| 2026-03-30 | Added Account Status section to branch owner and customer dashboards showing Premium/Regular |
| 2026-03-30 | Subscription requests now show "User X wants Y subscription" format for company owner |
| 2026-03-30 | Updated StationMap with filter buttons: All, Active, Inactive, KLEOXM 111, Other Station |
| 2026-03-30 | Color-coded company badges: KLEOXM 111 = yellow, Other = blue |
| 2026-03-30 | StationMap now handles locked station display internally with "Subscribe Now" link |
