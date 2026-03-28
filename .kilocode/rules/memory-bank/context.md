# Active Context: PSPCS - Powered Solar Piso Charging Station

## Current State

**Project Status**: ✅ Fully built and functional

The application is a complete web app for KLEOXM 111's Powered Solar Piso Charging Station (PSPCS) — a solar-powered phone charging station business.

## Recently Completed

- [x] Complete PSPCS web application build
- [x] Role-based authentication (Customer, Branch Owner, Company Owner)
- [x] Worklife verification for account creation (SUSTAINABILITY/ENVIRONMENT)
- [x] Charging station map with active/inactive markers
- [x] Charging session calculator (battery % to cost, 1 peso = 5 min)
- [x] GCash subscription system (₱50/month to 09469086926 - Earl Christian Rey)
- [x] Email notification to earlrey0322@gmail.com on new signups
- [x] Sound effects for UI interactions
- [x] Database setup with Drizzle ORM (SQLite)
- [x] JWT-based authentication
- [x] Beautiful dark theme UI with Tailwind CSS 4
- [x] Responsive design (mobile + desktop)

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
| `src/app/api/sessions/route.ts` | Charging sessions CRUD |
| `src/app/api/subscription/route.ts` | GCash subscription |
| `src/app/api/notifications/route.ts` | Notification management |
| `src/app/api/users/route.ts` | User management (company owner) |
| `src/app/api/seed/route.ts` | Sample data seeding |
| `src/db/schema.ts` | Database schema (users, stations, sessions, notifications) |
| `src/db/index.ts` | Database client with lazy initialization |
| `src/lib/auth.ts` | JWT token creation/verification |
| `src/lib/charging.ts` | Charging calculation logic |
| `src/lib/sample-data.ts` | Sample station data for Metro Manila |
| `src/components/DashboardShell.tsx` | Shared dashboard layout |
| `src/components/StationMap.tsx` | Interactive station map |
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
- Amount: ₱50/month

### Account Verification
- Company Owner: Must answer "SUSTAINABILITY"
- Branch Owner: Must answer "ENVIRONMENT"
- Customer: Any answer accepted

## Current Focus

The app is complete and ready for use. All features are implemented:
1. Landing page with product info
2. 3-role authentication with worklife verification
3. Interactive station map
4. Charging calculator
5. GCash subscription system
6. Company owner management dashboard

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Session 1 | Complete PSPCS app built with all features |
