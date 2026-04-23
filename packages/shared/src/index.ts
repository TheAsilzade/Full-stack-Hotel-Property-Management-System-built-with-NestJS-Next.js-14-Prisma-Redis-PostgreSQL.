// ============================================================
// Noblesse PMS — Shared Types Package
// Used by both apps/api (NestJS) and apps/web (Next.js)
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export enum ReservationStatus {
  INQUIRY = 'INQUIRY',
  TENTATIVE = 'TENTATIVE',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  WAITLISTED = 'WAITLISTED',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  DIRTY = 'DIRTY',
  CLEAN = 'CLEAN',
  INSPECTED = 'INSPECTED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  ON_CHANGE = 'ON_CHANGE',
}

export enum FolioStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  VOIDED = 'VOIDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  VOUCHER = 'VOUCHER',
  CITY_LEDGER = 'CITY_LEDGER',
  COMPLIMENTARY = 'COMPLIMENTARY',
}

export enum HousekeepingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  SKIPPED = 'SKIPPED',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  FRONT_DESK_MANAGER = 'FRONT_DESK_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  HOUSEKEEPING_MANAGER = 'HOUSEKEEPING_MANAGER',
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE_STAFF = 'MAINTENANCE_STAFF',
  ACCOUNTANT = 'ACCOUNTANT',
  REVENUE_MANAGER = 'REVENUE_MANAGER',
  READONLY = 'READONLY',
}

export enum NotificationType {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  HOUSEKEEPING_ASSIGNED = 'HOUSEKEEPING_ASSIGNED',
  MAINTENANCE_CREATED = 'MAINTENANCE_CREATED',
  NIGHT_AUDIT_COMPLETE = 'NIGHT_AUDIT_COMPLETE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN = 'TWIN',
  BUNK = 'BUNK',
  SOFA_BED = 'SOFA_BED',
}

// ─── Common Interfaces ────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface DateRange {
  checkIn: string; // ISO date string YYYY-MM-DD
  checkOut: string; // ISO date string YYYY-MM-DD
}

// ─── Tenant ───────────────────────────────────────────────────

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── User ─────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  propertyIds: string[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserDto;
  tokens: AuthTokens;
}

// ─── Property ─────────────────────────────────────────────────

export interface PropertyDto {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  timezone: string;
  currencyCode: string;
  totalRooms: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Room Type ────────────────────────────────────────────────

export interface RoomTypeDto {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  description?: string;
  maxOccupancy: number;
  baseRate: number;
  amenities: string[];
  imageUrls: string[];
  totalRooms: number;
}

// ─── Room ─────────────────────────────────────────────────────

export interface RoomDto {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomType?: RoomTypeDto;
  number: string;
  floor: number;
  status: RoomStatus;
  isActive: boolean;
  notes?: string;
}

export interface RoomAvailabilityDto extends RoomDto {
  isAvailable: boolean;
  conflictingReservationId?: string;
}

export interface AgeCategoryCounts {
  adult18Plus: number;
  child7To12: number;
  child3To6: number;
  infant0To2: number;
}

// ─── Guest ────────────────────────────────────────────────────

export interface GuestDto {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: string;
  gender?: GenderType;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  totalStays: number;
  totalSpend: number;
  createdAt: string;
}

// ─── Reservation ──────────────────────────────────────────────

export interface ReservationDto {
  id: string;
  tenantId: string;
  propertyId: string;
  property?: PropertyDto;
  confirmationNumber: string;
  status: ReservationStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  ageCategoryCounts?: AgeCategoryCounts;
  primaryGuest?: GuestDto;
  rooms: ReservationRoomDto[];
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  specialRequests?: string;
  internalNotes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationRoomDto {
  id: string;
  reservationId: string;
  roomId: string;
  room?: RoomDto;
  roomTypeId: string;
  roomType?: RoomTypeDto;
  ratePerNight: number;
  totalRate: number;
}

// ─── Folio ────────────────────────────────────────────────────

export interface FolioDto {
  id: string;
  reservationId: string;
  guestId?: string;
  status: FolioStatus;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  items: FolioItemDto[];
  payments: PaymentDto[];
  createdAt: string;
}

export interface FolioItemDto {
  id: string;
  folioId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  isVoided: boolean;
}

export interface PaymentDto {
  id: string;
  folioId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  isRefund: boolean;
  createdAt: string;
}

// ─── Housekeeping ─────────────────────────────────────────────

export interface HousekeepingTaskDto {
  id: string;
  propertyId: string;
  roomId: string;
  room?: RoomDto;
  assignedToId?: string;
  assignedTo?: UserDto;
  status: HousekeepingStatus;
  taskType: string;
  scheduledDate: string;
  completedAt?: string;
  notes?: string;
}

// ─── Maintenance ──────────────────────────────────────────────

export interface MaintenanceTicketDto {
  id: string;
  propertyId: string;
  roomId?: string;
  room?: RoomDto;
  reportedById: string;
  reportedBy?: UserDto;
  assignedToId?: string;
  assignedTo?: UserDto;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  resolvedAt?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Dashboard / Reports ──────────────────────────────────────

export interface DashboardStatsDto {
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
  availableRooms: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingHousekeeping: number;
  openMaintenanceTickets: number;
}

export interface OccupancyDataPoint {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
  revenue: number;
}

// ─── WebSocket Events ─────────────────────────────────────────

export interface WsRoomStatusChanged {
  roomId: string;
  roomNumber: string;
  status: RoomStatus;
  propertyId: string;
}

export interface WsReservationCreated {
  reservationId: string;
  confirmationNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  propertyId: string;
}

export interface WsNotification {
  notification: NotificationDto;
}

export type WsEventMap = {
  'room:status_changed': WsRoomStatusChanged;
  'reservation:created': WsReservationCreated;
  'reservation:updated': { reservationId: string; status: ReservationStatus };
  'reservation:cancelled': { reservationId: string };
  'housekeeping:task_updated': { taskId: string; status: HousekeepingStatus };
  'notification:new': WsNotification;
};
