# Noblesse PMS — Complete Hotel Automation SaaS Architecture

> **Version:** 1.0.0  
> **Date:** April 2026  
> **Classification:** Full-Stack Architecture Document  
> **Status:** Implementation-Ready

---

## A. PRODUCT VISION

### Vision Statement

Noblesse PMS is a next-generation, cloud-native hotel property management system designed for the modern hospitality industry. It replaces fragmented, legacy PMS tools with a unified, intelligent, and beautifully designed SaaS platform that empowers hotel staff to work faster, smarter, and with greater confidence.

Unlike traditional PMS systems that were built for desktop environments and retrofitted for the web, Noblesse is designed from the ground up as a web-first, API-first, multi-tenant SaaS platform. It combines the operational depth of enterprise hotel software with the UX quality of modern SaaS products.

### Core Philosophy

1. **Speed over complexity** — Every workflow should be completable in fewer clicks than traditional PMS systems.
2. **Intelligence over manual work** — Automation and AI suggestions reduce repetitive staff tasks.
3. **Clarity over information overload** — Dashboards show what matters, not everything.
4. **Reliability over features** — Core operations (reservations, check-in, billing) must be bulletproof.
5. **Scalability from day one** — Architecture supports single boutique hotels and 500-property chains equally.

### Target Market

- Boutique hotels (10–100 rooms)
- Apart-hotels and serviced apartments
- Hostels and budget hotels
- Mid-scale hotels (100–300 rooms)
- Small resort properties
- Multi-property hotel groups
- Hotel management companies

### Key Differentiators vs. Legacy PMS

| Feature | Legacy PMS (Elektra-style) | Noblesse PMS |
|---|---|---|
| Architecture | Desktop/server-based | Cloud-native SaaS |
| UI/UX | Dated, complex | Modern, clean, fast |
| Multi-tenancy | Per-installation | True SaaS multi-tenant |
| AI features | None | Built-in AI layer |
| Mobile | Poor/none | Responsive-first |
| API | Limited/proprietary | Full REST API |
| Onboarding | Days/weeks | Hours |
| Updates | Manual installation | Continuous deployment |
| Reporting | Static reports | Live analytics |
| Room rack | Grid-only | Interactive timeline |

---

## B. PRODUCT NAME SUGGESTIONS

### Primary Name: **Noblesse PMS**

**Rationale:** "Noblesse" evokes light, clarity, and excellence — qualities that align with the luxury hotel market and the product's clean white/gold aesthetic. It is memorable, professional, and internationally pronounceable.

**Tagline:** *"The intelligence behind exceptional hospitality."*

### Alternative Names

1. **Aurum PMS** — From Latin "aurum" (gold). Directly references the gold theme. Premium, short, memorable.
2. **Velara** — Invented word combining "velvet" and "ara" (altar). Luxury, soft, hospitality-focused.
3. **Stayflow** — Functional, SaaS-style name. Communicates the core workflow. Easy to remember.
4. **Harbr** — Modern SaaS-style name (like Flickr, Tumblr). Short, tech-forward, hospitality-adjacent.
5. **Crestline PMS** — Professional, enterprise-grade feel. Suggests peak performance and reliability.

**Selected for this document:** **Noblesse PMS**

---

## C. RECOMMENDED TECH STACK

### Stack Decision Summary

After evaluating the requirements — multi-tenant SaaS, real-time updates, complex relational data, enterprise-grade security, and a premium UI — the following stack is recommended:

### Frontend

| Technology | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR for initial load speed, RSC for performance, excellent DX, Vercel-ready |
| Language | **TypeScript** | Type safety across the full stack, better DX, fewer runtime errors |
| Styling | **Tailwind CSS v3** | Utility-first, consistent design tokens, fast iteration |
| Component Library | **shadcn/ui** | Unstyled, accessible, customizable — perfect for custom gold/white theme |
| State Management | **Zustand** | Lightweight, simple, no boilerplate for global UI state |
| Server State | **TanStack Query v5** | Caching, background refetch, optimistic updates for reservation data |
| Forms | **React Hook Form + Zod** | Performance, validation, TypeScript integration |
| Charts | **Recharts** | React-native, customizable, good for hotel analytics |
| Date Handling | **date-fns** | Lightweight, tree-shakeable, no moment.js bloat |
| Drag & Drop | **@dnd-kit/core** | Modern, accessible, performant for room rack |
| Real-time | **Socket.io-client** | WebSocket for live room status updates |
| Icons | **Lucide React** | Clean, consistent, tree-shakeable |
| PDF Generation | **@react-pdf/renderer** | Client-side invoice/report PDF generation |
| Table | **TanStack Table v8** | Headless, powerful, works with shadcn/ui |

### Backend

| Technology | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Stable, widely supported, excellent ecosystem |
| Framework | **NestJS** | Modular, TypeScript-native, enterprise patterns, DI container |
| Language | **TypeScript** | Shared types with frontend via shared package |
| ORM | **Prisma** | Type-safe queries, excellent migrations, great DX |
| Database | **PostgreSQL 16** | ACID compliance, JSON support, excellent for relational hotel data |
| Cache | **Redis 7** | Session cache, rate limiting, background job queues |
| Queue | **BullMQ** | Redis-backed job queue for emails, reports, notifications |
| Auth | **JWT + Refresh Tokens** | Stateless, scalable, with Redis blacklist for logout |
| Validation | **Zod + class-validator** | DTO validation in NestJS pipes |
| Real-time | **Socket.io** | WebSocket for room rack live updates |
| File Storage | **S3-compatible (MinIO/AWS S3)** | Guest documents, maintenance photos |
| Email | **Nodemailer + MJML** | Transactional emails with beautiful templates |
| Logging | **Winston + Pino** | Structured logging, log levels, audit trail |
| Testing | **Jest + Supertest** | Unit and integration tests |

### Infrastructure

| Technology | Choice | Reason |
|---|---|---|
| Containerization | **Docker + Docker Compose** | Consistent environments, easy deployment |
| Reverse Proxy | **Nginx** | SSL termination, load balancing |
| CI/CD | **GitHub Actions** | Automated testing and deployment |
| Monitoring | **Prometheus + Grafana** | Metrics and alerting |
| Secrets | **Environment variables + Vault** | Secure configuration management |

### API Style: REST (not GraphQL)

**Reasoning:** Hotel PMS operations are CRUD-heavy with well-defined resource boundaries. REST is simpler to implement, easier to cache, better for rate limiting, and more familiar to hotel software integrators. GraphQL adds complexity without significant benefit for this use case. REST with proper versioning (`/api/v1/`) is the right choice.

### Why NestJS over Express?

NestJS provides:
- Built-in dependency injection (critical for multi-module hotel system)
- Decorators for guards, interceptors, pipes (clean auth/permission code)
- Module system that maps perfectly to hotel PMS modules
- Built-in Swagger/OpenAPI documentation
- Better testability with DI
- TypeScript-first design

Express would require building all of this manually, leading to inconsistent patterns across a large codebase.

---

## D. SYSTEM MODULES

### Module Map

```
Noblesse PMS
├── Core Platform
│   ├── Authentication & Authorization
│   ├── Multi-Tenant Management
│   ├── User & Role Management
│   └── Audit & Compliance
│
├── Property Operations
│   ├── Property Management
│   ├── Room & Room Type Management
│   ├── Rate & Availability Management
│   └── Season & Pricing Management
│
├── Guest Operations
│   ├── Reservation Management
│   ├── Guest CRM
│   ├── Check-in / Check-out
│   └── Front Desk Dashboard
│
├── Financial Operations
│   ├── Folio & Billing
│   ├── Payment Processing
│   ├── Invoice Management
│   └── End-of-Day Closing
│
├── Housekeeping & Maintenance
│   ├── Housekeeping Management
│   ├── Maintenance Tickets
│   └── Room Status Management
│
├── Analytics & Reporting
│   ├── Operational Reports
│   ├── Financial Reports
│   ├── Forecast & Analytics
│   └── Dashboard KPIs
│
├── Communication
│   ├── Email Templates
│   ├── Notification Center
│   └── Internal Messaging
│
├── AI & Automation
│   ├── Smart Alerts
│   ├── AI Command Bar
│   ├── Dynamic Pricing Engine
│   └── Automated Reports
│
└── Administration
    ├── System Settings
    ├── Integration Management
    └── Super Admin Panel
```

### Module Descriptions

**1. Authentication & Authorization**
Handles all identity and access management. Supports multi-tenant login, JWT-based sessions, refresh token rotation, role-based access control (RBAC), and department-level permissions. Includes audit logging for all auth events.

**2. Multi-Tenant Management**
Each hotel company is a "tenant." Tenants own properties, users, and all data. Complete data isolation at the database level using tenant_id foreign keys on all tables. Subscription management placeholder for billing integration.

**3. Property Management**
Manages hotel properties, floors, building configurations, amenities, policies (check-in time, check-out time, cancellation), and property-level settings. Supports multi-property groups under one tenant.

**4. Room & Room Type Management**
Defines room types (Standard, Deluxe, Suite, etc.) with amenities, capacity, and base rates. Individual rooms are linked to types, floors, and properties. Supports hostel bed-level management.

**5. Rate & Availability Management**
Complex pricing engine supporting multiple rate plans, seasonal rates, occupancy-based pricing, restrictions (min stay, stop-sell, CTA/CTD), and manual overrides. Channel manager integration placeholder.

**6. Reservation Management**
Core reservation engine with full lifecycle management. Handles individual, group, corporate, agency, and walk-in reservations. Tracks source/channel, guest counts, room assignments, deposits, and status transitions.

**7. Guest CRM**
Comprehensive guest profiles with identity information, stay history, preferences, loyalty scoring, VIP/blacklist flags, and GDPR-compliant data handling. Supports duplicate detection and merging.

**8. Check-in / Check-out**
Streamlined check-in and check-out workflows. Handles pre-check-in, identity verification, digital registration cards, room key assignment placeholder, folio review, and invoice generation.

**9. Front Desk Dashboard**
Real-time operational dashboard showing today's arrivals, departures, in-house guests, pending payments, dirty rooms, and VIP alerts. Quick action panel for common tasks.

**10. Folio & Billing**
Guest folio management with room charges, extra services, taxes, discounts, and payment tracking. Supports split folios, multiple payment methods, partial payments, and refunds.

**11. Payment Processing**
Records and tracks all payment transactions. Supports cash, card, bank transfer, and online payment methods. Handles deposits, outstanding balances, and end-of-day reconciliation.

**12. Invoice Management**
Generates proforma and final invoices. Supports company billing for corporate reservations. PDF export with hotel branding.

**13. Housekeeping Management**
Room cleaning workflow with status tracking (dirty/clean/inspected/out-of-order). Task assignment to housekeepers, cleaning checklists, priority queues for arriving guests, and lost-and-found tracking.

**14. Maintenance Tickets**
Maintenance request lifecycle from creation to resolution. Room out-of-service blocking, technician assignment, priority levels, and maintenance history per room.

**15. Analytics & Reporting**
Comprehensive reporting suite covering occupancy, ADR, RevPAR, revenue analysis, source analysis, cancellation reports, housekeeping reports, and financial summaries. Live dashboard charts and CSV/PDF export.

**16. Communication**
Email template management for booking confirmations, check-in reminders, and payment requests. Internal notification center for staff alerts. SMS integration placeholder.

**17. AI & Automation**
AI-powered features including natural language command bar, smart room assignment, overbooking risk prediction, dynamic pricing suggestions, automated daily reports, and revenue anomaly detection.

**18. Administration**
System-wide settings, user management, role configuration, tax setup, currency management, payment method configuration, and audit log viewer.

---

## E. USER ROLES & PERMISSIONS

### Role Hierarchy

```
Super Admin (Noblesse Platform)
└── Tenant Admin (Hotel Company Owner)
    ├── Property Manager
    │   ├── Front Desk Manager
    │   │   ├── Receptionist
    │   │   └── Night Auditor
    │   ├── Housekeeping Supervisor
    │   │   └── Housekeeper
    │   ├── Maintenance Supervisor
    │   │   └── Maintenance Technician
    │   ├── Revenue Manager
    │   └── Accountant
    └── Read-Only / Report Viewer
```

### Role Definitions

#### Super Admin
- Platform-level access
- Manage all tenants
- View system health
- Manage subscriptions
- Access all data (for support)
- Cannot be created by tenants

#### Tenant Admin
- Full access to their tenant's data
- Create/manage properties
- Create/manage users and roles
- View all reports
- Manage billing/subscription
- Configure system settings

#### Property Manager
- Full access to assigned properties
- Cannot manage other properties
- Can manage staff for their property
- Full operational access
- View all reports for their property

#### Front Desk Manager
- All receptionist permissions
- Manage reservations (create/edit/cancel)
- Apply discounts
- Override rates
- View financial reports
- Manage housekeeping assignments

#### Receptionist
- Create/view/edit reservations
- Check-in / check-out
- View guest profiles
- Add folio charges
- Process payments
- View room rack
- Cannot delete reservations
- Cannot apply discounts > 10%
- Cannot view financial reports

#### Night Auditor
- All receptionist permissions
- Run end-of-day closing
- View financial summaries
- Cannot modify past transactions

#### Revenue Manager
- View/edit rate plans
- Manage availability restrictions
- View revenue reports
- Cannot access guest personal data
- Cannot process payments

#### Accountant
- View all financial data
- Export reports
- View invoices and payments
- Cannot modify reservations
- Cannot access guest personal data beyond billing info

#### Housekeeping Supervisor
- Assign housekeeping tasks
- View/update room status
- Manage housekeeping staff
- View housekeeping reports
- Cannot access reservations or billing

#### Housekeeper
- View assigned tasks
- Update room cleaning status
- Add notes to tasks
- Cannot view guest personal data
- Cannot access reservations

#### Maintenance Supervisor
- Create/assign maintenance tickets
- View all maintenance history
- Mark rooms out-of-order
- Cannot access reservations or billing

#### Maintenance Technician
- View assigned tickets
- Update ticket status
- Add resolution notes
- Cannot mark rooms out-of-order

#### Report Viewer
- Read-only access to reports
- Cannot modify any data
- Cannot view guest personal data

### Permission Matrix

| Permission | Super Admin | Tenant Admin | Prop Manager | Front Desk Mgr | Receptionist | Housekeeper | Accountant |
|---|---|---|---|---|---|---|---|
| reservations.create | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| reservations.edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| reservations.cancel | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| reservations.delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| checkin.process | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| checkout.process | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| billing.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| billing.edit | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| payments.process | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| payments.refund | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| rates.edit | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| rooms.manage | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| housekeeping.assign | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| housekeeping.update | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| maintenance.create | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| reports.view | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| reports.financial | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| users.manage | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| settings.manage | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| audit.view | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### Permission Implementation

Permissions are stored as strings in the format `resource.action` (e.g., `reservations.create`, `billing.refund`). Each role has a set of permissions. Users can have multiple roles. The effective permission set is the union of all role permissions.

Custom permissions can be added at the tenant level for fine-grained control.

---

## K. CORE WORKFLOWS

### Workflow 1: New Reservation (Pre-booking)

```
1. Staff opens "New Reservation" form
2. System prompts: Guest search or create new guest
3. Staff searches existing guest by name/email/phone
   → If found: select guest profile
   → If not found: create new guest inline
4. Staff selects property (if multi-property)
5. Staff selects date range (arrival/departure)
6. System queries availability in real-time
7. System shows available room types with rates
8. Staff selects room type
9. System suggests specific room (smart assignment)
10. Staff confirms or overrides room selection
11. Staff selects rate plan
12. System calculates total: room rate × nights + taxes
13. Staff enters guest count (adults/children)
14. Staff selects reservation source (direct/OTA/agency/corporate)
15. Staff adds special requests/notes
16. Staff sets deposit requirement
17. System validates: no double-booking, room available, dates valid
18. Staff confirms reservation
19. System creates reservation with status: CONFIRMED
20. System creates folio with room charges
21. System sends booking confirmation email (async)
22. System logs audit event
23. Staff sees reservation detail page
```

**Database operations (in transaction):**
- INSERT into reservations
- INSERT into reservation_rooms
- INSERT into reservation_guests
- INSERT into folios
- INSERT into folio_items (room charges)
- UPDATE room_availability cache
- INSERT into audit_logs

### Workflow 2: Walk-in Check-in

```
1. Guest arrives at front desk without reservation
2. Receptionist clicks "Walk-in" button
3. System opens walk-in form
4. Receptionist enters guest details (name, ID, contact)
5. System checks for existing guest profile
6. Receptionist selects room type and dates
7. System shows available rooms in real-time
8. Receptionist selects room
9. System shows rate (walk-in rate plan)
10. Receptionist confirms rate
11. System creates reservation with status: CHECKED_IN (direct)
12. System creates folio
13. Receptionist collects deposit/payment
14. System records payment
15. System updates room status: OCCUPIED
16. System prints/emails registration card
17. Audit log created
```

### Workflow 3: Pre-booked Guest Check-in

```
1. Guest arrives, receptionist searches by name/reservation code
2. System shows reservation details
3. Receptionist verifies guest identity
4. System shows pre-check-in checklist:
   - Identity verified ✓
   - Room assigned ✓
   - Deposit status (paid/pending)
   - Special requests review
5. If deposit pending: collect deposit
6. Receptionist confirms room assignment (or changes room)
7. System validates room is clean and ready
8. Receptionist clicks "Check In"
9. System transitions reservation: CONFIRMED → CHECKED_IN
10. System updates room status: OCCUPIED
11. System records check-in time
12. System prints registration card
13. Receptionist hands over room key
14. Audit log created
```

### Workflow 4: Room Change

```
1. Receptionist opens in-house reservation
2. Clicks "Change Room"
3. System shows available rooms of same type (or different if upgrade)
4. Receptionist selects new room
5. System checks: new room is clean, available, not blocked
6. System shows rate difference (if different room type)
7. Receptionist confirms change
8. System updates reservation_rooms: old room end date = today
9. System inserts new reservation_rooms record
10. System updates old room status: DIRTY (needs cleaning)
11. System updates new room status: OCCUPIED
12. System adjusts folio if rate changed
13. Audit log created
14. Housekeeping notified of dirty room
```

### Workflow 5: Add Extra Service to Folio

```
1. Receptionist opens guest folio
2. Clicks "Add Charge"
3. Selects service category (restaurant/spa/minibar/laundry/other)
4. Enters service description and amount
5. System applies applicable taxes
6. System adds folio_item with type: SERVICE
7. Folio total updates in real-time
8. Audit log created
```

### Workflow 6: Split Payment

```
1. Guest requests split payment at checkout
2. Receptionist opens folio
3. Clicks "Split Payment"
4. System shows total outstanding balance
5. Receptionist enters first payment amount and method
6. System records partial payment
7. Receptionist enters second payment amount and method
8. System validates: sum of payments = total balance
9. System marks folio as PAID
10. System generates invoice
11. Audit log created
```

### Workflow 7: Check-out

```
1. Receptionist searches guest or opens from "Today's Departures"
2. System shows folio summary
3. Receptionist reviews charges with guest
4. Guest confirms or disputes charges
5. If dispute: receptionist adjusts/removes charge (with permission)
6. System calculates outstanding balance
7. Receptionist processes payment
8. System marks folio: PAID
9. Receptionist clicks "Check Out"
10. System transitions reservation: CHECKED_IN → CHECKED_OUT
11. System updates room status: DIRTY
12. System records check-out time
13. System generates final invoice
14. System sends invoice email (async)
15. Housekeeping notified: room needs cleaning
16. Audit log created
```

### Workflow 8: Mark Room Dirty/Clean

```
Dirty (automatic):
- Triggered by check-out
- Triggered by room change
- Triggered by manual override

Clean (manual by housekeeper):
1. Housekeeper opens their task list
2. Selects room to clean
3. Completes cleaning checklist items
4. Marks room as "Cleaned"
5. System updates room status: CLEAN (pending inspection)

Inspected (by supervisor):
1. Supervisor opens room list
2. Selects cleaned room
3. Inspects room
4. Marks as "Inspected" / "Ready"
5. System updates room status: CLEAN_INSPECTED
6. Room now available for check-in
```

### Workflow 9: Maintenance Ticket → Room Out-of-Order

```
1. Staff creates maintenance ticket for room
2. Selects "Room Out of Service" checkbox
3. Enters issue description and priority
4. System creates maintenance_ticket
5. System updates room status: OUT_OF_ORDER
6. System blocks room from reservations
7. If room had future reservations: system alerts manager
8. Manager reassigns affected reservations
9. Maintenance technician resolves issue
10. Technician marks ticket: RESOLVED
11. Supervisor reviews and marks room: CLEAN (needs inspection)
12. After inspection: room returns to AVAILABLE
```

### Workflow 10: Daily Closing (Night Audit)

```
1. Night auditor opens "End of Day" module
2. System shows pre-closing checklist:
   - All departures processed ✓/✗
   - All arrivals processed ✓/✗
   - Outstanding payments ✓/✗
   - Open folios ✓/✗
3. Auditor reviews and resolves any open items
4. Auditor clicks "Run Night Audit"
5. System posts room charges for all in-house guests (next day's charge)
6. System calculates daily statistics
7. System generates daily manager report
8. System closes current business day
9. System opens new business date
10. Audit log created with full summary
```

### Workflow 11: Generate Daily Report

```
1. Manager opens Reports module
2. Selects "Daily Manager Report"
3. Selects date
4. System aggregates:
   - Arrivals count and names
   - Departures count
   - In-house count
   - Occupancy rate
   - Revenue (room + services)
   - ADR, RevPAR
   - No-shows
   - Cancellations
   - Outstanding payments
5. System renders report with charts
6. Manager exports PDF or emails to stakeholders
7. AI generates natural language summary (optional)
```

---

## L. ADVANCED AI/AUTOMATION FEATURES

### 1. AI Command Bar (Natural Language Interface)

A global command bar (Cmd+K / Ctrl+K) that accepts natural language queries:

**Examples:**
- "Show unpaid departures today" → Opens filtered departure list
- "Which rooms are dirty right now?" → Opens housekeeping board filtered to dirty
- "Create reservation for John Smith next Friday for 3 nights" → Opens pre-filled reservation form
- "What's our occupancy this week?" → Opens occupancy chart
- "Show VIP guests arriving tomorrow" → Filtered arrival list
- "Mark room 205 as out of order" → Opens maintenance ticket form

**Implementation:** OpenAI GPT-4o API with function calling. The AI maps natural language to predefined system actions. No free-form data modification — AI only navigates and filters, never directly modifies data without user confirmation.

### 2. Smart Room Assignment

When a reservation is created, the system suggests the optimal room based on:
- Guest preferences from past stays
- Room type requested
- Floor preference (if noted)
- Quiet/view preference
- Accessibility requirements
- Minimize room changes (assign rooms with longer availability windows)
- Balance room usage across floors

**Algorithm:** Scoring function that weights guest preferences, room characteristics, and operational efficiency.

### 3. Overbooking Risk Prediction

Analyzes historical cancellation and no-show rates by:
- Day of week
- Season
- Reservation source
- Lead time

Calculates safe overbooking threshold and alerts revenue manager when approaching risk zone.

### 4. Dynamic Pricing Suggestions

Analyzes:
- Current occupancy vs. historical average
- Upcoming events (manual input)
- Competitor rate benchmarks (manual input or integration)
- Booking pace (reservations per day vs. historical)

Suggests rate adjustments with confidence scores. Revenue manager approves or rejects suggestions.

### 5. Auto-Generated Daily Manager Summary

Every morning at 7:00 AM, the system generates a natural language summary:

> "Good morning. Today you have 12 arrivals and 8 departures. Current occupancy is 78%, up 5% from last Tuesday. Revenue forecast for today is €4,200. 3 rooms are still dirty from last night — housekeeping has been notified. 2 VIP guests are arriving: Mr. Johnson (Suite 401) and Ms. Chen (Deluxe 302). Outstanding payment of €850 from reservation #R-2847 requires attention."

### 6. Smart Alerts System

Real-time alerts triggered by business rules:

| Alert | Trigger | Recipient |
|---|---|---|
| Overdue check-out | Guest not checked out by 12:00 PM | Receptionist |
| Dirty room for arrival | Room dirty, guest arriving in 2 hours | Housekeeping supervisor |
| Payment overdue | Deposit not received 24h before arrival | Front desk manager |
| Overbooking risk | Occupancy > 95% with pending reservations | Revenue manager |
| Maintenance overdue | Ticket open > 48 hours | Maintenance supervisor |
| VIP arrival | VIP guest arriving today | Property manager |
| Revenue anomaly | Daily revenue 30% below forecast | Property manager |
| No-show pattern | Guest has 2+ no-shows in history | Receptionist (at check-in) |

### 7. Revenue Anomaly Detection

Monitors daily revenue against:
- Same day last week
- Same day last month
- 30-day rolling average
- Seasonal forecast

Alerts when deviation exceeds configurable threshold (default: 25%).

### 8. AI-Generated Guest Communication Drafts

When sending emails to guests, AI pre-fills the message based on context:
- Booking confirmation with personalized details
- Pre-arrival message with local recommendations
- Payment reminder with outstanding balance
- Post-stay thank you with loyalty points update

Staff reviews and sends — AI never sends autonomously.

### 9. Automatic Housekeeping Prioritization

Every morning, the system automatically prioritizes cleaning tasks:
1. Rooms with same-day arrivals (sorted by arrival time)
2. VIP guest rooms
3. Long-stay guest rooms (refresh)
4. Standard departures
5. Stay-over rooms (lower priority)

Assigns tasks to available housekeepers based on floor/section assignments.

### 10. Staff Workload Prediction

Analyzes upcoming arrivals/departures to predict:
- Required front desk staff per shift
- Required housekeeping staff per day
- Maintenance workload based on ticket history

Helps managers plan staffing levels in advance.

---

## M. SECURITY & COMPLIANCE

### Multi-Tenant Data Isolation

Every database table that contains tenant-specific data includes a `tenant_id` column. All queries are automatically scoped to the current tenant via a NestJS interceptor that injects `tenant_id` into every database query.

**Tenant isolation strategy:**
- Shared database, shared schema (most cost-effective for SaaS)
- Row-level security via `tenant_id` on all tables
- NestJS guard validates tenant context on every request
- No cross-tenant data access possible through API

### Authentication Security

- Passwords hashed with **bcrypt** (cost factor 12)
- JWT access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in Redis
- Refresh token rotation on every use
- Token blacklist in Redis for logout
- Failed login attempt tracking (5 attempts → 15-minute lockout)
- IP-based rate limiting on auth endpoints

### API Security

- Rate limiting: 100 requests/minute per user (Redis-backed)
- Input validation on all endpoints via Zod/class-validator
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via input sanitization
- CORS configured for allowed origins only
- Helmet.js for security headers
- Request size limits

### GDPR Compliance

- Guest personal data marked with sensitivity level
- Data export endpoint: generate ZIP of all guest data
- Data deletion endpoint: soft-delete with anonymization
- Consent tracking for marketing communications
- Data retention policies configurable per tenant
- Audit log of all data access and modifications

### Audit Logging

Every significant action is logged:
- User ID, tenant ID, timestamp
- Action type (CREATE/UPDATE/DELETE/LOGIN/etc.)
- Resource type and ID
- Before/after values (for updates)
- IP address
- User agent

Audit logs are immutable (no UPDATE/DELETE on audit_logs table).

### Soft Deletes

Sensitive records use soft deletes:
- Reservations: `deleted_at` timestamp
- Guests: `deleted_at` timestamp
- Payments: `deleted_at` timestamp (with reason)
- Users: `deleted_at` timestamp

Hard deletes only for non-sensitive configuration data.

### Backup Strategy

- PostgreSQL: daily full backup, hourly WAL archiving
- Point-in-time recovery capability
- Backups encrypted at rest
- 30-day retention
- Monthly backup verification tests

---

## Q. RISKS & TECHNICAL CHALLENGES

### Risk 1: Double-Booking Prevention
**Risk:** Two concurrent requests book the same room for overlapping dates.
**Mitigation:** Database-level constraint using PostgreSQL advisory locks during reservation creation. Unique partial index on room availability. Optimistic locking with retry logic.

### Risk 2: Multi-Tenant Data Leakage
**Risk:** Bug causes one tenant to see another tenant's data.
**Mitigation:** NestJS interceptor enforces tenant_id on all queries. Integration tests verify tenant isolation. Database-level row security as additional layer.

### Risk 3: Real-time Sync Conflicts
**Risk:** Two receptionists modify the same reservation simultaneously.
**Mitigation:** Optimistic locking with version numbers. WebSocket broadcasts changes to all connected clients. UI shows "modified by another user" warning.

### Risk 4: Night Audit Failures
**Risk:** Night audit process fails midway, leaving data in inconsistent state.
**Mitigation:** Night audit runs in a database transaction. Idempotent design — can be re-run safely. Pre-audit validation checks prevent starting with open issues.

### Risk 5: Performance at Scale
**Risk:** Room rack calendar becomes slow with many rooms and reservations.
**Mitigation:** Efficient date-range queries with proper indexes. Redis caching for availability data. Pagination for large date ranges. Virtual scrolling in UI.

### Risk 6: Complex Rate Calculations
**Risk:** Rate calculation bugs lead to incorrect billing.
**Mitigation:** Comprehensive unit tests for rate engine. Rate preview before confirmation. Audit trail of all rate calculations. Manual override with approval workflow.

### Risk 7: Email Delivery Failures
**Risk:** Booking confirmations not delivered.
**Mitigation:** BullMQ retry queue with exponential backoff. Email delivery status tracking. Fallback SMTP providers. Manual resend option in UI.

### Risk 8: Data Migration from Legacy PMS
**Risk:** Hotels migrating from legacy systems have complex data.
**Mitigation:** Import tools for common formats (CSV, Excel). Data validation before import. Rollback capability. Professional migration service offering.

---

## R. FINAL RECOMMENDED FIRST BUILD STEPS

### Week 1-2: Foundation

1. Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui
2. Initialize NestJS project with TypeScript
3. Set up PostgreSQL + Prisma with initial schema
4. Set up Redis
5. Configure Docker Compose for local development
6. Implement authentication module (register, login, JWT, refresh tokens)
7. Implement multi-tenant middleware
8. Create base UI layout (AppShell, Sidebar, Topbar)
9. Implement login page with gold/white theme

### Week 3-4: Core Data Models

10. Implement property management module
11. Implement room type and room management
12. Implement guest module (CRUD)
13. Implement user and role management
14. Create settings pages

### Week 5-6: Reservation Engine

15. Implement room availability algorithm
16. Implement reservation creation with double-booking prevention
17. Implement reservation list and detail pages
18. Implement reservation status transitions
19. Create room rack calendar (basic version)

### Week 7-8: Operations

20. Implement check-in workflow
21. Implement check-out workflow
22. Implement folio and billing
23. Implement payment recording
24. Implement front desk dashboard

### Week 9-10: Housekeeping & Maintenance

25. Implement housekeeping task management
26. Implement room status workflow
27. Implement maintenance ticket system
28. Connect housekeeping to check-out workflow

### Week 11-12: Reports & Polish

29. Implement core reports (occupancy, revenue, ADR/RevPAR)
30. Implement dashboard charts
31. Implement invoice PDF generation
32. Performance optimization
33. Security audit
34. Beta testing with real hotel

This 12-week plan delivers a fully functional MVP ready for real hotel use.