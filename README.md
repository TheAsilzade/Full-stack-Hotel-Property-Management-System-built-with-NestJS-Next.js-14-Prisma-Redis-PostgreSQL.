# Noblesse PMS

> **The intelligence behind exceptional hospitality.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-140%20passing-22C55E?style=flat-square)](./apps/api/test)

A production-grade, cloud-native **Hotel Property Management System** built as a full-stack TypeScript monorepo. Noblesse PMS covers the complete operational lifecycle of a hotel — from reservation creation to check-out, real-time room rack, folio billing, payment processing, housekeeping, maintenance, night audit, and advanced analytics — all in a single, beautifully designed platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
  - [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
  - [Property & Room Management](#property--room-management)
  - [Reservation Engine](#reservation-engine)
  - [Front Desk Dashboard](#front-desk-dashboard)
  - [Room Rack Calendar](#room-rack-calendar)
  - [Folio & Billing System](#folio--billing-system)
  - [Payment Processing](#payment-processing)
  - [Guest CRM](#guest-crm)
  - [Housekeeping Module](#housekeeping-module)
  - [Maintenance Module](#maintenance-module)
  - [Night Audit](#night-audit)
  - [Reports & Analytics](#reports--analytics)
  - [Real-Time Notifications](#real-time-notifications)
  - [Settings & Administration](#settings--administration)
- [Security](#security)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## Overview

Noblesse PMS is not a CRUD app with a hotel theme. It is a **fully implemented, enterprise-grade PMS** with the same depth of functionality found in commercial systems like Opera or Cloudbeds — but built on a modern, open, TypeScript-first stack.

**What makes it different:**

- **True multi-tenancy** — complete row-level tenant isolation via `tenant_id` on every business table, enforced at the NestJS interceptor layer before any query runs
- **Real-time everything** — Socket.io WebSocket gateway pushes room status changes, reservation events, and housekeeping updates to all connected clients instantly
- **Immutable financial records** — folios and payments are never deleted; voiding creates a compensating entry, preserving a complete audit trail
- **Double-booking prevention** — overlap detection uses a precise SQL filter (`checkIn < newCheckOut AND checkOut > newCheckIn`) enforced at the database level
- **140+ automated tests** — unit tests for rate calculation and availability algorithms, integration tests for auth flows, reservation lifecycle, and billing logic
- **Production-ready infrastructure** — multi-stage Dockerfiles, Nginx reverse proxy with SSL termination, GitHub Actions CI/CD pipeline

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | 14 | SSR, routing, React Server Components |
| **Styling** | Tailwind CSS | 3 | Utility-first, custom gold/white luxury theme |
| **State** | Zustand + TanStack Query | v5 | Global auth state + server state caching |
| **Forms** | React Hook Form + Zod | — | Type-safe, performant form handling |
| **Charts** | Recharts | — | Occupancy, revenue, ADR/RevPAR visualizations |
| **Backend** | NestJS | 10 | Modular, DI-based, decorator-driven API |
| **Language** | TypeScript | 5.x | End-to-end type safety across monorepo |
| **Database** | PostgreSQL | 16 | ACID-compliant relational data |
| **ORM** | Prisma | 5 | Type-safe queries, migrations, seeding |
| **Cache** | Redis | 7 | JWT blacklist, permission cache, rate limiting |
| **Auth** | JWT + Refresh Tokens | — | Stateless access tokens + rotating refresh tokens |
| **Real-time** | Socket.io | — | Bidirectional WebSocket events |
| **Validation** | class-validator + class-transformer | — | DTO-level validation with `forbidNonWhitelisted` |
| **API Docs** | Swagger / OpenAPI | — | Auto-generated, bearer-auth enabled |
| **Build** | Turborepo | — | Monorepo task orchestration and caching |
| **Deployment** | Docker + Nginx | — | Multi-stage builds, reverse proxy, SSL |
| **CI/CD** | GitHub Actions | — | Lint, test, build, deploy pipeline |

---

## Architecture

```
noblesse-pms/                        ← Turborepo monorepo root
├── apps/
│   ├── api/                         ← NestJS REST API (port 3001)
│   │   ├── src/
│   │   │   ├── modules/             ← 13 feature modules
│   │   │   │   ├── auth/            ← JWT strategy, login, refresh, logout
│   │   │   │   ├── users/           ← Staff CRUD, roles, permissions
│   │   │   │   ├── tenants/         ← SaaS tenant management
│   │   │   │   ├── properties/      ← Hotel properties + floors
│   │   │   │   ├── rooms/           ← Rooms, room types, availability
│   │   │   │   ├── guests/          ← Guest CRM + stay history
│   │   │   │   ├── reservations/    ← Full reservation lifecycle
│   │   │   │   ├── folios/          ← Billing, charges, payments
│   │   │   │   ├── housekeeping/    ← Task management
│   │   │   │   ├── maintenance/     ← Ticket system
│   │   │   │   ├── reports/         ← Analytics + dashboard stats
│   │   │   │   ├── notifications/   ← In-app notification system
│   │   │   │   └── night-audit/     ← End-of-day closing workflow
│   │   │   ├── common/
│   │   │   │   ├── guards/          ← JwtAuthGuard, PermissionsGuard
│   │   │   │   ├── interceptors/    ← TenantInterceptor, TransformInterceptor
│   │   │   │   ├── filters/         ← HttpExceptionFilter
│   │   │   │   └── decorators/      ← @CurrentUser, @RequirePermissions, @Public
│   │   │   ├── prisma/              ← PrismaService (singleton)
│   │   │   ├── redis/               ← RedisService (ioredis)
│   │   │   ├── jobs/                ← Background job processors
│   │   │   └── websocket/           ← Socket.io gateway
│   │   └── prisma/
│   │       ├── schema.prisma        ← 25+ table schema
│   │       ├── seed.ts              ← Demo data seeder
│   │       └── migrations/          ← Versioned SQL migrations
│   └── web/                         ← Next.js 14 frontend (port 3000)
│       └── src/
│           ├── app/                 ← App Router pages (30+ routes)
│           │   ├── (auth)/          ← Login page
│           │   └── (dashboard)/     ← All protected pages
│           ├── components/          ← Reusable UI components
│           ├── lib/
│           │   ├── api/             ← Typed API client modules
│           │   └── hooks/           ← Custom React hooks
│           └── store/               ← Zustand auth store
├── packages/
│   └── shared/                      ← Shared TypeScript types/enums
├── nginx/nginx.conf                 ← Production reverse proxy config
├── docker-compose.yml               ← Development stack
├── docker-compose.prod.yml          ← Production stack
└── .github/workflows/deploy.yml     ← CI/CD pipeline
```

**Request flow:**

```
Browser → Nginx (SSL) → Next.js (SSR) → NestJS API
                                              ↓
                                    TenantInterceptor (inject tenantId)
                                              ↓
                                    JwtAuthGuard (verify + blacklist check)
                                              ↓
                                    PermissionsGuard (RBAC)
                                              ↓
                                    Controller → Service → Prisma → PostgreSQL
                                              ↓
                                    TransformInterceptor (wrap response)
```

---

## Features

### Authentication & Multi-Tenancy

The auth system is built for a true SaaS environment where multiple hotel companies (tenants) share the same infrastructure with complete data isolation.

**JWT flow:**
- Login returns a short-lived **access token** (15 min) and a long-lived **refresh token** (7 days)
- Refresh tokens are stored in the database and rotated on every use (old token revoked, new token issued)
- Logout blacklists the access token's JTI in Redis so it cannot be reused even within its validity window
- Permission strings are cached in Redis after login (`permissions:{userId}`) to avoid repeated DB lookups on every request

**Multi-tenancy:**
- Every business table has a `tenant_id` column
- The `TenantInterceptor` extracts `tenantId` from the JWT payload and attaches it to the request before any controller runs
- Every service method filters by `tenantId` — a user from Tenant A can never read or modify Tenant B's data, even with a valid JWT

**RBAC:**
- 10 built-in roles: Super Admin, Tenant Admin, Property Manager, Front Desk Manager, Receptionist, Night Auditor, Revenue Manager, Accountant, Housekeeping Supervisor, Housekeeper, Maintenance Supervisor, Maintenance Technician, Report Viewer
- Permissions are fine-grained strings (`reservations.create`, `folios.void`, `reports.view`, etc.)
- `@RequirePermissions()` decorator + `PermissionsGuard` enforces access on every endpoint

### Property & Room Management

- Create and manage multiple **properties** (hotels) under a single tenant
- Each property has **floors**, **room types**, and **rooms**
- Room types define: name, code, base rate, max occupancy, amenities list, image URLs, active status
- Rooms have: number, floor, bed configuration, status (CLEAN / DIRTY / OUT_OF_ORDER / OUT_OF_SERVICE / OCCUPIED)
- Room status transitions are tracked and broadcast via WebSocket in real time
- The Settings > Property tab supports a **multi-property selector** — switching properties resets the form and loads the correct room types for that property

### Reservation Engine

The reservation engine is the core of the system and handles the full lifecycle:

**Creation:**
- Multi-room reservations — a single reservation can include multiple rooms with individual rates
- Guest assignment — multiple guests per reservation, with one marked as primary
- Confirmation number generation with `LUM-` prefix and collision retry logic
- `totalAmount` is computed as the sum of `totalRate` across all reservation rooms
- Date validation: `checkOut` must be strictly after `checkIn`
- **Double-booking prevention**: overlap filter `checkIn < newCheckOut AND checkOut > newCheckIn` checked per room before creation

**Lifecycle states:**
```
TENTATIVE → CONFIRMED → CHECKED_IN → CHECKED_OUT
                    ↘ CANCELLED
                    ↘ NO_SHOW
```

**Check-in:**
- Validates reservation is in CONFIRMED state
- Transitions reservation to CHECKED_IN
- Updates all assigned rooms to OCCUPIED status
- All state changes happen inside a single `$transaction` for atomicity

**Check-out:**
- Validates reservation is in CHECKED_IN state
- Transitions reservation to CHECKED_OUT
- Updates all rooms to DIRTY status (triggers housekeeping workflow)
- Executed atomically via `$transaction`

**Cancellation:**
- Validates reservation is not already CANCELLED or CHECKED_OUT
- CHECKED_IN reservations cannot be cancelled (must check out first)

### Front Desk Dashboard

The front desk page is the operational nerve center of the hotel:

- **Today's arrivals** — all reservations with today's check-in date, with one-click check-in
- **Today's departures** — all CHECKED_IN reservations with today's check-out date, with one-click check-out
- **Currently in-house** — all guests currently occupying rooms
- **Room status grid** — visual overview of all rooms with live status badges
- Real-time updates via WebSocket — when a room status changes anywhere in the system, the front desk view updates instantly without a page refresh

### Room Rack Calendar

The room rack is a **visual timeline** showing all reservations across all rooms for a date range:

- Horizontal axis: dates (scrollable)
- Vertical axis: rooms grouped by floor and room type
- Each reservation renders as a colored bar spanning its check-in to check-out dates
- Color coding by reservation status (CONFIRMED = blue, CHECKED_IN = green, TENTATIVE = yellow)
- Click a reservation bar to navigate directly to the reservation detail page
- Supports multi-week views with horizontal scrolling
- Room status indicators (OUT_OF_ORDER, OUT_OF_SERVICE) shown inline on the rack

### Folio & Billing System

The folio system implements **immutable financial records** — the same principle used by enterprise accounting systems:

**Folio structure:**
- Each reservation has one or more folios
- A folio contains **line items** (charges) and **payments**
- Balance = total charges − total payments
- Folios can be OPEN or CLOSED

**Charges:**
- Categories: ROOM, FOOD_BEVERAGE, SPA, LAUNDRY, TRANSPORT, MISC
- Each item has: description, quantity, unit price, tax amount, total
- Items are never deleted — voiding creates a negative compensating entry with a `voidedAt` timestamp

**Payments:**
- Recorded against a folio with: amount, method, reference number, notes
- Payments are also immutable — voiding creates a compensating negative payment
- `computeBalance()` sums all non-voided items and payments to produce the current balance

**Folio closing:**
- A folio can only be closed when balance ≤ 0 (fully paid or overpaid)
- Closing records the settlement method and timestamp

### Payment Processing

The payment module supports the full range of payment methods used in hospitality:

- **CASH** — physical cash payments
- **CREDIT_CARD** — card-present transactions
- **DEBIT_CARD** — debit card payments
- **BANK_TRANSFER** — wire transfers for corporate accounts
- **CHECK** — cheque payments
- **ONLINE** — online payment gateway receipts
- **CRYPTO** — cryptocurrency payments
- **OTHER** — catch-all for custom methods

Each payment records: amount, method, reference number, notes, timestamp, and the staff member who recorded it. All payments are linked to a folio and contribute to the balance calculation. Voided payments are preserved in the ledger with a `voidedAt` marker.

### Guest CRM

- Full guest profiles: first name, last name, email, phone, date of birth, gender, nationality, ID type + number, address, country, VIP status, preferences, notes
- **Stay history** — every reservation a guest has made is linked and queryable
- Guest search by name, email, or phone across the guest list
- Guest detail page shows profile + complete stay history with reservation statuses
- New guest creation with full form validation
- Guest profiles are shared across reservations — the same guest record is reused, not duplicated

### Housekeeping Module

- **Task creation** — tasks are created automatically when a room is checked out (status → DIRTY), or manually by supervisors
- Task types: CHECKOUT_CLEANING, STAYOVER_CLEANING, TURNDOWN, DEEP_CLEANING, INSPECTION, SPECIAL_REQUEST
- **Task lifecycle**: PENDING → IN_PROGRESS → COMPLETED → VERIFIED (or SKIPPED with reason)
- Priority levels: LOW, MEDIUM, HIGH, URGENT
- Assignment to specific housekeepers
- Notes and completion notes on each task
- Today's task view filtered by property
- Filter tabs by status (All, Pending, In Progress, Completed)
- Real-time status updates broadcast via WebSocket

### Maintenance Module

- **Ticket system** for reporting and tracking room maintenance issues
- Ticket fields: title, description, room, priority, assigned technician, estimated resolution time
- **Priority levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Status lifecycle**: OPEN → IN_PROGRESS → RESOLVED → CLOSED (or CANCELLED)
- Rooms with open maintenance tickets can be marked OUT_OF_ORDER or OUT_OF_SERVICE
- Resolving a ticket can automatically restore the room to its previous status
- Notes and resolution notes tracked per ticket

### Night Audit

The night audit is the end-of-day closing procedure that every hotel runs:

- **Pre-audit checklist** — validates that all expected check-ins and check-outs for the day have been processed
- **Room charge posting** — posts nightly room charges to all in-house folios
- **Statistics calculation** — computes occupancy rate, ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), total revenue for the day
- **Audit log** — each night audit creates an immutable `NightAuditLog` record with the date, stats, and the staff member who ran it
- **History view** — past audit logs are displayed in reverse chronological order
- A day cannot be audited twice — the system checks for an existing audit log for the current date

### Reports & Analytics

The reports module provides real-time business intelligence:

**Occupancy Report:**
- Occupancy rate per day over a date range
- Room status breakdown (CLEAN, DIRTY, OCCUPIED, OUT_OF_ORDER, OUT_OF_SERVICE)
- Total rooms vs. occupied rooms
- Visualized as a bar chart with daily data points

**Revenue Report:**
- Total revenue per day over a date range
- Breakdown by revenue category (room revenue, F&B, spa, etc.)
- ADR (Average Daily Rate) and RevPAR calculations
- Visualized as an area + line composed chart

**Dashboard Stats:**
- Today's occupancy rate
- Today's revenue
- Arrivals and departures count
- In-house guest count
- Pending housekeeping tasks
- Open maintenance tickets

**Reservation Stats:**
- Total reservations by status
- Status breakdown pie/bar chart
- Cancellation rate

All charts use Recharts with custom tooltips, gradient fills, and responsive containers.

### Real-Time Notifications

**WebSocket gateway** (Socket.io):
- Clients authenticate via JWT on connection
- Clients join property-specific rooms (`property:{propertyId}`)
- Events broadcast: `room.status_changed`, `reservation.created`, `reservation.status_changed`, `housekeeping.task_updated`, `maintenance.ticket_updated`

**In-app notification system:**
- Notification types: RESERVATION_CREATED, RESERVATION_CANCELLED, CHECK_IN, CHECK_OUT, PAYMENT_RECEIVED, HOUSEKEEPING_TASK_ASSIGNED, MAINTENANCE_TICKET_CREATED, NIGHT_AUDIT_COMPLETED, SYSTEM_ALERT
- Unread count badge on the notification bell in the header
- Mark individual notifications as read
- Mark all as read
- Delete notifications
- Notification dropdown with type icons and timestamps

### Settings & Administration

**Property Settings:**
- Edit property name, address, city, country, phone, email
- Timezone and currency configuration
- Multi-property selector when a tenant has more than one property
- Room type management (create, view) directly from the settings page

**User Management:**
- Invite new staff members with email + role assignment
- Edit existing users (name, email, roles, property access)
- Deactivate users
- Role-based filtering

**Sub-pages:**
- `/settings/roles` — Role and permission management
- `/settings/rates` — Rate plan configuration
- `/settings/taxes` — Tax rate management
- `/settings/audit-logs` — Immutable audit log viewer

---

## Security

Security is implemented at multiple layers, not as an afterthought:

| Layer | Implementation |
|---|---|
| **Transport** | HTTPS via Nginx SSL termination in production |
| **Helmet** | HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Strict origin whitelist, credentials allowed only for known origins |
| **Rate Limiting** | 100 requests/minute per IP via `@nestjs/throttler` + Redis store |
| **Authentication** | bcrypt (cost factor 12) for passwords; JWT (15min) + rotating refresh tokens (7d) |
| **Token Blacklist** | Logout blacklists JTI in Redis; every request checks the blacklist |
| **RBAC** | Permission strings enforced on every endpoint via `PermissionsGuard` |
| **Tenant Isolation** | `TenantInterceptor` injects `tenantId` from JWT; all queries filter by it |
| **Input Validation** | `ValidationPipe` with `forbidNonWhitelisted: true` — unknown properties cause 400 |
| **SQL Injection** | Prisma parameterized queries — no raw SQL with user input |
| **Immutable Financials** | Folio items and payments are never deleted; voiding creates compensating entries |
| **Audit Logs** | All significant actions logged with user, timestamp, before/after state |
| **Soft Deletes** | Sensitive records use `deletedAt` — data is never permanently lost |

---

## Testing

**140+ tests across 6 test suites**, all passing:

### Unit Tests

**Rate Calculator** (`test/unit/rate-calculator.service.spec.ts`):
- `totalAmount` aggregation across single and multiple rooms
- Zero-rate (complimentary) room handling
- Fractional rate precision
- Date validation (checkOut must be after checkIn)
- Conflict detection per room with correct overlap filter
- Confirmation number generation with `LUM-` prefix
- Retry logic on confirmation number collision
- Primary guest selection (isPrimary flag + fallback to first guest)
- Default values (adults=1, children=0, status=CONFIRMED)

**Availability Algorithm** (`test/unit/availability.service.spec.ts`):
- Available when no overlapping reservations and room is CLEAN or DIRTY
- Unavailable when overlapping reservation exists
- OUT_OF_ORDER and OUT_OF_SERVICE rooms always unavailable regardless of reservations
- Only CONFIRMED, CHECKED_IN, TENTATIVE reservations block availability (not CANCELLED/CHECKED_OUT)
- Correct date filter passed to Prisma
- Only active rooms queried

### Integration Tests

**Auth Service** (`test/integration/auth.e2e-spec.ts`):
- Login: user not found, wrong password, successful login, Redis permission caching, lastLoginAt update, token generation, refresh token storage
- Refresh: invalid JWT, token not in DB, expired token, token rotation, user no longer exists
- Logout: JTI blacklisting, refresh token revocation, permission cache clearing
- GetMe: user not found, full profile with roles and propertyIds, fullName construction

**Reservations Service** (`test/integration/reservations.e2e-spec.ts`):
- Create: date validation, conflict detection, totalAmount computation, confirmation number, defaults, status, retry on collision, primary guest selection
- FindAll: pagination, status filter, tenant isolation, default page/limit
- FindOne: not found, found
- Update: not found, field updates
- CheckIn/CheckOut: not found, wrong status, atomic $transaction transitions
- Cancel: not found, already cancelled, checked out, checked in, successful cancellation
- Availability: date validation, available/unavailable rooms, OUT_OF_ORDER/OUT_OF_SERVICE, CLEAN/DIRTY, propertyId filter, room details

**Billing** (`test/integration/billing.e2e-spec.ts`):
- Folio creation, item addition, item voiding, payment recording, payment voiding, balance computation, folio closing

```bash
# Run all tests
cd apps/api && npm test

# Run with coverage
npm run test:cov

# Run specific suite
npm test -- --testPathPattern=auth
```

---

## Project Structure

```
noblesse-pms/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── dto/login.dto.ts
│   │   │   │   │   └── strategies/jwt.strategy.ts
│   │   │   │   ├── users/
│   │   │   │   ├── tenants/
│   │   │   │   ├── properties/
│   │   │   │   ├── rooms/
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── create-room.dto.ts
│   │   │   │   │       └── create-room-type.dto.ts
│   │   │   │   ├── guests/
│   │   │   │   ├── reservations/
│   │   │   │   │   └── dto/create-reservation.dto.ts
│   │   │   │   ├── folios/
│   │   │   │   ├── housekeeping/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── reports/
│   │   │   │   ├── notifications/
│   │   │   │   └── night-audit/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── permissions.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── tenant.interceptor.ts
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── filters/http-exception.filter.ts
│   │   │   │   └── decorators/
│   │   │   │       ├── current-user.decorator.ts
│   │   │   │       ├── permissions.decorator.ts
│   │   │   │       └── public.decorator.ts
│   │   │   ├── prisma/prisma.service.ts
│   │   │   ├── redis/redis.service.ts
│   │   │   ├── websocket/websocket.gateway.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── test/
│   │       ├── unit/
│   │       │   ├── rate-calculator.service.spec.ts
│   │       │   ├── availability.service.spec.ts
│   │       │   └── folio-calculator.service.spec.ts
│   │       └── integration/
│   │           ├── auth.e2e-spec.ts
│   │           ├── reservations.e2e-spec.ts
│   │           └── billing.e2e-spec.ts
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── (auth)/login/
│           │   └── (dashboard)/
│           │       ├── dashboard/
│           │       ├── front-desk/
│           │       ├── room-rack/
│           │       ├── rooms/
│           │       ├── reservations/
│           │       │   ├── [id]/
│           │       │   │   └── folio/
│           │       │   └── new/
│           │       ├── guests/
│           │       │   ├── [id]/
│           │       │   └── new/
│           │       ├── housekeeping/
│           │       ├── maintenance/
│           │       ├── night-audit/
│           │       ├── reports/
│           │       ├── notifications/
│           │       └── settings/
│           │           ├── roles/
│           │           ├── rates/
│           │           ├── taxes/
│           │           └── audit-logs/
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Sidebar.tsx
│           │   │   └── Header.tsx
│           │   ├── common/NotificationBell.tsx
│           │   └── guests/
│           │       ├── GuestForm.tsx
│           │       ├── GuestCard.tsx
│           │       ├── GuestSearchSelect.tsx
│           │       └── GuestStayHistory.tsx
│           ├── lib/
│           │   ├── api/
│           │   │   ├── client.ts          ← Axios + interceptors + token refresh
│           │   │   ├── auth.api.ts
│           │   │   ├── rooms.api.ts
│           │   │   ├── reservations.api.ts
│           │   │   ├── guests.api.ts
│           │   │   ├── folios.api.ts
│           │   │   ├── housekeeping.api.ts
│           │   │   ├── reports.api.ts
│           │   │   ├── notifications.api.ts
│           │   │   └── users.api.ts
│           │   └── hooks/
│           │       ├── useGuests.ts
│           │       ├── useReservations.ts
│           │       ├── useRooms.ts
│           │       ├── useFrontDesk.ts
│           │       └── useWebSocket.ts
│           └── store/auth.store.ts        ← Zustand + persist
├── packages/shared/src/index.ts          ← Shared enums + DTOs
├── nginx/nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── .github/workflows/deploy.yml
```

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/noblesse-pms.git
cd noblesse-pms

# 2. Install all dependencies (monorepo)
npm install

# 3. Start infrastructure services
docker-compose up -d postgres redis

# 4. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DB and Redis connection strings

# 5. Run database migrations and seed demo data
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 6. Start all development servers
npm run dev
```

### Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | `npx prisma studio` (in apps/api) |

### Demo Credentials

```
Email:    admin@demo.com
Password: Admin123!
```

---

## API Documentation

The API is fully documented via **Swagger / OpenAPI**, auto-generated from NestJS decorators.

Access at: `http://localhost:3001/api/docs`

All endpoints require Bearer token authentication (except `/auth/login` and `/auth/refresh`). The Swagger UI includes a built-in "Authorize" button to set your JWT.

**API groups:**

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Login, refresh, logout, me |
| Users | `/api/v1/users` | Staff CRUD, password change |
| Tenants | `/api/v1/tenants` | Tenant management |
| Properties | `/api/v1/properties` | Property CRUD + floors + room types |
| Rooms | `/api/v1/rooms` | Room CRUD, status, availability |
| Guests | `/api/v1/guests` | Guest CRM + stay history |
| Reservations | `/api/v1/reservations` | Full reservation lifecycle |
| Folios | `/api/v1/folios` | Billing, charges, payments |
| Housekeeping | `/api/v1/housekeeping` | Task management |
| Maintenance | `/api/v1/maintenance` | Ticket management |
| Reports | `/api/v1/reports` | Occupancy, revenue, dashboard stats |
| Notifications | `/api/v1/notifications` | In-app notifications |
| Night Audit | `/api/v1/night-audit` | End-of-day closing |

**Response envelope:**

All responses are wrapped in a consistent envelope:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Paginated responses include:

```json
{
  "data": {
    "data": [ ... ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

## Deployment

### Docker Compose (Production)

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations in production
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

**Services in production stack:**
- `postgres` — PostgreSQL 16 with persistent volume
- `redis` — Redis 7 with persistent volume
- `api` — NestJS API (multi-stage Docker build, non-root user)
- `web` — Next.js frontend (multi-stage Docker build, standalone output)
- `nginx` — Reverse proxy with SSL termination, gzip, security headers

### GitHub Actions CI/CD

The `.github/workflows/deploy.yml` pipeline runs on every push to `main`:

1. **Lint** — ESLint across all packages
2. **Type check** — `tsc --noEmit` on API and web
3. **Test** — Full test suite with PostgreSQL and Redis service containers
4. **Build** — `npx nest build` + `next build`
5. **Docker** — Build and push images to registry
6. **Deploy** — SSH to production server, pull new images, run migrations, restart services

### Environment Variables

```bash
# apps/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/noblesse
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

---

## Database Schema

**25+ tables** with full relational integrity:

```
tenants                    ← SaaS tenant companies
users                      ← Staff accounts
roles / permissions        ← RBAC
user_roles                 ← Many-to-many
refresh_tokens             ← Rotating refresh token store

properties                 ← Hotel properties
floors                     ← Property floors
room_types                 ← Room categories (Deluxe, Suite, etc.)
rooms                      ← Individual rooms

guests                     ← Guest CRM profiles
reservations               ← Booking records
reservation_rooms          ← Rooms within a reservation (with rates)
reservation_guests         ← Guests within a reservation

folios                     ← Billing accounts per reservation
folio_items                ← Individual charges (immutable)
payments                   ← Payment records (immutable)
invoices                   ← Generated invoice records

housekeeping_tasks         ← Cleaning/inspection tasks
maintenance_tickets        ← Repair/maintenance tickets

notifications              ← In-app notification records
night_audit_logs           ← End-of-day audit records
audit_logs                 ← System-wide action audit trail
settings                   ← Tenant/property configuration
```

**Key design decisions:**
- UUID primary keys on all tables (no sequential integer IDs exposed)
- `tenant_id` on all business tables — row-level multi-tenant isolation
- `deleted_at` soft deletes on sensitive records
- Immutable financial records — void instead of delete
- Optimistic locking (`version`) on reservations and folios
- Comprehensive indexes on all foreign keys and common filter columns

---

## vs. Legacy PMS

| Capability | Legacy PMS (Opera, etc.) | Noblesse PMS |
|---|---|---|
| Architecture | On-premise / client-server | Cloud-native SaaS |
| UI | Dated, Windows-era | Modern, responsive, fast |
| Real-time updates | None / polling | WebSocket throughout |
| API | Proprietary / limited | Full REST API + Swagger |
| Multi-tenancy | Per-installation | True row-level SaaS |
| Mobile | Poor / separate app | Responsive-first web |
| Deployment | Manual, days | Docker + CI/CD, minutes |
| Reporting | Static exports | Live charts + analytics |
| Room rack | Basic grid | Interactive timeline calendar |
| Audit trail | Basic | Immutable, comprehensive |
| Test coverage | Unknown | 140+ automated tests |
| Open source | No | Yes |
| Customization | Vendor-locked | Full source access |

---

## License

Proprietary — All rights reserved.
© 2025 Noblesse PMS. Not for redistribution without explicit written permission.

---

*Noblesse PMS — Built for the hotels that care about every detail.*