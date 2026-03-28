# System Patterns: PSPCS Application

## Architecture Overview

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
│   └── api/
│       ├── auth/login/route.ts     # Login API
│       ├── auth/signup/route.ts    # Signup API
│       ├── auth/me/route.ts        # Session + Logout
│       ├── stations/route.ts       # Station CRUD
│       ├── sessions/route.ts       # Session CRUD
│       ├── subscription/route.ts   # GCash subscription
│       ├── notifications/route.ts  # Notifications
│       ├── users/route.ts          # User list
│       └── seed/route.ts           # Sample data
├── components/
│   ├── DashboardShell.tsx          # Shared dashboard layout
│   ├── StationMap.tsx              # Map with markers
│   ├── ChargingCalculator.tsx      # Cost calculator
│   └── SubscriptionCard.tsx        # GCash subscription
├── db/
│   ├── schema.ts                   # Drizzle schema
│   ├── index.ts                    # Lazy DB client
│   └── migrations/                 # Auto-generated SQL
└── lib/
    ├── auth.ts                     # JWT utilities
    ├── api-auth.ts                 # API route auth helper
    ├── charging.ts                 # Charging calculation
    └── sample-data.ts              # Sample stations
```

## Key Design Patterns

### 1. Role-Based Access Control
Three roles with different dashboards:
- `customer` → `/dashboard/customer`
- `branch_owner` → `/dashboard/branch-owner`
- `company_owner` → `/dashboard/company-owner`

### 2. JWT Authentication
- Token stored in httpOnly cookie
- Verified in API routes via `getAuthUser()`
- 7-day expiration

### 3. Worklife Verification
Signup validates worklife answer based on role:
- Company Owner: "SUSTAINABILITY"
- Branch Owner: "ENVIRONMENT"
- Customer: any

### 4. Lazy Database
Database client uses Proxy pattern to defer initialization:
```typescript
export const db = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_target, prop) {
    const database = getDb();
    return Reflect.get(database, prop);
  },
});
```

### 5. Sound Effects
Web Audio API for UI feedback:
- Click: 800Hz sine tone (0.15s)
- Success: 523-659-784Hz ascending arpeggio
- Error: 200Hz sawtooth (0.4s)
- Calculator: 1200Hz short sine

## Styling Conventions

- Dark theme: `#0f172a` background, `#1e293b` cards
- Accent: Amber/orange gradient for solar feel
- Green for active/success states
- Glass morphism cards: `glass-card` utility class
- Animations: `slide-in`, `float`, `pulse-slow`

## File Naming

- Pages: `page.tsx` (lowercase)
- Components: PascalCase (`StationMap.tsx`)
- API routes: `route.ts`
- Utilities: camelCase (`charging.ts`)
