# Technical Context: PSPCS Application

## Technology Stack

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.x    | React framework with App Router |
| React        | 19.x    | UI library                      |
| TypeScript   | 5.9.x   | Type-safe JavaScript            |
| Tailwind CSS | 4.x     | Utility-first CSS               |
| Bun          | Latest  | Package manager & runtime       |
| Drizzle ORM  | 0.45.x  | Database ORM (SQLite)           |
| bcryptjs     | 3.x     | Password hashing                |
| jose         | 6.x     | JWT authentication              |

## Development Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server (auto-handled by sandbox)
bun build          # Production build
bun start          # Start production server
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
bun db:generate    # Generate database migrations
bun db:migrate     # Run migrations (sandbox handles automatically)
```

## Database Schema

### Tables
- `users` - User accounts (customer, branch_owner, company_owner)
- `charging_stations` - PSPCS station locations and status
- `charging_sessions` - Individual charging sessions
- `notifications` - Email notifications for company owner

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/signup` | POST | User registration with verification |
| `/api/auth/me` | GET/POST | Get user info / Logout |
| `/api/stations` | GET/POST/PATCH | Station CRUD |
| `/api/sessions` | GET/POST/PATCH | Session management |
| `/api/subscription` | GET/POST | GCash subscription |
| `/api/notifications` | GET/PATCH | Notification management |
| `/api/users` | GET | User list (company owner) |
| `/api/seed` | POST | Load sample data |

## Key Dependencies

```json
{
  "next": "^16.1.3",
  "react": "^19.2.3",
  "drizzle-orm": "^0.45.2",
  "bcryptjs": "^3.0.3",
  "jose": "^6.2.2"
}
```

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login
│   ├── signup/page.tsx             # Signup (3-step)
│   ├── dashboard/
│   │   ├── customer/page.tsx       # Customer dashboard
│   │   ├── branch-owner/page.tsx   # Branch owner dashboard
│   │   └── company-owner/page.tsx  # Company owner dashboard
│   └── api/                        # API routes
├── components/
│   ├── DashboardShell.tsx          # Dashboard layout
│   ├── StationMap.tsx              # Map with markers
│   ├── ChargingCalculator.tsx      # Cost calculator
│   └── SubscriptionCard.tsx        # GCash subscription
├── db/
│   ├── schema.ts                   # Drizzle schema
│   ├── index.ts                    # Database client
│   └── migrations/                 # Auto-generated
└── lib/
    ├── auth.ts                     # JWT utilities
    ├── charging.ts                 # Charging logic
    └── sample-data.ts              # Sample stations
```

## Environment Variables

- `DB_URL` - Database URL (auto-provided by sandbox)
- `DB_TOKEN` - Database token (auto-provided by sandbox)
- `JWT_SECRET` - JWT signing secret (has default fallback)
