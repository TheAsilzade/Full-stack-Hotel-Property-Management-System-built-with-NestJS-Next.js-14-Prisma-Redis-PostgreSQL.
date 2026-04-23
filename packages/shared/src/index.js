"use strict";
// ============================================================
// Noblesse PMS — Shared Types Package
// Used by both apps/api (NestJS) and apps/web (Next.js)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedType = exports.GenderType = exports.NotificationType = exports.UserRole = exports.MaintenancePriority = exports.MaintenanceStatus = exports.HousekeepingStatus = exports.PaymentMethod = exports.FolioStatus = exports.RoomStatus = exports.ReservationStatus = void 0;
// ─── Enums ───────────────────────────────────────────────────
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["INQUIRY"] = "INQUIRY";
    ReservationStatus["TENTATIVE"] = "TENTATIVE";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CHECKED_IN"] = "CHECKED_IN";
    ReservationStatus["CHECKED_OUT"] = "CHECKED_OUT";
    ReservationStatus["CANCELLED"] = "CANCELLED";
    ReservationStatus["NO_SHOW"] = "NO_SHOW";
    ReservationStatus["WAITLISTED"] = "WAITLISTED";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["AVAILABLE"] = "AVAILABLE";
    RoomStatus["OCCUPIED"] = "OCCUPIED";
    RoomStatus["DIRTY"] = "DIRTY";
    RoomStatus["CLEAN"] = "CLEAN";
    RoomStatus["INSPECTED"] = "INSPECTED";
    RoomStatus["OUT_OF_ORDER"] = "OUT_OF_ORDER";
    RoomStatus["OUT_OF_SERVICE"] = "OUT_OF_SERVICE";
    RoomStatus["ON_CHANGE"] = "ON_CHANGE";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var FolioStatus;
(function (FolioStatus) {
    FolioStatus["OPEN"] = "OPEN";
    FolioStatus["CLOSED"] = "CLOSED";
    FolioStatus["VOIDED"] = "VOIDED";
})(FolioStatus || (exports.FolioStatus = FolioStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["ONLINE"] = "ONLINE";
    PaymentMethod["VOUCHER"] = "VOUCHER";
    PaymentMethod["CITY_LEDGER"] = "CITY_LEDGER";
    PaymentMethod["COMPLIMENTARY"] = "COMPLIMENTARY";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var HousekeepingStatus;
(function (HousekeepingStatus) {
    HousekeepingStatus["PENDING"] = "PENDING";
    HousekeepingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    HousekeepingStatus["COMPLETED"] = "COMPLETED";
    HousekeepingStatus["VERIFIED"] = "VERIFIED";
    HousekeepingStatus["SKIPPED"] = "SKIPPED";
})(HousekeepingStatus || (exports.HousekeepingStatus = HousekeepingStatus = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["OPEN"] = "OPEN";
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["RESOLVED"] = "RESOLVED";
    MaintenanceStatus["CLOSED"] = "CLOSED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
var MaintenancePriority;
(function (MaintenancePriority) {
    MaintenancePriority["LOW"] = "LOW";
    MaintenancePriority["MEDIUM"] = "MEDIUM";
    MaintenancePriority["HIGH"] = "HIGH";
    MaintenancePriority["URGENT"] = "URGENT";
})(MaintenancePriority || (exports.MaintenancePriority = MaintenancePriority = {}));
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["PROPERTY_MANAGER"] = "PROPERTY_MANAGER";
    UserRole["FRONT_DESK_MANAGER"] = "FRONT_DESK_MANAGER";
    UserRole["RECEPTIONIST"] = "RECEPTIONIST";
    UserRole["HOUSEKEEPING_MANAGER"] = "HOUSEKEEPING_MANAGER";
    UserRole["HOUSEKEEPER"] = "HOUSEKEEPER";
    UserRole["MAINTENANCE_STAFF"] = "MAINTENANCE_STAFF";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["REVENUE_MANAGER"] = "REVENUE_MANAGER";
    UserRole["READONLY"] = "READONLY";
})(UserRole || (exports.UserRole = UserRole = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["RESERVATION_CREATED"] = "RESERVATION_CREATED";
    NotificationType["RESERVATION_CANCELLED"] = "RESERVATION_CANCELLED";
    NotificationType["CHECK_IN"] = "CHECK_IN";
    NotificationType["CHECK_OUT"] = "CHECK_OUT";
    NotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    NotificationType["HOUSEKEEPING_ASSIGNED"] = "HOUSEKEEPING_ASSIGNED";
    NotificationType["MAINTENANCE_CREATED"] = "MAINTENANCE_CREATED";
    NotificationType["NIGHT_AUDIT_COMPLETE"] = "NIGHT_AUDIT_COMPLETE";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var GenderType;
(function (GenderType) {
    GenderType["MALE"] = "MALE";
    GenderType["FEMALE"] = "FEMALE";
    GenderType["OTHER"] = "OTHER";
    GenderType["PREFER_NOT_TO_SAY"] = "PREFER_NOT_TO_SAY";
})(GenderType || (exports.GenderType = GenderType = {}));
var BedType;
(function (BedType) {
    BedType["SINGLE"] = "SINGLE";
    BedType["DOUBLE"] = "DOUBLE";
    BedType["QUEEN"] = "QUEEN";
    BedType["KING"] = "KING";
    BedType["TWIN"] = "TWIN";
    BedType["BUNK"] = "BUNK";
    BedType["SOFA_BED"] = "SOFA_BED";
})(BedType || (exports.BedType = BedType = {}));
