# Noblesse PMS — AI Coding Agent Implementation Tasks

> **Format:** Each task is atomic, executable by an AI coding agent  
> **Order:** Tasks are sequenced — complete in order  
> **Convention:** Each task references files affected and acceptance criteria

---

## TASK GROUP 1: Project Foundation

---

### TASK 001: Initialize Monorepo Structure

**Goal:** Create the base monorepo with apps/api and apps/web directories.

**Files to Create:**
- `package.json` (root, with workspaces)
- `apps/api/` (NestJS app)
- `apps/web/` (Next.js app)
- `packages/shared/` (shared TypeScript types)
- `.gitignore`
- `.eslintrc.js`
- `.prettierrc`
- `turbo.json` (Turborepo config)

**Commands:**
```bash
npx create-turbo@latest Noblesse-pms
cd Noblesse-pms
# Set up apps/api with NestJS
cd apps && npx @nestjs/cli new api --package-manager npm
# Set up apps/web with Next.js
npx create-next-app@latest web --typescript --tailwind --app --src-dir
```

**Acceptance Criteria:**
- `npm run dev` starts both apps
- TypeScript compiles without errors
- ESLint passes on empty projects
- Shared types package importable from both apps

---

### TASK 002: Configure NestJS Backend

**Goal:** Set up NestJS with all required dependencies and base configuration.

**Files Affected:**
- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/.env.example`
- `apps/api/tsconfig.json`

**Dependencies to Install:**
```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger
npm install passport passport-jwt bcrypt
npm install @prisma/client prisma
npm install ioredis bullmq @nestjs/bull
npm install class-validator class-transformer
npm install helmet compression
npm install winston nest-winston
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install nodemailer mjml
npm install date-fns
npm install -D @types/bcrypt @types/passport-jwt @types/nodemailer
```

**Acceptance Criteria:**
- NestJS app starts on port 3001
- Swagger UI accessible at `/api/docs`
- Health check endpoint at `/api/health` returns 200
- Environment variables loaded from `.env`

---

### TASK 003: Configure Next.js Frontend

**Goal:** Set up Next.js with Tailwind, shadcn/ui, and all required dependencies.

**Files Affected:**
- `apps/web/package.json`
- `apps/web/tailwind.config.ts`
- `apps/web/src/app/globals.css`
- `apps/web/next.config.ts`
- `apps/web/components.json` (shadcn config)

**Commands:**
```bash
cd apps/web
npx shadcn-ui@latest init
# Install shadcn components
npx shadcn-ui@latest add button input select dialog sheet badge card table tabs toast tooltip dropdown-menu calendar popover separator alert-dialog
```

**Dependencies to Install:**
```bash
npm install @tanstack/react-query @tanstack/react-table
npm install zustand
npm install react-hook-form @hookform/resolvers zod
npm install axios
npm install socket.io-client
npm install recharts
npm install date-fns
npm install lucide-react
npm install sonner
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install clsx tailwind-merge
npm install tailwindcss-animate
```

**Acceptance Criteria:**
- Next.js app starts on port 3000
- Tailwind CSS working with custom gold theme
- shadcn/ui components render correctly
- No TypeScript errors

---

### TASK 004: Set Up PostgreSQL + Prisma

**Goal:** Initialize Prisma with the complete database schema.

**Files to Create:**
- `apps/api/prisma/schema.prisma` (full schema from DATABASE_SCHEMA.md)
- `apps/api/prisma/migrations/` (initial migration)
- `apps/api/prisma/seed.ts` (seed data)
- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/prisma.service.ts`

**Commands:**
```bash
cd apps/api
npx prisma init
# After writing schema:
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

**Seed Data:**
- Default permissions (all resource.action combinations)
- Default system roles (TENANT_ADMIN, PROPERTY_MANAGER, RECEPTIONIST, etc.)
- Role-permission mappings

**Acceptance Criteria:**
- All tables created in PostgreSQL
- Prisma client generated without errors
- Seed runs successfully
- PrismaService injectable in NestJS modules
- `prisma.$transaction()` works correctly

**Test Cases:**
```typescript
// Test: PrismaService connects to database
const tenant = await prisma.tenant.create({ data: { name: 'Test', slug: 'test', email: 'test@test.com' } });
expect(tenant.id).toBeDefined();

// Test: Soft delete works
await prisma.tenant.update({ where: { id: tenant.id }, data: { deletedAt: new Date() } });
const found = await prisma.tenant.findFirst({ where: { id: tenant.id, deletedAt: null } });
expect(found).toBeNull();
```

---

### TASK 005: Set Up Redis Service

**Goal:** Create Redis service for caching, sessions, and job queues.

**Files to Create:**
- `apps/api/src/redis/redis.module.ts`
- `apps/api/src/redis/redis.service.ts`

**Implementation:**
```typescript
// redis.service.ts
@Injectable()
export class RedisService {
  private client: Redis;
  
  async get(key: string): Promise<string | null>
  async set(key: string, value: string, ttlSeconds?: number): Promise<void>
  async del(key: string): Promise<void>
  async exists(key: string): Promise<boolean>
  async incr(key: string): Promise<number>
  async expire(key: string, seconds: number): Promise<void>
}
```

**Acceptance Criteria:**
- Redis connects on startup
- get/set/del operations work
- TTL expiry works
- Connection error handled gracefully (app still starts)

---

### TASK 006: Set Up Docker Compose

**Goal:** Create Docker Compose for local development environment.

**Files to Create:**
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `nginx/nginx.conf`

**Services:**
- PostgreSQL 16
- Redis 7
- API (NestJS)
- Web (Next.js)
- Nginx (production only)

**Acceptance Criteria:**
- `docker-compose up` starts all services
- API connects to PostgreSQL and Redis
- Web connects to API
- Volumes persist data between restarts

---

## TASK GROUP 2: Authentication & Authorization

---

### TASK 007: Implement Authentication Module

**Goal:** Complete JWT authentication with register, login, refresh, logout.

**Files to Create:**
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts`
- `apps/api/src/modules/auth/dto/login.dto.ts`
- `apps/api/src/modules/auth/dto/register.dto.ts`
- `apps/api/src/modules/auth/dto/refresh-token.dto.ts`
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/common/decorators/public.decorator.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`

**Key Logic:**
- Password hashed with bcrypt (cost 12)
- Access token: 15 min expiry
- Refresh token: 7 days, stored in Redis
- Refresh token rotation on every use
- Blacklist tokens on logout (Redis)
- Failed login tracking (5 attempts → 15 min lockout)

**Acceptance Criteria:**
- POST /api/v1/auth/register creates tenant + admin user
- POST /api/v1/auth/login returns access + refresh tokens
- POST /api/v1/auth/refresh rotates tokens
- POST /api/v1/auth/logout blacklists token
- Protected routes return 401 without token
- Locked account returns 403 with lockout message

**Test Cases:**
```typescript
// Test: Register creates tenant and user
// Test: Login with correct credentials returns tokens
// Test: Login with wrong password returns 401
// Test: Login 5 times with wrong password locks account
// Test: Refresh token rotates correctly
// Test: Logout blacklists token (subsequent requests fail)
// Test: Expired access token returns 401
```

---

### TASK 008: Implement Multi-Tenant Middleware

**Goal:** Inject tenant context into every authenticated request.

**Files to Create:**
- `apps/api/src/common/interceptors/tenant.interceptor.ts`
- `apps/api/src/common/guards/tenant.guard.ts`
- `apps/api/src/common/decorators/current-tenant.decorator.ts`

**Key Logic:**
- Extract tenant from JWT payload
- Load tenant from Redis cache (5 min TTL) or database
- Validate tenant is ACTIVE (not SUSPENDED)
- Inject `request.tenant` and `request.tenantId`
- All subsequent service calls use `tenantId` from context

**Acceptance Criteria:**
- Every authenticated request has `request.tenantId`
- Suspended tenant returns 403
- Tenant data cached in Redis
- Cache invalidated when tenant updated

**Test Cases:**
```typescript
// Test: Request with valid token has tenantId injected
// Test: Request for suspended tenant returns 403
// Test: Tenant data loaded from cache on second request
// Test: User from tenant A cannot access tenant B data
```

---

### TASK 009: Implement RBAC Permission System

**Goal:** Role-based access control with permission guards.

**Files to Create:**
- `apps/api/src/common/guards/permissions.guard.ts`
- `apps/api/src/common/decorators/permissions.decorator.ts`
- `apps/api/src/modules/roles/roles.module.ts`
- `apps/api/src/modules/roles/roles.controller.ts`
- `apps/api/src/modules/roles/roles.service.ts`

**Key Logic:**
- Permissions stored as `resource.action` strings
- User permissions = union of all role permissions
- Permissions cached in Redis with user data
- `@Permissions('reservations.create')` decorator on controllers
- PermissionsGuard checks user.permissions array

**Acceptance Criteria:**
- User with `reservations.create` permission can create reservations
- User without permission gets 403
- Super admin bypasses all permission checks
- Permission cache invalidated when roles change
- GET /api/v1/roles returns all roles with permissions
- GET /api/v1/permissions returns all available permissions

---

### TASK 010: Implement User Management

**Goal:** Complete CRUD for staff users.

**Files to Create:**
- `apps/api/src/modules/users/users.module.ts`
- `apps/api/src/modules/users/users.controller.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/users/dto/create-user.dto.ts`
- `apps/api/src/modules/users/dto/update-user.dto.ts`

**Acceptance Criteria:**
- GET /api/v1/users returns paginated user list (tenant-scoped)
- POST /api/v1/users creates user with INVITED status
- PATCH /api/v1/users/:id updates user
- DELETE /api/v1/users/:id soft-deletes user
- User cannot delete themselves
- Tenant admin cannot delete other tenant admins

---

## TASK GROUP 3: Frontend Auth

---

### TASK 011: Build Login Page

**Goal:** Complete login page with form validation and API integration.

**Files to Create:**
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/lib/api/auth.api.ts`
- `apps/web/src/lib/stores/auth.store.ts`
- `apps/web/src/lib/api/client.ts`

**UI Requirements:**
- Noblesse logo + tagline
- Hotel subdomain input (remembered in localStorage)
- Email + password inputs
- Show/hide password toggle
- Forgot password link
- Gold "Sign In" button
- Loading state during submission
- Error messages below fields
- Link to register page

**Acceptance Criteria:**
- Form validates before submission (Zod schema)
- Successful login stores tokens and redirects to /dashboard
- Failed login shows error message
- Loading spinner shown during API call
- Subdomain remembered between sessions
- Enter key submits form

---

### TASK 012: Build Register Hotel Page

**Goal:** Multi-step hotel registration wizard.

**Files to Create:**
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/components/auth/RegisterWizard.tsx`
- `apps/web/src/components/auth/Step1HotelInfo.tsx`
- `apps/web/src/components/auth/Step2AdminAccount.tsx`
- `apps/web/src/components/auth/Step3Confirmation.tsx`

**Acceptance Criteria:**
- 3-step wizard with progress indicator
- Step 1: hotel name, type, country, timezone, currency
- Step 2: admin name, email, password, phone
- Step 3: summary + terms checkbox + submit
- Back button works without losing data
- Subdomain auto-generated from hotel name
- Password strength indicator
- Successful registration redirects to dashboard

---

### TASK 013: Build AppShell Layout

**Goal:** Main application shell with sidebar and topbar.

**Files to Create:**
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/layout/Topbar.tsx`
- `apps/web/src/lib/stores/ui.store.ts`
- `apps/web/src/middleware.ts`

**Acceptance Criteria:**
- Sidebar shows navigation items based on permissions
- Active route highlighted in sidebar
- Sidebar collapses to icon-only mode
- Topbar shows property selector, search, notifications, user menu
- User menu has logout option
- Unauthenticated users redirected to /login
- Responsive: sidebar hidden on mobile (bottom nav instead)

---

## TASK GROUP 4: Property & Room Management

---

### TASK 014: Implement Property Module (Backend)

**Goal:** Complete property CRUD with all settings.

**Files to Create:**
- `apps/api/src/modules/properties/properties.module.ts`
- `apps/api/src/modules/properties/properties.controller.ts`
- `apps/api/src/modules/properties/properties.service.ts`
- `apps/api/src/modules/properties/dto/create-property.dto.ts`
- `apps/api/src/modules/properties/dto/update-property.dto.ts`

**Acceptance Criteria:**
- All CRUD operations work with tenant isolation
- Property stats included in GET /properties/:id response
- Soft delete works
- Audit log created for all mutations

---

### TASK 015: Implement Room Type & Room Module (Backend)

**Goal:** Complete room type and room management.

**Files to Create:**
- `apps/api/src/modules/rooms/rooms.module.ts`
- `apps/api/src/modules/rooms/rooms.controller.ts`
- `apps/api/src/modules/rooms/rooms.service.ts`
- `apps/api/src/modules/rooms/room-types.controller.ts`
- `apps/api/src/modules/rooms/room-types.service.ts`
- `apps/api/src/modules/rooms/availability.service.ts`

**Acceptance Criteria:**
- Room types CRUD with amenities array
- Rooms CRUD with floor and type assignment
- Room status update endpoint
- Availability query returns correct available rooms
- Rooms with OUT_OF_ORDER status excluded from availability

---

### TASK 016: Implement Availability Algorithm

**Goal:** Core room availability engine with double-booking prevention.

**Files Affected:**
- `apps/api/src/modules/rooms/availability.service.ts`

**Algorithm:**
```typescript
// 1. Get all rooms of requested type
// 2. Find rooms with conflicting reservations (date overlap)
// 3. Exclude OUT_OF_ORDER and MAINTENANCE rooms
// 4. Return available rooms with rates
// 5. Advisory lock during reservation creation
```

**Acceptance Criteria:**
- Correctly identifies available rooms for date range
- Excludes rooms with overlapping confirmed/checked-in reservations
- Excludes cancelled/no-show reservations from conflict check
- Advisory lock prevents race condition (test with concurrent requests)
- Query executes in < 50ms for 500 rooms

**Test Cases:**
```typescript
// Test: Room with no reservations is available
// Test: Room with overlapping reservation is not available
// Test: Room with cancelled reservation IS available
// Test: Room with adjacent (non-overlapping) reservation IS available
// Test: OUT_OF_ORDER room is not available
// Test: Concurrent requests don't double-book (race condition test)
```

---

### TASK 017: Build Property & Room Management Pages (Frontend)

**Goal:** Complete UI for property and room management.

**Files to Create:**
- `apps/web/src/app/(dashboard)/settings/property/page.tsx`
- `apps/web/src/app/(dashboard)/settings/rooms/page.tsx`
- `apps/web/src/app/(dashboard)/settings/room-types/page.tsx`
- `apps/web/src/lib/api/rooms.api.ts`
- `apps/web/src/lib/hooks/useRooms.ts`
- `apps/web/src/components/rooms/RoomStatusBadge.tsx`
- `apps/web/src/components/rooms/RoomCard.tsx`

**Acceptance Criteria:**
- Property settings form saves correctly
- Room types list with create/edit/delete
- Rooms grid view with status colors
- Room status can be changed from UI
- Forms validate before submission
- Success/error toasts shown

---

## TASK GROUP 5: Guest Module

---

### TASK 018: Implement Guest Module (Backend)

**Goal:** Complete guest CRM with search and profile management.

**Files to Create:**
- `apps/api/src/modules/guests/guests.module.ts`
- `apps/api/src/modules/guests/guests.controller.ts`
- `apps/api/src/modules/guests/guests.service.ts`
- `apps/api/src/modules/guests/dto/create-guest.dto.ts`
- `apps/api/src/modules/guests/dto/update-guest.dto.ts`
- `apps/api/src/modules/guests/dto/merge-guests.dto.ts`

**Key Features:**
- Full-text search using PostgreSQL `to_tsvector`
- Guest merge (move all reservations to primary guest)
- Stay history aggregation
- VIP/blacklist flag management
- GDPR: data export and anonymization endpoints

**Acceptance Criteria:**
- Guest search returns results in < 200ms
- Search works across name, email, phone, ID number
- Guest merge moves all reservation_guests records
- Stay history shows all past reservations with totals
- GDPR export generates JSON with all guest data

---

### TASK 019: Build Guest Pages (Frontend)

**Goal:** Guest list and profile pages.

**Files to Create:**
- `apps/web/src/app/(dashboard)/guests/page.tsx`
- `apps/web/src/app/(dashboard)/guests/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/guests/new/page.tsx`
- `apps/web/src/components/guests/GuestCard.tsx`
- `apps/web/src/components/guests/GuestForm.tsx`
- `apps/web/src/components/guests/GuestStayHistory.tsx`
- `apps/web/src/components/reservations/GuestSearchSelect.tsx`
- `apps/web/src/lib/api/guests.api.ts`
- `apps/web/src/lib/hooks/useGuests.ts`

**Acceptance Criteria:**
- Guest list with search (debounced 300ms)
- Guest profile shows all info + stay history
- VIP badge shown for VIP guests
- Blacklist warning shown for blacklisted guests
- Guest create/edit form with all fields
- Nationality selector with country list
- Preferences section editable

---

## TASK GROUP 6: Reservation Engine

---

### TASK 020: Implement Reservation Module (Backend)

**Goal:** Complete reservation CRUD with all business logic.

**Files to Create:**
- `apps/api/src/modules/reservations/reservations.module.ts`
- `apps/api/src/modules/reservations/reservations.controller.ts`
- `apps/api/src/modules/reservations/reservations.service.ts`
- `apps/api/src/modules/reservations/reservation-number.service.ts`
- `apps/api/src/modules/reservations/dto/create-reservation.dto.ts`
- `apps/api/src/modules/reservations/dto/update-reservation.dto.ts`
- `apps/api/src/modules/reservations/dto/cancel-reservation.dto.ts`
- `apps/api/src/modules/reservations/dto/walk-in.dto.ts`

**Key Logic:**
- Reservation creation in database transaction
- Advisory lock per room during creation
- Folio auto-created with room charges
- Reservation number: `LUM-{YEAR}-{SEQUENCE}`
- Status machine enforcement
- Cancellation fee calculation based on rate plan policy

**Acceptance Criteria:**
- Reservation created with correct folio and room charges
- Double-booking prevented (concurrent test)
- Reservation number unique and sequential
- Status transitions enforced
- Cancellation calculates fee correctly
- Walk-in creates reservation + immediate check-in
- Audit log created for all mutations

**Test Cases:**
```typescript
// Test: Create reservation creates folio with room charges
// Test: Cannot create reservation for unavailable room
// Test: Concurrent reservations for same room → only one succeeds
// Test: Cannot check out without checking in first
// Test: Cancellation within free period → no fee
// Test: Cancellation after deadline → fee applied
// Test: Walk-in creates CHECKED_IN reservation
```

---

### TASK 021: Implement Check-in / Check-out Services

**Goal:** Check-in and check-out business logic.

**Files to Create:**
- `apps/api/src/modules/reservations/checkin.service.ts`
- `apps/api/src/modules/reservations/checkout.service.ts`
- `apps/api/src/modules/reservations/dto/checkin.dto.ts`
- `apps/api/src/modules/reservations/dto/checkout.dto.ts`
- `apps/api/src/modules/reservations/dto/change-room.dto.ts`

**Acceptance Criteria:**
- Check-in: reservation → CHECKED_IN, room → OCCUPIED
- Check-out: reservation → CHECKED_OUT, room → DIRTY
- Room change: old room → DIRTY, new room → OCCUPIED
- Folio adjusted on room change if rate differs
- Housekeeping task created on check-out
- WebSocket event emitted on status change

---

### TASK 022: Build Reservation List Page (Frontend)

**Goal:** Reservation list with all filters and actions.

**Files to Create:**
- `apps/web/src/app/(dashboard)/reservations/page.tsx`
- `apps/web/src/components/reservations/ReservationStatusBadge.tsx`
- `apps/web/src/lib/api/reservations.api.ts`
- `apps/web/src/lib/hooks/useReservations.ts`

**Acceptance Criteria:**
- Table shows all reservations with correct columns
- Search works across guest name, reservation number, room
- Status filter works
- Date range filter works
- Clicking row navigates to detail page
- Pagination works
- Export CSV button works

---

### TASK 023: Build Create Reservation Wizard (Frontend)

**Goal:** 4-step reservation creation form.

**Files to Create:**
- `apps/web/src/app/(dashboard)/reservations/new/page.tsx`
- `apps/web/src/components/reservations/ReservationForm.tsx`
- `apps/web/src/components/reservations/RoomTypeSelector.tsx`
- `apps/web/src/components/reservations/RateSelector.tsx`
- `apps/web/src/lib/schemas/reservation.schema.ts`

**Acceptance Criteria:**
- Step 1: Guest search/create works
- Step 2: Date picker updates availability in real-time
- Step 3: Room types show availability count and rates
- Step 4: Summary shows correct totals
- Form state preserved when navigating between steps
- Validation prevents proceeding with invalid data
- Successful creation shows toast and redirects to detail

---

### TASK 024: Build Reservation Detail Page (Frontend)

**Goal:** Full reservation detail with all actions.

**Files to Create:**
- `apps/web/src/app/(dashboard)/reservations/[id]/page.tsx`
- `apps/web/src/components/reservations/ReservationTimeline.tsx`

**Acceptance Criteria:**
- All reservation data displayed correctly
- Check-in button shown for CONFIRMED reservations
- Check-out button shown for CHECKED_IN reservations
- Edit button opens edit form
- Cancel button opens confirmation dialog
- Folio section shows charges and balance
- Activity log shows all events
- Print button generates registration card

---

### TASK 025: Build Room Rack Calendar (Frontend)

**Goal:** Visual timeline room calendar with drag-and-drop.

**Files to Create:**
- `apps/web/src/app/(dashboard)/room-rack/page.tsx`
- `apps/web/src/components/rooms/RoomCalendar.tsx`
- `apps/web/src/lib/api/room-rack.api.ts`
- `apps/web/src/lib/hooks/useRoomRack.ts`

**Acceptance Criteria:**
- Timeline shows all rooms with reservations as colored blocks
- Date navigation (prev/next week) works
- Today column highlighted
- Clicking reservation block shows detail panel
- Clicking empty cell opens new reservation form
- Color coding matches status (blue=confirmed, green=checked-in)
- Real-time updates via WebSocket
- Zoom levels: week / 2 weeks / month

---

## TASK GROUP 7: Billing & Payments

---

### TASK 026: Implement Folio Module (Backend)

**Goal:** Complete folio management with charge and discount logic.

**Files to Create:**
- `apps/api/src/modules/folios/folios.module.ts`
- `apps/api/src/modules/folios/folios.controller.ts`
- `apps/api/src/modules/folios/folios.service.ts`
- `apps/api/src/modules/folios/folio-calculator.service.ts`
- `apps/api/src/modules/folios/dto/add-folio-item.dto.ts`
- `apps/api/src/modules/folios/dto/void-folio-item.dto.ts`
- `apps/api/src/modules/folios/dto/apply-discount.dto.ts`

**Key Logic:**
- Folio totals always computed from items (never stored directly)
- Tax calculation (inclusive vs exclusive)
- Discount application (percentage vs fixed)
- Void item (soft delete with reason)
- Folio balance = total - paid amount

**Test Cases:**
```typescript
// Test: Adding item updates folio total
// Test: Voiding item removes from total
// Test: Tax calculated correctly (5% of 100 = 5)
// Test: Inclusive tax: 100 total, 5% tax → subtotal=95.24, tax=4.76
// Test: Discount reduces total correctly
// Test: Balance = total - paid
```

---

### TASK 027: Implement Payment Module (Backend)

**Goal:** Payment recording and refund processing.

**Files to Create:**
- `apps/api/src/modules/payments/payments.module.ts`
- `apps/api/src/modules/payments/payments.controller.ts`
- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/payments/dto/create-payment.dto.ts`
- `apps/api/src/modules/payments/dto/refund-payment.dto.ts`

**Acceptance Criteria:**
- Payment recorded and folio balance updated atomically
- Refund creates negative payment record
- Refund cannot exceed original payment amount
- Folio status updated to PAID when balance = 0
- Payment number generated sequentially

---

### TASK 028: Implement Invoice Module (Backend)

**Goal:** Invoice generation with PDF export.

**Files to Create:**
- `apps/api/src/modules/invoices/invoices.module.ts`
- `apps/api/src/modules/invoices/invoices.controller.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/invoices/invoice-pdf.service.ts`

**PDF Template includes:**
- Hotel logo and name
- Invoice number and date
- Guest/company billing details
- Itemized charges table
- Tax breakdown
- Total and payment status
- Hotel contact information

**Acceptance Criteria:**
- Invoice generated from folio data
- PDF renders correctly with hotel branding
- Invoice number unique and sequential
- Email sent via BullMQ queue (not blocking)
- PDF downloadable via GET /invoices/:id/pdf

---

### TASK 029: Build Folio & Billing Pages (Frontend)

**Goal:** Folio detail page with all billing actions.

**Files to Create:**
- `apps/web/src/app/(dashboard)/billing/[folioId]/page.tsx`
- `apps/web/src/components/billing/FolioTable.tsx`
- `apps/web/src/components/billing/PaymentModal.tsx`
- `apps/web/src/components/billing/AddChargeModal.tsx`
- `apps/web/src/components/billing/DiscountModal.tsx`
- `apps/web/src/components/billing/InvoicePreview.tsx`
- `apps/web/src/lib/api/folios.api.ts`
- `apps/web/src/lib/hooks/useFolio.ts`

**Acceptance Criteria:**
- Folio items displayed with correct amounts
- Add charge modal works with all charge types
- Void item shows confirmation dialog
- Payment modal accepts all payment methods
- Balance updates in real-time after payment
- Generate invoice button creates and downloads PDF
- Discount modal applies correctly

---

## TASK GROUP 8: Front Desk Dashboard

---

### TASK 030: Implement Front Desk Dashboard (Backend)

**Goal:** Aggregated data endpoint for front desk operations.

**Files to Create:**
- `apps/api/src/modules/reservations/front-desk.controller.ts`
- `apps/api/src/modules/reservations/front-desk.service.ts`

**Queries:**
- Today's arrivals (sorted by time, VIP first)
- Today's departures (overdue highlighted)
- In-house guests (searchable)
- Pending payments (balance > 0)
- Dirty rooms needing cleaning

**Acceptance Criteria:**
- All queries scoped to property and today's date
- Overdue check-outs identified (past checkout time)
- VIP guests flagged
- Response time < 200ms (with caching)

---

### TASK 031: Build Front Desk Dashboard (Frontend)

**Goal:** Operational front desk page with real-time updates.

**Files to Create:**
- `apps/web/src/app/(dashboard)/front-desk/page.tsx`
- `apps/web/src/lib/hooks/useFrontDesk.ts`

**Acceptance Criteria:**
- Today's arrivals list with check-in button
- Today's departures with check-out button
- Overdue departures highlighted in red
- VIP guests marked with gold star
- In-house guests searchable
- Real-time updates via WebSocket
- Quick action buttons (New Reservation, Walk-in)

---

## TASK GROUP 9: Housekeeping & Maintenance

---

### TASK 032: Implement Housekeeping Module (Backend)

**Goal:** Complete housekeeping task management.

**Files to Create:**
- `apps/api/src/modules/housekeeping/housekeeping.module.ts`
- `apps/api/src/modules/housekeeping/housekeeping.controller.ts`
- `apps/api/src/modules/housekeeping/housekeeping.service.ts`
- `apps/api/src/modules/housekeeping/housekeeping-scheduler.service.ts`

**Auto-assign Algorithm:**
```
Priority score = (arrival_urgency × 10) + (vip_bonus × 5) + (room_type_score × 2)
Sort by priority descending
Assign to housekeeper with fewest tasks on that floor
```

**Acceptance Criteria:**
- Task created automatically on checkout
- Auto-assign distributes tasks fairly
- VIP rooms get highest priority
- Task status transitions work
- Room status synced with task completion
- Housekeeping board data aggregated correctly

---

### TASK 033: Implement Maintenance Module (Backend)

**Goal:** Maintenance ticket lifecycle management.

**Files to Create:**
- `apps/api/src/modules/maintenance/maintenance.module.ts`
- `apps/api/src/modules/maintenance/maintenance.controller.ts`
- `apps/api/src/modules/maintenance/maintenance.service.ts`

**Acceptance Criteria:**
- Ticket created with room out-of-order option
- Out-of-order blocks room from availability
- Resolving ticket restores room (to CLEAN status)
- Ticket number generated sequentially
- Assignment notifications sent

---

### TASK 034: Build Housekeeping Board (Frontend)

**Goal:** Visual housekeeping management board.

**Files to Create:**
- `apps/web/src/app/(dashboard)/housekeeping/page.tsx`
- `apps/web/src/components/housekeeping/HousekeepingBoard.tsx`
- `apps/web/src/components/housekeeping/TaskCard.tsx`
- `apps/web/src/components/housekeeping/ChecklistModal.tsx`

**Acceptance Criteria:**
- Board shows rooms grouped by status
- Priority rooms (arrivals today) shown first
- VIP rooms marked
- Task assignment works
- Checklist modal shows items to complete
- Status update reflects in real-time
- Auto-assign button distributes tasks

---

## TASK GROUP 10: Reports & Dashboard

---

### TASK 035: Implement Reports Module (Backend)

**Goal:** Core reporting queries and aggregations.

**Files to Create:**
- `apps/api/src/modules/reports/reports.module.ts`
- `apps/api/src/modules/reports/reports.controller.ts`
- `apps/api/src/modules/reports/reports.service.ts`
- `apps/api/src/modules/reports/occupancy-report.service.ts`
- `apps/api/src/modules/reports/revenue-report.service.ts`
- `apps/api/src/modules/reports/daily-report.service.ts`

**Acceptance Criteria:**
- Occupancy rate calculated correctly
- ADR = Total Room Revenue / Occupied Rooms
- RevPAR = ADR × Occupancy Rate
- Reports cached in Redis (5 min TTL)
- CSV export generates correct data
- Date range filtering works

---

### TASK 036: Build Main Dashboard (Frontend)

**Goal:** KPI dashboard with charts.

**Files to Create:**
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/components/common/StatCard.tsx`
- `apps/web/src/components/charts/OccupancyChart.tsx`
- `apps/web/src/components/charts/RevenueChart.tsx`
- `apps/web/src/components/charts/SourcePieChart.tsx`
- `apps/web/src/lib/api/reports.api.ts`
- `apps/web/src/lib/hooks/useReports.ts`

**Acceptance Criteria:**
- 4 KPI stat cards with trend indicators
- Occupancy trend line chart (30 days)
- Revenue by source pie chart
- Today's summary panel
- Smart alerts panel
- All numbers in hotel's currency
- Charts use gold as primary color

---

## TASK GROUP 11: WebSocket & Real-time

---

### TASK 037: Implement WebSocket Gateway

**Goal:** Real-time updates for room status and reservations.

**Files to Create:**
- `apps/api/src/websocket/websocket.module.ts`
- `apps/api/src/websocket/websocket.gateway.ts`
- `apps/api/src/websocket/websocket.service.ts`

**Events to Emit:**
- `room:status_changed`
- `reservation:created`
- `reservation:status_changed`
- `notification:new`
- `housekeeping:task_updated`

**Acceptance Criteria:**
- Client connects with JWT auth
- Client subscribes to property room
- Events emitted when room/reservation status changes
- Disconnected clients handled gracefully
- Multiple clients receive same event

---

### TASK 038: Implement WebSocket Client (Frontend)

**Goal:** WebSocket connection with automatic query invalidation.

**Files to Create:**
- `apps/web/src/lib/hooks/useWebSocket.ts`
- `apps/web/src/lib/stores/notification.store.ts`

**Acceptance Criteria:**
- Connects on app load (if authenticated)
- Reconnects automatically on disconnect
- Room status changes invalidate rooms query
- Reservation changes invalidate reservations query
- New notifications added to notification store
- No memory leaks on unmount

---

## TASK GROUP 12: Notifications

---

### TASK 039: Implement Notification System

**Goal:** In-app notifications and email notifications.

**Files to Create:**
- `apps/api/src/modules/notifications/notifications.module.ts`
- `apps/api/src/modules/notifications/notifications.controller.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/api/src/modules/notifications/notification-events.service.ts`
- `apps/api/src/modules/mail/mail.module.ts`
- `apps/api/src/modules/mail/mail.service.ts`
- `apps/api/src/jobs/email.processor.ts`

**Notification Triggers:**
- Reservation created → confirmation email
- Check-out → invoice email
- Overdue check-out → alert to receptionist
- Dirty room for arrival → alert to housekeeping
- VIP arrival → alert to manager

**Acceptance Criteria:**
- Notifications stored in database
- WebSocket pushes new notifications to user
- Email sent via BullMQ queue
- Failed emails retried 3 times with exponential backoff
- GET /notifications returns user's notifications
- Mark as read works

---

### TASK 040: Build Notification Center (Frontend)

**Goal:** Notification bell and notification center page.

**Files to Create:**
- `apps/web/src/components/common/NotificationBell.tsx`
- `apps/web/src/app/(dashboard)/notifications/page.tsx`

**Acceptance Criteria:**
- Bell shows unread count badge
- Clicking bell shows dropdown with recent notifications
- Notification center page shows all notifications
- Mark as read works
- Click notification navigates to relevant page
- Real-time new notifications appear without refresh

---

## TASK GROUP 13: Settings & Admin

---

### TASK 041: Build Settings Pages (Frontend)

**Goal:** All settings pages for hotel configuration.

**Files to Create:**
- `apps/web/src/app/(dashboard)/settings/page.tsx`
- `apps/web/src/app/(dashboard)/settings/users/page.tsx`
- `apps/web/src/app/(dashboard)/settings/roles/page.tsx`
- `apps/web/src/app/(dashboard)/settings/rates/page.tsx`
- `apps/web/src/app/(dashboard)/settings/taxes/page.tsx`
- `apps/web/src/app/(dashboard)/settings/audit-logs/page.tsx`

**Acceptance Criteria:**
- Settings hub shows all categories
- User management: list, invite, edit, deactivate
- Role management: create custom roles, assign permissions
- Rate plans: create, edit, seasonal overrides
- Tax configuration: create, edit, apply to charge types
- Audit logs: filterable timeline of all actions

---

## TASK GROUP 14: Night Audit

---

### TASK 042: Implement Night Audit

**Goal:** End-of-day closing process.

**Files to Create:**
- `apps/api/src/modules/night-audit/night-audit.module.ts`
- `apps/api/src/modules/night-audit/night-audit.controller.ts`
- `apps/api/src/modules/night-audit/night-audit.service.ts`

**Acceptance Criteria:**
- Pre-audit checklist validation
- Room charges posted for all in-house guests
- Daily statistics calculated and stored
- Audit log created
- Idempotent (safe to re-run)
- Cannot run if already completed for date

---

## TASK GROUP 15: Security & Polish

---

### TASK 043: Security Hardening

**Goal:** Apply all security measures.

**Files Affected:**
- `apps/api/src/main.ts` (helmet, CORS, rate limiting)
- `apps/api/src/common/filters/http-exception.filter.ts`
- `apps/api/src/common/middleware/rate-limit.middleware.ts`

**Checklist:**
- [ ] Helmet.js security headers
- [ ] CORS configured for allowed origins only
- [ ] Rate limiting: 100 req/min per user
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals

---

### TASK 044: Write Core Test Suite

**Goal:** Unit and integration tests for critical modules.

**Files to Create:**
- `apps/api/test/unit/availability.service.spec.ts`
- `apps/api/test/unit/folio-calculator.service.spec.ts`
- `apps/api/test/unit/rate-calculator.service.spec.ts`
- `apps/api/test/integration/auth.e2e-spec.ts`
- `apps/api/test/integration/reservations.e2e-spec.ts`
- `apps/api/test/integration/billing.e2e-spec.ts`

**Minimum Coverage:**
- Availability algorithm: 100%
- Folio calculator: 100%
- Rate calculator: 100%
- Auth service: 90%
- Reservation service: 85%

---

### TASK 045: Performance Optimization

**Goal:** Ensure system meets performance targets.

**Optimizations:**
- Add Redis caching for availability queries (30s TTL)
- Add Redis caching for dashboard stats (60s TTL)
- Add database indexes for all common queries
- Implement pagination on all list endpoints
- Add query result limits
- Optimize N+1 queries with Prisma `include`

**Performance Targets:**
- API response time: < 200ms (p95)
- Availability query: < 50ms
- Dashboard load: < 500ms
- Report generation: < 2s

---

### TASK 046: Deploy to Production

**Goal:** Production deployment with monitoring.

**Files to Create:**
- `apps/api/Dockerfile.prod`
- `apps/web/Dockerfile.prod`
- `docker-compose.prod.yml`
- `nginx/nginx.conf`
- `.github/workflows/deploy.yml`

**Checklist:**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] Seed data applied
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Error tracking (Sentry) configured

---

## Task Summary

| Group | Tasks | Estimated Hours |
|---|---|---|
| 1. Foundation | 001–006 | 16h |
| 2. Auth & RBAC | 007–010 | 20h |
| 3. Frontend Auth | 011–013 | 16h |
| 4. Property & Rooms | 014–017 | 20h |
| 5. Guest Module | 018–019 | 16h |
| 6. Reservations | 020–025 | 32h |
| 7. Billing | 026–029 | 24h |
| 8. Front Desk | 030–031 | 12h |
| 9. Housekeeping | 032–034 | 16h |
| 10. Reports | 035–036 | 20h |
| 11. WebSocket | 037–038 | 12h |
| 12. Notifications | 039–040 | 12h |
| 13. Settings | 041 | 16h |
| 14. Night Audit | 042 | 8h |
| 15. Security & Deploy | 043–046 | 20h |
| **TOTAL** | **46 tasks** | **~260 hours** |

**At 8 hours/day solo:** ~33 working days (~7 weeks)  
**With AI coding assistance:** ~15–20 working days (~4 weeks)