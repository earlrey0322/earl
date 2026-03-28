# Project Brief: PSPCS - Powered Solar Piso Charging Station

## Purpose

A comprehensive web application for KLEOXM 111's Powered Solar Piso Charging Station (PSPCS) business. The app enables customers to find charging stations, calculate charging costs, and subscribe to premium features. It also provides management tools for station owners and the company owner.

## Target Users

- **Customers**: People who want to charge their phones at PSPCS stations
- **Branch/Station Owners**: Individuals who own PSPCS charging stations
- **Company Owners**: KLEOXM 111 management team

## Core Use Case

1. Customers find nearby PSPCS stations on a map
2. They calculate how much it costs to charge their phone (battery % to 100%)
3. Station owners manage their stations (add, activate/deactivate, monitor)
4. Company owner sees all users, stations, subscriptions, and revenue

## Key Requirements

### Must Have
- Three-role authentication (Customer, Branch Owner, Company Owner)
- Worklife verification during signup
- Charging station map with markers
- Charging calculator (1 peso = 5 minutes)
- GCash subscription (₱50/month to 09469086926)
- Email notification to earlrey0322@gmail.com on new accounts
- Sound effects for UI interactions

### Technical Specs
- Solar Panel with Rectifier Bridge-type Diode
- DC Voltage for Battery Charging
- Inverter Output: 220VAC
- Converter Transformer: 12VAC
- Final Output: 3.6VDC Rotary (charges all phone types)
- Rate: 1 Peso = 5 Minutes

### Account Verification
- Company Owner must answer "SUSTAINABILITY"
- Branch Owner must answer "ENVIRONMENT"
- Customer can answer anything

## Success Metrics

- Clean, zero-error TypeScript setup
- Passing lint and type checks
- Working authentication flow
- Functional charging calculator
- Subscription system with GCash integration

## Constraints

- Framework: Next.js 16 + React 19 + Tailwind CSS 4
- Database: SQLite with Drizzle ORM
- Package manager: Bun
- GCash payment: 09469086926 (Earl Christian Rey)
- Company email: earlrey0322@gmail.com
