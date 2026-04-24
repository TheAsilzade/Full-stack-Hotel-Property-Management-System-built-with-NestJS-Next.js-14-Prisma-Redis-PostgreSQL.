# Noblesse PMS

> The intelligence behind exceptional hospitality.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Electron](https://img.shields.io/badge/Desktop-Electron-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)

Noblesse PMS is a full-stack hotel property management system built as a TypeScript monorepo. It covers front desk operations, reservations, room rack, guests, folios, payments, e-Arsiv invoice generation, accounting ledger posting, ERP sync, housekeeping, maintenance, reports, night audit, exchange-rate management, food and beverage configuration, POS groundwork, and desktop packaging from a single platform.

The current product direction is simple:

- premium hotel operations UI
- real operational depth, not demo-only CRUD
- multi-property and role-aware workflows
- separate document, accounting, and ERP outputs from the same billing event
- bilingual UI support in English and Turkish
- web and Windows desktop delivery

---

## Public Repository Note

This public repository is maintained as a product-facing project page and architecture showcase.

- the real system evolves privately and securely
- some public folders may exist only to preserve structure and presentation
- this README is intended to describe the actual platform capabilities and architecture direction

---

## What Noblesse PMS Does

Noblesse PMS is designed to feel closer to a modern Opera-style PMS than a generic admin dashboard.

Core operational areas include:

- multi-tenant and multi-property hotel operations
- reservations with room selection, lead guest logic, age categories, and board type pricing
- luxury room rack and front desk views for arrivals, departures, and in-house control
- guest profiles with stay history and current-stay visibility
- folio management with room charges, extra charges, payments, refunds, and close controls
- e-Arsiv invoice preview and print flow
- accounting ledger generation from the same invoice event
- ERP integration with mapping, sync logs, retries, conflict awareness, and payload tracing
- housekeeping, maintenance, notifications, reports, and night audit
- food and beverage catalog management
- POS configuration groundwork for open checks, KOT routing, cashier shift rules, and transaction routing
- English and Turkish UI support
- Electron desktop packaging for Windows `.exe` distribution

---

## Product Highlights

### 1. Reservations and Stay Flow

- multi-room reservations
- multiple guests per reservation
- first selected guest becomes the lead guest
- lead guest drives invoice ownership and primary reservation identity
- board / pension type support: `BO`, `BB`, `HB`, `FB`
- age category support:
  - `+18 yas`
  - `7-12 yas`
  - `3-6 yas`
  - `0-2 yas`
- filtered room selection by real room types
- quick inline guest creation from the reservation flow
- room copy shortcut during room creation for sequential room numbers
- check-in note prompts
- unpaid folio balance protection before checkout

### 2. Front Desk and Room Rack

- arrivals, departures, in-house, and overdue checkout visibility
- premium redesigned room rack instead of a plain spreadsheet grid
- room and reservation status tagging
- current stay visibility and stay history consistency
- room status broadcasting and property-aware filtering
- multi-property switching for privileged users

### 3. Folio, Invoicing, and Accounting

- room charge and extra charge posting
- extra guest, stay extension, minibar, room service, food, beverage, laundry, transfer, service fee, and custom charges
- partial payments and payment history
- e-Arsiv invoice preview and print
- accounting invoice issuance on folio close
- tax-line generation from invoice content
- ledger entry and ledger line generation from the same issued invoice
- ERP sync queue that never blocks invoice issuance

### 4. ERP Integration

- ERP configuration management
- charge type to accounting / ERP code mapping
- payment method to ERP code mapping
- sync logs with retry
- overview metrics
- connection test
- checksum / version-based sync safety
- conflict-aware retry behavior

### 5. Food, Beverage, and POS Foundation

- property-level food and beverage catalog
- outlet definitions
- price, tax, SKU, and ERP transaction code settings
- POS configuration for:
  - open checks
  - check transfer
  - KOT requirement
  - cashier shift rules
  - service / tax split posting
  - transaction routing
  - recipe / BOM defaults

### 6. Operations and Safety

- housekeeping task flow
- maintenance ticket flow
- night audit
- cash report / front cashier reporting
- admin notifications
- nightly backups
- restore-test-ready backup architecture

---

## Financial Architecture

One of the most important design decisions in Noblesse PMS is that billing is not treated as a single output.

When a folio is closed:

1. the guest-facing invoice is issued
2. the existing e-Arsiv document flow stays intact
3. invoice lines are generated from folio charges
4. tax lines are generated from invoice taxes
5. a ledger entry and ledger lines are generated from the same invoice
6. ERP sync is queued separately

This means document generation, accounting posting, and ERP delivery are related, but not the same thing.

### Current Accounting Entities

- `Invoice`
- `InvoiceLine`
- `TaxLine`
- `Payment`
- `LedgerEntry`
- `LedgerLine`
- `ErpSyncLog`

### Required Financial Status Model

#### Invoice

- `DRAFT`
- `ISSUED`
- `CANCELLED`

#### LedgerEntry

- `DRAFT`
- `POSTED`
- `VOIDED`

#### ErpSyncLog

- `SKIPPED`
- `PENDING`
- `SYNCED`
- `FAILED`

### Accounting and ERP Behavior

- if ERP is disabled, an `ErpSyncLog` is created as `SKIPPED`
- if ERP is enabled, an `ErpSyncLog` is created as `PENDING`
- sync result is stored as `SYNCED` or `FAILED`
- ERP failure never rolls back invoice issuance
- failed syncs can be retried later
- conflict logs are not auto-overridden

---

## ERP Safety Model

ERP sync is treated as an integration queue, not as the source of truth.

The current architecture preserves these rules:

- checksum is stored in sync metadata
- `record_version` is evaluated during sync decisions
- unchanged payloads are skipped
- newer versions win
- same version plus different checksum becomes a conflict
- conflict rows are not auto-retried or auto-overridden
- retry worker only processes `PENDING` and `FAILED`

This allows the PMS to remain operational even if the external ERP is unavailable or inconsistent.

---

## Backup and Reliability

The backend includes a dual backup strategy for production safety.

- nightly PostgreSQL backups at `03:00`
- output stored as `.sql.gz`
- local and remote backup targets
- SHA-256 hash verification between both copies
- retention controlled from environment
- optional restore test to a dedicated test database
- admin notification on backup mismatch or restore failure

This backup flow is separate from ERP sync and separate from application-level audit logs.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js App Router | PMS web application |
| State | TanStack Query + Zustand | Server state + auth/session state |
| Styling | Tailwind CSS + custom design system | Luxury hotel UI layer |
| Backend | NestJS | Modular API and scheduled workers |
| ORM | Prisma | Schema, migrations, typed DB access |
| Database | PostgreSQL | Primary transactional database |
| Cache / Infra | Redis | Token, queue, and operational cache needs |
| Desktop | Electron | Windows desktop client packaging |
| Realtime | Socket.io | Operational live updates |
| Monorepo | Turborepo | Workspace orchestration |

---

## Architecture

```text
noblesse-pms/
├── apps/
│   ├── api/        # NestJS API
│   ├── web/        # Next.js PMS UI
│   └── desktop/    # Electron desktop shell
├── packages/
│   └── shared/     # Shared enums, DTOs, and app contracts
└── nginx/          # Reverse proxy / deployment support
```

### API Conventions

- URI versioning under `/api/v1/...`
- global response envelope:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-04-24T12:00:00.000Z"
}
```

- validation is strict:
  - `forbidNonWhitelisted: true`
  - `enableImplicitConversion: true`

This keeps frontend and backend contracts predictable and avoids silent DTO drift.

---

## Feature Areas

### Access Control and Multi-Property

- role-aware sidebar visibility
- middleware route protection by role
- active property selector for users with access to multiple hotels
- property-aware data loading across reservations, rooms, front desk, guests, and reports

### Billing and Invoice UX

- e-Arsiv invoice preview
- print-friendly invoice layout
- QR support
- exchange-rate driven invoice totals
- accounting/ERP status visibility alongside invoice preview

### Localization

- English and Turkish UI support
- language switcher in the shell
- Room Rack label intentionally preserved as `Room Rack` in Turkish
- operational pages progressively translated instead of title-only translation

### Exchange and Pricing

- fixed exchange-rate management
- property-level board pricing
- future-ready pricing structure for guest age categories and pension types

### Guest and Folio Depth

- current stay visibility
- unpaid balance signaling
- stay history reliability fixes
- inline extra guest and extension logic

---

## Desktop Delivery

Noblesse PMS can be used in two ways:

### Web

- standard browser-based deployment
- Next.js frontend + centralized API + centralized PostgreSQL/Redis

### Desktop

- Electron-packaged Windows application
- suitable for `.exe` distribution
- designed for desktop client + centralized API + centralized database
- keeps the existing PMS logic intact while delivering a native app experience for operators

Useful commands:

```bash
# web
npm run dev --workspace @Noblesse/web

# api
npm run dev --workspace @Noblesse/api

# desktop dev
npm run desktop:dev

# desktop installer build
npm run desktop:dist
```

---

## Getting Started

### Requirements

- Node.js 20+
- npm 10+
- PostgreSQL
- Redis

### Install

```bash
npm install
```

### Run the API

```bash
npm run dev --workspace @Noblesse/api
```

### Run the Web App

```bash
npm run dev --workspace @Noblesse/web
```

### Run Desktop Mode

```bash
npm run desktop:dev
```

### Build the Desktop Installer

```bash
npm run desktop:dist
```

---

## Deployment Model

The intended live model is:

- desktop clients or browser clients at the hotel
- one centralized NestJS API
- one centralized PostgreSQL database
- one centralized Redis instance

This allows:

- shared live operational state
- consistent folio, invoice, and ledger data
- centralized backups
- centralized ERP sync
- easier multi-user hotel workflows

---

## Current Direction

Noblesse PMS is being shaped toward a higher-end hospitality operations platform with:

- stronger front desk ergonomics
- more complete financial controls
- better ERP and accounting interoperability
- richer F&B and POS capabilities
- safer deployment and recovery workflows
- a more polished desktop-ready operator experience

---

## License

Proprietary. All rights reserved.

This repository is published as a product and architecture showcase. Redistribution or reuse without explicit written permission is not allowed.

---

Noblesse PMS is built for hotels that care about detail, control, and operational polish.
