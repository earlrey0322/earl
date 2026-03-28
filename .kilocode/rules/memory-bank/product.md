# Product Context: PSPCS - KLEOXM 111

## Why This Exists

KLEOXM 111 manufactures the Powered Solar Piso Charging Station (PSPCS) — a solar-powered phone charging station. They need a web application that:
1. Helps customers find stations and calculate charging costs
2. Lets station owners manage their equipment
3. Gives the company visibility into their network

## User Flows

### Customer Flow
1. Visit landing page → Learn about PSPCS
2. Sign up (role: Customer, any worklife answer)
3. See map with PSPCS stations
4. Select a station → Use calculator (phone brand + battery %)
5. See cost estimate (1 peso = 5 minutes)
6. Start session → Drop coins in physical unit
7. Optional: Subscribe for ₱50/month to see all brands

### Branch Owner Flow
1. Sign up (role: Branch Owner, worklife: ENVIRONMENT)
2. Add their station with GPS coordinates
3. Place marker on map for customers to find
4. Toggle station active/inactive
5. Monitor sessions and battery levels
6. Optional: Subscribe for ₱50/month for analytics

### Company Owner Flow
1. Sign up (role: Company Owner, worklife: SUSTAINABILITY)
2. View all branch owners and customers
3. See all stations on map
4. Monitor subscription revenue
5. Receive notifications on earlrey0322@gmail.com
6. Track GCash payments (09469086926)

## UX Goals

- **Dark theme** with amber/orange accents (solar energy feel)
- **Sound effects** on interactions (click, success, error)
- **Mobile-first** responsive design
- **Clear pricing** (1 peso = 5 minutes always visible)
- **Station map** with color-coded markers (active=green, inactive=red, PSPCS=amber)

## Subscription Model

- Free: Basic features per role
- Premium: ₱50/month via GCash (09469086926 - Earl Christian Rey)
- Payment is manual: user opens GCash, pays, confirms in app
- Company owner can see all subscriber counts and estimated revenue

## Charging Specs (Display to Users)

Solar Panel → Rectifier Bridge Diode → DC → Battery → Inverter (220VAC) → Converter (12VAC) → Rectifier → 3.6VDC Rotary Output (charges all types)
