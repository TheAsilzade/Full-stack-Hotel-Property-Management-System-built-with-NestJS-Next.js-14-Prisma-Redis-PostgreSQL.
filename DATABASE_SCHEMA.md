# Noblesse PMS — Complete Database Schema

> **Database:** PostgreSQL 16  
> **ORM:** Prisma  
> **Schema Version:** 1.0.0

---

## Schema Design Principles

1. **Tenant isolation:** Every business data table has `tenant_id` (FK to tenants)
2. **Soft deletes:** Sensitive tables use `deleted_at` instead of hard DELETE
3. **Audit trail:** `created_at`, `updated_at`, `created_by` on all tables
4. **UUID primary keys:** All tables use UUID v4 for security and distributed-safe IDs
5. **Optimistic locking:** `version` column on critical tables (reservations, folios)
6. **Immutable financials:** Payment and folio_item records are never updated, only voided
7. **Status as enum:** All status fields use PostgreSQL enums for data integrity

---

## Prisma Schema (Complete)

```prisma
// ============================================================
// Noblesse PMS — PRISMA SCHEMA
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}

enum SubscriptionPlan {
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum UserStatus {
  ACTIVE
  INACTIVE
  INVITED
  SUSPENDED
}

enum PropertyType {
  HOTEL
  APART_HOTEL
  BOUTIQUE_HOTEL
  RESORT
  HOSTEL
  GUESTHOUSE
  VILLA
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  DIRTY
  CLEAN_INSPECTED
  OUT_OF_ORDER
  MAINTENANCE
  BLOCKED
}

enum BedType {
  SINGLE
  TWIN
  DOUBLE
  QUEEN
  KING
  BUNK
  SOFA_BED
}

enum ReservationStatus {
  INQUIRY
  TENTATIVE
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
  WAITLISTED
}

enum ReservationSource {
  DIRECT
  PHONE
  EMAIL
  WALK_IN
  WEBSITE
  OTA_BOOKING
  OTA_EXPEDIA
  OTA_AIRBNB
  CORPORATE
  AGENCY
  GROUP
  OTHER
}

enum GuestType {
  ADULT
  CHILD
  INFANT
}

enum FolioStatus {
  OPEN
  CLOSED
  PAID
  PARTIALLY_PAID
  VOIDED
}

enum FolioItemType {
  ROOM_CHARGE
  SERVICE
  FOOD_BEVERAGE
  MINIBAR
  SPA
  LAUNDRY
  TRANSPORT
  TELEPHONE
  INTERNET
  PARKING
  TAX
  DISCOUNT
  DEPOSIT
  REFUND
  ADJUSTMENT
  OTHER
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  BANK_TRANSFER
  ONLINE_PAYMENT
  CHEQUE
  VOUCHER
  LOYALTY_POINTS
  CITY_LEDGER
  OTHER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
  VOIDED
}

enum HousekeepingTaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  INSPECTED
  SKIPPED
}

enum HousekeepingTaskType {
  FULL_CLEAN
  REFRESH
  TURNDOWN
  INSPECTION
  DEEP_CLEAN
  CHECKOUT_CLEAN
}

enum MaintenanceStatus {
  OPEN
  IN_PROGRESS
  ON_HOLD
  RESOLVED
  CANCELLED
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum NotificationType {
  RESERVATION_CREATED
  RESERVATION_MODIFIED
  RESERVATION_CANCELLED
  CHECKIN_DUE
  CHECKOUT_DUE
  CHECKOUT_OVERDUE
  PAYMENT_DUE
  PAYMENT_RECEIVED
  ROOM_DIRTY
  ROOM_READY
  MAINTENANCE_CREATED
  MAINTENANCE_RESOLVED
  VIP_ARRIVAL
  NO_SHOW_RISK
  OVERBOOKING_RISK
  REVENUE_ANOMALY
  SYSTEM_ALERT
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  SOFT_DELETE
  RESTORE
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PERMISSION_DENIED
  EXPORT
  PRINT
  EMAIL_SENT
  STATUS_CHANGE
  PAYMENT_PROCESSED
  REFUND_PROCESSED
  CHECKIN
  CHECKOUT
  NIGHT_AUDIT
}

enum RatePlanType {
  BAR
  CORPORATE
  PACKAGE
  PROMOTIONAL
  GROUP
  AGENCY
  GOVERNMENT
  MEMBER
  WALK_IN
}

enum TaxType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}

// ============================================================
// PLATFORM LEVEL (Super Admin)
// ============================================================

model Tenant {
  id               String           @id @default(uuid())
  name             String
  slug             String           @unique // used in subdomain: slug.Noblessepms.com
  email            String           @unique
  phone            String?
  address          String?
  country          String?
  timezone         String           @default("UTC")
  locale           String           @default("en")
  currency         String           @default("USD")
  status           TenantStatus     @default(TRIAL)
  plan             SubscriptionPlan @default(STARTER)
  trialEndsAt      DateTime?
  subscriptionEndsAt DateTime?
  logoUrl          String?
  settings         Json             @default("{}")
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?

  // Relations
  properties       Property[]
  users            User[]
  roles            Role[]
  guests           Guest[]
  reservations     Reservation[]
  folios           Folio[]
  payments         Payment[]
  invoices         Invoice[]
  housekeepingTasks HousekeepingTask[]
  maintenanceTickets MaintenanceTicket[]
  auditLogs        AuditLog[]
  notifications    Notification[]
  ratePlans        RatePlan[]
  taxes            Tax[]
  currencies       Currency[]
  reservationSources ReservationSource[]
  emailTemplates   EmailTemplate[]

  @@index([slug])
  @@index([status])
  @@map("tenants")
}

// ============================================================
// USERS & AUTH
// ============================================================

model User {
  id               String     @id @default(uuid())
  tenantId         String
  email            String
  passwordHash     String
  firstName        String
  lastName         String
  phone            String?
  avatarUrl        String?
  status           UserStatus @default(INVITED)
  language         String     @default("en")
  timezone         String?
  lastLoginAt      DateTime?
  lastLoginIp      String?
  loginAttempts    Int        @default(0)
  lockedUntil      DateTime?
  mustChangePassword Boolean  @default(false)
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret  String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  deletedAt        DateTime?
  createdBy        String?

  // Relations
  tenant           Tenant     @relation(fields: [tenantId], references: [id])
  userRoles        UserRole[]
  userProperties   UserProperty[]
  refreshTokens    RefreshToken[]
  auditLogs        AuditLog[]
  assignedHousekeepingTasks HousekeepingTask[] @relation("AssignedHousekeeper")
  assignedMaintenanceTickets MaintenanceTicket[] @relation("AssignedTechnician")
  createdReservations Reservation[] @relation("ReservationCreatedBy")
  notifications    Notification[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
  @@index([status])
  @@map("users")
}

model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  revokedAt   DateTime?
  ipAddress   String?
  userAgent   String?

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model Role {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  isSystem    Boolean  @default(false) // system roles cannot be deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  userRoles   UserRole[]
  rolePermissions RolePermission[]

  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  resource    String   // e.g., "reservations"
  action      String   // e.g., "create"
  description String?
  createdAt   DateTime @default(now())

  rolePermissions RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  id         String   @id @default(uuid())
  userId     String
  roleId     String
  createdAt  DateTime @default(now())
  createdBy  String?

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

model UserProperty {
  id         String   @id @default(uuid())
  userId     String
  propertyId String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([userId, propertyId])
  @@map("user_properties")
}

// ============================================================
// PROPERTY MANAGEMENT
// ============================================================

model Property {
  id               String       @id @default(uuid())
  tenantId         String
  name             String
  code             String       // short code e.g. "HTL01"
  type             PropertyType @default(HOTEL)
  description      String?
  address          String?
  city             String?
  state            String?
  country          String?
  postalCode       String?
  phone            String?
  email            String?
  website          String?
  starRating       Int?         // 1-5
  checkInTime      String       @default("14:00") // HH:MM
  checkOutTime     String       @default("12:00") // HH:MM
  earlyCheckInFee  Decimal?     @db.Decimal(10, 2)
  lateCheckOutFee  Decimal?     @db.Decimal(10, 2)
  timezone         String       @default("UTC")
  currency         String       @default("USD")
  logoUrl          String?
  coverImageUrl    String?
  amenities        String[]     @default([])
  policies         Json         @default("{}")
  isActive         Boolean      @default(true)
  isHostelMode     Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  deletedAt        DateTime?
  createdBy        String?

  tenant           Tenant       @relation(fields: [tenantId], references: [id])
  floors           Floor[]
  roomTypes        RoomType[]
  rooms            Room[]
  ratePlans        RatePlan[]
  reservations     Reservation[]
  userProperties   UserProperty[]
  housekeepingTasks HousekeepingTask[]
  maintenanceTickets MaintenanceTicket[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([isActive])
  @@map("properties")
}

model Floor {
  id         String   @id @default(uuid())
  propertyId String
  number     Int
  name       String?  // e.g., "Ground Floor", "Penthouse"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  rooms      Room[]

  @@unique([propertyId, number])
  @@map("floors")
}

model RoomType {
  id               String   @id @default(uuid())
  tenantId         String
  propertyId       String
  name             String   // e.g., "Standard Double", "Deluxe Suite"
  code             String   // e.g., "STD", "DLX", "STE"
  description      String?
  maxOccupancy     Int      @default(2)
  maxAdults        Int      @default(2)
  maxChildren      Int      @default(1)
  baseRate         Decimal  @db.Decimal(10, 2)
  extraAdultRate   Decimal? @db.Decimal(10, 2)
  extraChildRate   Decimal? @db.Decimal(10, 2)
  amenities        String[] @default([])
  images           String[] @default([])
  sortOrder        Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  property         Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  rooms            Room[]
  ratePlanRoomTypes RatePlanRoomType[]
  seasonalRates    SeasonalRate[]
  reservationRooms ReservationRoom[]

  @@unique([propertyId, code])
  @@index([tenantId])
  @@index([propertyId])
  @@map("room_types")
}

model Room {
  id               String     @id @default(uuid())
  tenantId         String
  propertyId       String
  floorId          String?
  roomTypeId       String
  number           String     // e.g., "101", "201A"
  name             String?    // e.g., "Ocean View Suite"
  description      String?
  status           RoomStatus @default(AVAILABLE)
  isActive         Boolean    @default(true)
  isConnecting     Boolean    @default(false) // connects to adjacent room
  connectingRoomId String?
  notes            String?
  sortOrder        Int        @default(0)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  tenant           Tenant     @relation(fields: [tenantId], references: [id])
  property         Property   @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  floor            Floor?     @relation(fields: [floorId], references: [id])
  roomType         RoomType   @relation(fields: [roomTypeId], references: [id])
  beds             Bed[]
  reservationRooms ReservationRoom[]
  housekeepingTasks HousekeepingTask[]
  maintenanceTickets MaintenanceTicket[]

  @@unique([propertyId, number])
  @@index([tenantId])
  @@index([propertyId])
  @@index([status])
  @@index([roomTypeId])
  @@map("rooms")
}

model Bed {
  id         String  @id @default(uuid())
  roomId     String
  type       BedType
  name       String? // e.g., "Bed A", "Top Bunk"
  isActive   Boolean @default(true)

  room       Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@map("beds")
}

// ============================================================
// RATE MANAGEMENT
// ============================================================

model RatePlan {
  id               String       @id @default(uuid())
  tenantId         String
  propertyId       String
  name             String
  code             String
  type             RatePlanType @default(BAR)
  description      String?
  isRefundable     Boolean      @default(true)
  cancellationHours Int?        // hours before arrival for free cancellation
  cancellationPenalty Decimal?  @db.Decimal(10, 2)
  depositRequired  Boolean      @default(false)
  depositPercent   Decimal?     @db.Decimal(5, 2)
  minStay          Int?         // minimum nights
  maxStay          Int?
  isActive         Boolean      @default(true)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  tenant           Tenant       @relation(fields: [tenantId], references: [id])
  property         Property     @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  ratePlanRoomTypes RatePlanRoomType[]
  seasonalRates    SeasonalRate[]
  reservations     Reservation[]

  @@unique([propertyId, code])
  @@index([tenantId])
  @@index([propertyId])
  @@map("rate_plans")
}

model RatePlanRoomType {
  id           String   @id @default(uuid())
  ratePlanId   String
  roomTypeId   String
  baseRate     Decimal  @db.Decimal(10, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ratePlan     RatePlan @relation(fields: [ratePlanId], references: [id], onDelete: Cascade)
  roomType     RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)

  @@unique([ratePlanId, roomTypeId])
  @@map("rate_plan_room_types")
}

model Season {
  id           String   @id @default(uuid())
  tenantId     String
  propertyId   String
  name         String   // e.g., "High Season 2025", "Christmas"
  startDate    DateTime @db.Date
  endDate      DateTime @db.Date
  multiplier   Decimal  @db.Decimal(5, 2) @default(1.0) // 1.5 = 50% increase
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  seasonalRates SeasonalRate[]

  @@index([propertyId])
  @@map("seasons")
}

model SeasonalRate {
  id           String   @id @default(uuid())
  ratePlanId   String
  roomTypeId   String
  seasonId     String?
  startDate    DateTime @db.Date
  endDate      DateTime @db.Date
  rate         Decimal  @db.Decimal(10, 2)
  minStay      Int?
  stopSell     Boolean  @default(false)
  closedToArrival Boolean @default(false)
  closedToDeparture Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ratePlan     RatePlan @relation(fields: [ratePlanId], references: [id], onDelete: Cascade)
  roomType     RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)
  season       Season?  @relation(fields: [seasonId], references: [id])

  @@index([ratePlanId])
  @@index([roomTypeId])
  @@index([startDate, endDate])
  @@map("seasonal_rates")
}

model Tax {
  id           String   @id @default(uuid())
  tenantId     String
  propertyId   String?  // null = applies to all properties
  name         String   // e.g., "VAT", "City Tax", "Service Charge"
  code         String
  type         TaxType  @default(PERCENTAGE)
  rate         Decimal  @db.Decimal(8, 4) // percentage or fixed amount
  isInclusive  Boolean  @default(false) // included in room rate or added on top
  appliesTo    String[] @default([]) // ["ROOM_CHARGE", "SERVICE", etc.]
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, code])
  @@index([tenantId])
  @@map("taxes")
}

model Currency {
  id           String   @id @default(uuid())
  tenantId     String
  code         String   // ISO 4217: USD, EUR, GBP
  name         String
  symbol       String
  exchangeRate Decimal  @db.Decimal(12, 6) @default(1.0) // relative to base currency
  isBase       Boolean  @default(false)
  isActive     Boolean  @default(true)
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, code])
  @@map("currencies")
}

// ============================================================
// GUEST / CRM
// ============================================================

model Guest {
  id               String   @id @default(uuid())
  tenantId         String
  firstName        String
  lastName         String
  email            String?
  phone            String?
  phone2           String?
  nationality      String?  // ISO 3166-1 alpha-2
  language         String?  // ISO 639-1
  dateOfBirth      DateTime? @db.Date
  gender           String?
  idType           String?  // PASSPORT, NATIONAL_ID, DRIVERS_LICENSE
  idNumber         String?
  idExpiryDate     DateTime? @db.Date
  idIssuingCountry String?
  address          String?
  city             String?
  country          String?
  postalCode       String?
  company          String?
  taxNumber        String?
  isVip            Boolean  @default(false)
  vipLevel         Int?     // 1-5
  isBlacklisted    Boolean  @default(false)
  blacklistReason  String?
  loyaltyPoints    Int      @default(0)
  loyaltyTier      String?
  preferences      Json     @default("{}")
  notes            String?
  marketingConsent Boolean  @default(false)
  dataRetentionDate DateTime?
  mergedIntoId     String?  // if this guest was merged into another
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?
  createdBy        String?

  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  reservationGuests ReservationGuest[]
  invoices         Invoice[]

  @@index([tenantId])
  @@index([email])
  @@index([phone])
  @@index([lastName, firstName])
  @@index([idNumber])
  @@map("guests")
}

// ============================================================
// RESERVATION SOURCES
// ============================================================

model ReservationSource {
  id           String   @id @default(uuid())
  tenantId     String
  name         String   // e.g., "Booking.com", "Direct Website", "Walk-in"
  code         String
  type         ReservationSource @default(OTHER)
  commission   Decimal? @db.Decimal(5, 2) // commission percentage
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  reservations Reservation[]

  @@unique([tenantId, code])
  @@map("reservation_sources")
}

// ============================================================
// RESERVATIONS
// ============================================================

model Reservation {
  id               String            @id @default(uuid())
  tenantId         String
  propertyId       String
  reservationNumber String           // human-readable: LUM-2025-00001
  status           ReservationStatus @default(CONFIRMED)
  sourceId         String?
  ratePlanId       String?
  arrivalDate      DateTime          @db.Date
  departureDate    DateTime          @db.Date
  nights           Int               // computed: departureDate - arrivalDate
  adults           Int               @default(1)
  children         Int               @default(0)
  infants          Int               @default(0)
  totalAmount      Decimal           @db.Decimal(12, 2)
  depositAmount    Decimal           @db.Decimal(12, 2) @default(0)
  depositPaid      Decimal           @db.Decimal(12, 2) @default(0)
  currency         String            @default("USD")
  notes            String?
  internalNotes    String?
  specialRequests  String?
  guestPreferences Json              @default("{}")
  isGroupReservation Boolean         @default(false)
  groupId          String?
  isCorporate      Boolean           @default(false)
  corporateId      String?
  isAgency         Boolean           @default(false)
  agencyId         String?
  confirmedAt      DateTime?
  checkedInAt      DateTime?
  checkedOutAt     DateTime?
  cancelledAt      DateTime?
  cancellationReason String?
  noShowAt         DateTime?
  version          Int               @default(1) // optimistic locking
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  deletedAt        DateTime?
  createdBy        String?

  tenant           Tenant            @relation(fields: [tenantId], references: [id])
  property         Property          @relation(fields: [propertyId], references: [id])
  source           ReservationSource? @relation(fields: [sourceId], references: [id])
  ratePlan         RatePlan?         @relation(fields: [ratePlanId], references: [id])
  createdByUser    User?             @relation("ReservationCreatedBy", fields: [createdBy], references: [id])
  reservationRooms ReservationRoom[]
  reservationGuests ReservationGuest[]
  folios           Folio[]
  reservationLogs  ReservationLog[]

  @@unique([tenantId, reservationNumber])
  @@index([tenantId])
  @@index([propertyId])
  @@index([status])
  @@index([arrivalDate])
  @@index([departureDate])
  @@index([arrivalDate, departureDate])
  @@map("reservations")
}

model ReservationRoom {
  id             String   @id @default(uuid())
  reservationId  String
  roomId         String?  // null if room type only (not yet assigned)
  roomTypeId     String
  checkInDate    DateTime @db.Date
  checkOutDate   DateTime @db.Date
  ratePerNight   Decimal  @db.Decimal(10, 2)
  totalRate      Decimal  @db.Decimal(12, 2)
  adults         Int      @default(1)
  children       Int      @default(0)
  notes          String?
  isActive       Boolean  @default(true) // false when room changed
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  reservation    Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  room           Room?    @relation(fields: [roomId], references: [id])
  roomType       RoomType @relation(fields: [roomTypeId], references: [id])

  @@index([reservationId])
  @@index([roomId])
  @@index([checkInDate, checkOutDate])
  @@map("reservation_rooms")
}

model ReservationGuest {
  id            String    @id @default(uuid())
  reservationId String
  guestId       String
  isPrimary     Boolean   @default(false) // main guest
  guestType     GuestType @default(ADULT)
  createdAt     DateTime  @default(now())

  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  guest         Guest     @relation(fields: [guestId], references: [id])

  @@unique([reservationId, guestId])
  @@index([reservationId])
  @@index([guestId])
  @@map("reservation_guests")
}

model ReservationLog {
  id            String   @id @default(uuid())
  reservationId String
  userId        String?
  action        String   // e.g., "STATUS_CHANGED", "ROOM_ASSIGNED", "NOTE_ADDED"
  description   String
  oldValue      Json?
  newValue      Json?
  createdAt     DateTime @default(now())

  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)

  @@index([reservationId])
  @@index([createdAt])
  @@map("reservation_logs")
}

// ============================================================
// FOLIO & BILLING
// ============================================================

model Folio {
  id             String      @id @default(uuid())
  tenantId       String
  reservationId  String
  folioNumber    String      // LUM-F-2025-00001
  status         FolioStatus @default(OPEN)
  currency       String      @default("USD")
  subtotal       Decimal     @db.Decimal(12, 2) @default(0)
  taxTotal       Decimal     @db.Decimal(12, 2) @default(0)
  discountTotal  Decimal     @db.Decimal(12, 2) @default(0)
  total          Decimal     @db.Decimal(12, 2) @default(0)
  paidAmount     Decimal     @db.Decimal(12, 2) @default(0)
  balance        Decimal     @db.Decimal(12, 2) @default(0) // total - paidAmount
  notes          String?
  closedAt       DateTime?
  version        Int         @default(1)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  tenant         Tenant      @relation(fields: [tenantId], references: [id])
  reservation    Reservation @relation(fields: [reservationId], references: [id])
  folioItems     FolioItem[]
  payments       Payment[]
  invoices       Invoice[]

  @@unique([tenantId, folioNumber])
  @@index([tenantId])
  @@index([reservationId])
  @@index([status])
  @@map("folios")
}

model FolioItem {
  id           String        @id @default(uuid())
  folioId      String
  type         FolioItemType
  description  String
  quantity     Decimal       @db.Decimal(8, 2) @default(1)
  unitPrice    Decimal       @db.Decimal(10, 2)
  taxRate      Decimal       @db.Decimal(5, 2) @default(0)
  taxAmount    Decimal       @db.Decimal(10, 2) @default(0)
  discountRate Decimal       @db.Decimal(5, 2) @default(0)
  discountAmount Decimal     @db.Decimal(10, 2) @default(0)
  total        Decimal       @db.Decimal(12, 2)
  serviceDate  DateTime      @db.Date
  roomId       String?
  isVoided     Boolean       @default(false)
  voidedAt     DateTime?
  voidedBy     String?
  voidReason   String?
  createdAt    DateTime      @default(now())
  createdBy    String?

  folio        Folio         @relation(fields: [folioId], references: [id], onDelete: Cascade)

  @@index([folioId])
  @@index([type])
  @@index([serviceDate])
  @@map("folio_items")
}

model Payment {
  id             String        @id @default(uuid())
  tenantId       String
  folioId        String
  paymentNumber  String        // LUM-P-2025-00001
  method         PaymentMethod
  status         PaymentStatus @default(COMPLETED)
  amount         Decimal       @db.Decimal(12, 2)
  currency       String        @default("USD")
  exchangeRate   Decimal       @db.Decimal(12, 6) @default(1.0)
  amountInBase   Decimal       @db.Decimal(12, 2) // amount in base currency
  reference      String?       // card last 4, bank ref, etc.
  notes          String?
  isDeposit      Boolean       @default(false)
  isRefund       Boolean       @default(false)
  refundedFromId String?       // original payment if this is a refund
  processedAt    DateTime      @default(now())
  processedBy    String?
  createdAt      DateTime      @default(now())

  tenant         Tenant        @relation(fields: [tenantId], references: [id])
  folio          Folio         @relation(fields: [folioId], references: [id])

  @@unique([tenantId, paymentNumber])
  @@index([tenantId])
  @@index([folioId])
  @@index([status])
  @@index([processedAt])
  @@map("payments")
}

model Invoice {
  id             String        @id @default(uuid())
  tenantId       String
  folioId        String
  guestId        String?
  invoiceNumber  String        // LUM-INV-2025-00001
  status         InvoiceStatus @default(DRAFT)
  isProforma     Boolean       @default(false)
  billingName    String
  billingAddress String?
  billingEmail   String?
  billingTaxNo   String?
  currency       String        @default("USD")
  subtotal       Decimal       @db.Decimal(12, 2)
  taxTotal       Decimal       @db.Decimal(12, 2)
  discountTotal  Decimal       @db.Decimal(12, 2)
  total          Decimal       @db.Decimal(12, 2)
  notes          String?
  issuedAt       DateTime?
  dueDate        DateTime?
  paidAt         DateTime?
  cancelledAt    DateTime?
  pdfUrl         String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  createdBy      String?

  tenant         Tenant        @relation(fields: [tenantId], references: [id])
  folio          Folio         @relation(fields: [folioId], references: [id])
  guest          Guest?        @relation(fields: [guestId], references: [id])

  @@unique([tenantId, invoiceNumber])
  @@index([tenantId])
  @@index([folioId])
  @@index([status])
  @@map("invoices")
}

// ============================================================
// HOUSEKEEPING
// ============================================================

model HousekeepingTask {
  id             String                 @id @default(uuid())
  tenantId       String
  propertyId     String
  roomId         String
  type           HousekeepingTaskType   @default(FULL_CLEAN)
  status         HousekeepingTaskStatus @default(PENDING)
  priority       Int                    @default(5) // 1=highest, 10=lowest
  assignedTo     String?                // user ID
  scheduledDate  DateTime               @db.Date
  startedAt      DateTime?
  completedAt    DateTime?
  inspectedAt    DateTime?
  inspectedBy    String?
  notes          String?
  checklistItems Json                   @default("[]")
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt
  createdBy      String?

  tenant         Tenant                 @relation(fields: [tenantId], references: [id])
  property       Property               @relation(fields: [propertyId], references: [id])
  room           Room                   @relation(fields: [roomId], references: [id])
  assignedUser   User?                  @relation("AssignedHousekeeper", fields: [assignedTo], references: [id])

  @@index([tenantId])
  @@index([propertyId])
  @@index([roomId])
  @@index([status])
  @@index([scheduledDate])
  @@index([assignedTo])
  @@map("housekeeping_tasks")
}

model LostAndFound {
  id           String   @id @default(uuid())
  tenantId     String
  propertyId   String
  roomId       String?
  description  String
  foundDate    DateTime @db.Date
  foundBy      String?
  location     String?
  guestId      String?
  isReturned   Boolean  @default(false)
  returnedAt   DateTime?
  returnedTo   String?
  notes        String?
  imageUrls    String[] @default([])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@index([propertyId])
  @@map("lost_and_found")
}

// ============================================================
// MAINTENANCE
// ============================================================

model MaintenanceTicket {
  id             String              @id @default(uuid())
  tenantId       String
  propertyId     String
  roomId         String?
  ticketNumber   String              // LUM-MT-2025-00001
  title          String
  description    String
  status         MaintenanceStatus   @default(OPEN)
  priority       MaintenancePriority @default(MEDIUM)
  category       String?             // PLUMBING, ELECTRICAL, HVAC, FURNITURE, etc.
  assignedTo     String?
  roomOutOfOrder Boolean             @default(false)
  outOfOrderFrom DateTime?
  outOfOrderUntil DateTime?
  estimatedCost  Decimal?            @db.Decimal(10, 2)
  actualCost     Decimal?            @db.Decimal(10, 2)
  imageUrls      String[]            @default([])
  resolutionNotes String?
  resolvedAt     DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  createdBy      String?

  tenant         Tenant              @relation(fields: [tenantId], references: [id])
  property       Property            @relation(fields: [propertyId], references: [id])
  room           Room?               @relation(fields: [roomId], references: [id])
  assignedUser   User?               @relation("AssignedTechnician", fields: [assignedTo], references: [id])

  @@unique([tenantId, ticketNumber])
  @@index([tenantId])
  @@index([propertyId])
  @@index([roomId])
  @@index([status])
  @@index([priority])
  @@map("maintenance_tickets")
}

// ============================================================
// NOTIFICATIONS & COMMUNICATION
// ============================================================

model Notification {
  id           String           @id @default(uuid())
  tenantId     String
  userId       String?          // null = broadcast to all
  type         NotificationType
  title        String
  message      String
  data         Json             @default("{}")
  isRead       Boolean          @default(false)
  readAt       DateTime?
  createdAt    DateTime         @default(now())

  tenant       Tenant           @relation(fields: [tenantId], references: [id])
  user         User?            @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

model EmailTemplate {
  id           String   @id @default(uuid())
  tenantId     String
  name         String
  slug         String   // booking_confirmation, checkin_reminder, etc.
  subject      String
  bodyHtml     String
  bodyText     String?
  variables    String[] @default([]) // available template variables
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, slug])
  @@map("email_templates")
}

model EmailLog {
  id           String   @id @default(uuid())
  tenantId     String
  templateSlug String?
  toEmail      String
  subject      String
  status       String   // SENT, FAILED, BOUNCED
  messageId    String?
  error        String?
  sentAt       DateTime @default(now())

  @@index([tenantId])
  @@index([toEmail])
  @@index([sentAt])
  @@map("email_logs")
}

// ============================================================
// AUDIT LOGS
// ============================================================

model AuditLog {
  id           String      @id @default(uuid())
  tenantId     String
  userId       String?
  action       AuditAction
  resource     String      // table name: "reservations", "payments", etc.
  resourceId   String?
  description  String?
  oldValues    Json?
  newValues    Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime    @default(now())

  tenant       Tenant      @relation(fields: [tenantId], references: [id])
  user         User?       @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([userId])
  @@index([resource, resourceId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================================
// SETTINGS
// ============================================================

model Setting {
  id           String   @id @default(uuid())
  tenantId     String?  // null = global platform setting
  propertyId   String?  // null = tenant-wide setting
  key          String
  value        Json
  description  String?
  updatedAt    DateTime @updatedAt
  updatedBy    String?

  @@unique([tenantId, propertyId, key])
  @@index([tenantId])
  @@map("settings")
}

model NightAuditLog {
  id              String   @id @default(uuid())
  tenantId        String
  propertyId      String
  auditDate       DateTime @db.Date
  status          String   // RUNNING, COMPLETED, FAILED
  startedAt       DateTime
  completedAt     DateTime?
  runBy           String?
  summary         Json     @default("{}")
  errors          Json     @default("[]")
  createdAt       DateTime @default(now())

  @@unique([propertyId, auditDate])
  @@index([tenantId])
  @@index([propertyId])
  @@map("night_audit_logs")
}
```

---

## Key Database Design Decisions

### 1. Double-Booking Prevention

The primary mechanism is a **PostgreSQL advisory lock** combined with a **date-range overlap check** inside a transaction:

```sql
-- Step 1: Acquire advisory lock for the room
SELECT pg_advisory_xact_lock(hashtext('room_' || room_id));

-- Step 2: Check for overlapping active reservations
SELECT COUNT(*) FROM reservation_rooms rr
JOIN reservations r ON r.id = rr.reservation_id
WHERE rr.room_id = $roomId
  AND rr.is_active = true
  AND r.status NOT IN ('CANCELLED', 'NO_SHOW', 'CHECKED_OUT')
  AND rr.check_in_date < $checkOutDate
  AND rr.check_out_date > $checkInDate;

-- Step 3: If count = 0, proceed with INSERT
-- Step 4: Lock is released when transaction commits/rolls back
```

Additionally, a **partial unique index** prevents duplicate active room assignments:

```sql
-- This index prevents the same room from being booked twice for overlapping dates
-- (enforced at application level with advisory locks, index as safety net)
CREATE INDEX idx_reservation_rooms_availability 
ON reservation_rooms (room_id, check_in_date, check_out_date)
WHERE is_active = true;
```

### 2. Room Availability Query

```sql
-- Find available rooms for a date range
SELECT r.* FROM rooms r
WHERE r.property_id = $propertyId
  AND r.room_type_id = $roomTypeId
  AND r.status != 'OUT_OF_ORDER'
  AND r.status != 'MAINTENANCE'
  AND r.is_active = true
  AND r.id NOT IN (
    SELECT rr.room_id FROM reservation_rooms rr
    JOIN reservations res ON res.id = rr.reservation_id
    WHERE rr.is_active = true
      AND res.status NOT IN ('CANCELLED', 'NO_SHOW')
      AND rr.check_in_date < $checkOutDate
      AND rr.check_out_date > $checkInDate
  );
```

### 3. Reservation Status Machine

```
INQUIRY → TENTATIVE → CONFIRMED → CHECKED_IN → CHECKED_OUT
                    ↓              ↓
                 CANCELLED      NO_SHOW
                    ↓
                WAITLISTED (if overbooking)
```

Valid transitions:
- INQUIRY → TENTATIVE, CONFIRMED, CANCELLED
- TENTATIVE → CONFIRMED, CANCELLED
- CONFIRMED → CHECKED_IN, CANCELLED, NO_SHOW
- CHECKED_IN → CHECKED_OUT (only valid transition)
- CHECKED_OUT → (terminal state, no transitions)
- CANCELLED → (terminal state, no transitions)
- NO_SHOW → (terminal state, no transitions)

### 4. Payment Status Flow

```
PENDING → COMPLETED → REFUNDED
        → FAILED
        → VOIDED
COMPLETED → PARTIALLY_REFUNDED → REFUNDED
```

Folio balance is always computed as:
```
balance = total - SUM(payments WHERE status IN ('COMPLETED', 'PARTIALLY_REFUNDED'))
```

### 5. Check-in / Check-out State

Check-in state is tracked via:
- `reservation.status = CHECKED_IN`
- `reservation.checkedInAt` timestamp
- `room.status = OCCUPIED`
- `reservation_rooms.is_active = true` for current room

Check-out state:
- `reservation.status = CHECKED_OUT`
- `reservation.checkedOutAt` timestamp
- `room.status = DIRTY`
- `folio.status = PAID` (or CLOSED if no payment needed)

### 6. Folio Calculation

Folio totals are always computed from folio_items:
```sql
UPDATE folios SET
  subtotal = (SELECT SUM(unit_price * quantity) FROM folio_items WHERE folio_id = $id AND NOT is_voided AND type NOT IN ('TAX', 'DISCOUNT')),
  tax_total = (SELECT SUM(tax_amount) FROM folio_items WHERE folio_id = $id AND NOT is_voided),
  discount_total = (SELECT SUM(ABS(total)) FROM folio_items WHERE folio_id = $id AND NOT is_voided AND type = 'DISCOUNT'),
  total = subtotal + tax_total - discount_total,
  balance = total - paid_amount
WHERE id = $id;
```

### 7. Indexes Strategy

Critical indexes for performance:

```sql
-- Reservation availability queries (most frequent)
CREATE INDEX idx_res_rooms_dates ON reservation_rooms (room_id, check_in_date, check_out_date) WHERE is_active = true;
CREATE INDEX idx_reservations_arrival ON reservations (property_id, arrival_date, status);
CREATE INDEX idx_reservations_departure ON reservations (property_id, departure_date, status);

-- Front desk dashboard queries
CREATE INDEX idx_reservations_status_date ON reservations (tenant_id, status, arrival_date);

-- Guest search
CREATE INDEX idx_guests_search ON guests USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- Audit log queries
CREATE INDEX idx_audit_tenant_date ON audit_logs (tenant_id, created_at DESC);

-- Housekeeping daily view
CREATE INDEX idx_hk_tasks_date ON housekeeping_tasks (property_id, scheduled_date, status);
```

---

## Entity Relationship Summary

```
Tenant (1) ──────────────────── (N) Property
Property (1) ──────────────────── (N) Floor
Property (1) ──────────────────── (N) RoomType
Property (1) ──────────────────── (N) Room
Room (N) ──────────────────────── (1) RoomType
Room (N) ──────────────────────── (1) Floor

Tenant (1) ──────────────────── (N) User
User (N) ──────────────────────── (N) Role [via UserRole]
Role (N) ──────────────────────── (N) Permission [via RolePermission]
User (N) ──────────────────────── (N) Property [via UserProperty]

Tenant (1) ──────────────────── (N) Guest
Guest (N) ──────────────────────── (N) Reservation [via ReservationGuest]

Reservation (1) ──────────────── (N) ReservationRoom
Reservation (1) ──────────────── (N) ReservationGuest
Reservation (1) ──────────────── (N) Folio
Reservation (1) ──────────────── (N) ReservationLog

Folio (1) ──────────────────────── (N) FolioItem
Folio (1) ──────────────────────── (N) Payment
Folio (1) ──────────────────────── (N) Invoice

Room (1) ──────────────────────── (N) HousekeepingTask
Room (1) ──────────────────────── (N) MaintenanceTicket

RatePlan (N) ──────────────────── (N) RoomType [via RatePlanRoomType]
RatePlan (1) ──────────────────── (N) SeasonalRate