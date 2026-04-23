# Noblesse PMS — Complete REST API Design

> **Base URL:** `https://api.Noblessepms.com/api/v1`  
> **Auth:** Bearer JWT token in `Authorization` header  
> **Content-Type:** `application/json`  
> **API Version:** v1

---

## API Design Conventions

### Request Headers
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_slug>          (required for all authenticated requests)
X-Property-ID: <property_id>        (optional, scopes request to property)
Content-Type: application/json
Accept: application/json
```

### Response Envelope
All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "RESERVATION_CONFLICT",
    "message": "Room 201 is already booked for the selected dates",
    "details": { "roomId": "uuid", "conflictDates": ["2025-06-01", "2025-06-05"] }
  }
}
```

### Pagination
```
GET /reservations?page=1&limit=20&sortBy=arrivalDate&sortOrder=asc
```

### Filtering
```
GET /reservations?status=CONFIRMED&arrivalDate[gte]=2025-06-01&arrivalDate[lte]=2025-06-30
```

### HTTP Status Codes
- `200 OK` — Successful GET, PUT, PATCH
- `201 Created` — Successful POST
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Missing or invalid token
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `409 Conflict` — Business rule conflict (double booking, etc.)
- `422 Unprocessable Entity` — Business logic error
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

---

## 1. AUTHENTICATION API

### POST /auth/register
Register a new hotel/tenant account.

**Permission:** Public

**Request:**
```json
{
  "tenantName": "Grand Palace Hotel",
  "tenantSlug": "grand-palace",
  "firstName": "Ahmed",
  "lastName": "Al-Rashid",
  "email": "ahmed@grandpalace.com",
  "password": "SecurePass123!",
  "phone": "+971501234567",
  "country": "AE",
  "timezone": "Asia/Dubai",
  "currency": "AED"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Grand Palace Hotel",
      "slug": "grand-palace",
      "status": "TRIAL",
      "trialEndsAt": "2025-07-22T00:00:00Z"
    },
    "user": {
      "id": "uuid",
      "email": "ahmed@grandpalace.com",
      "firstName": "Ahmed",
      "lastName": "Al-Rashid"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 900
    }
  }
}
```

---

### POST /auth/login
Authenticate user and receive tokens.

**Permission:** Public

**Request:**
```json
{
  "email": "ahmed@grandpalace.com",
  "password": "SecurePass123!",
  "tenantSlug": "grand-palace"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "ahmed@grandpalace.com",
      "firstName": "Ahmed",
      "lastName": "Al-Rashid",
      "roles": ["TENANT_ADMIN"],
      "permissions": ["reservations.create", "reservations.edit", "..."],
      "properties": [{ "id": "uuid", "name": "Grand Palace Hotel" }]
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 900
    }
  }
}
```

---

### POST /auth/refresh
Refresh access token using refresh token.

**Permission:** Public (with valid refresh token)

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/logout
Revoke refresh token.

**Permission:** Authenticated

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200):**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{ "email": "ahmed@grandpalace.com", "tenantSlug": "grand-palace" }
```

---

### POST /auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

---

### GET /auth/me
Get current authenticated user profile.

**Permission:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "ahmed@grandpalace.com",
    "firstName": "Ahmed",
    "lastName": "Al-Rashid",
    "roles": [{ "id": "uuid", "name": "TENANT_ADMIN" }],
    "permissions": ["reservations.create", "..."],
    "tenant": { "id": "uuid", "name": "Grand Palace Hotel", "plan": "PROFESSIONAL" },
    "properties": [{ "id": "uuid", "name": "Grand Palace Hotel" }]
  }
}
```

---

## 2. USERS API

### GET /users
List all users in tenant.

**Permission:** `users.view`

**Query params:** `page`, `limit`, `status`, `search`, `roleId`, `propertyId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "staff@grandpalace.com",
      "firstName": "Sara",
      "lastName": "Johnson",
      "status": "ACTIVE",
      "roles": [{ "id": "uuid", "name": "Receptionist" }],
      "lastLoginAt": "2025-06-15T08:30:00Z",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12 }
}
```

---

### POST /users
Create new staff user.

**Permission:** `users.create`

**Request:**
```json
{
  "email": "newstaff@grandpalace.com",
  "firstName": "Maria",
  "lastName": "Santos",
  "phone": "+34612345678",
  "roleIds": ["uuid-receptionist-role"],
  "propertyIds": ["uuid-property-1"],
  "language": "es",
  "sendInviteEmail": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newstaff@grandpalace.com",
    "firstName": "Maria",
    "lastName": "Santos",
    "status": "INVITED"
  }
}
```

---

### GET /users/:id
Get user details.

**Permission:** `users.view`

---

### PATCH /users/:id
Update user.

**Permission:** `users.edit`

**Request:**
```json
{
  "firstName": "Maria",
  "phone": "+34612345679",
  "status": "ACTIVE",
  "roleIds": ["uuid-role-1", "uuid-role-2"]
}
```

---

### DELETE /users/:id
Soft-delete user.

**Permission:** `users.delete`

---

### POST /users/:id/reset-password
Force password reset for user.

**Permission:** `users.edit`

---

## 3. ROLES API

### GET /roles
List all roles.

**Permission:** `roles.view`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Receptionist",
      "description": "Front desk staff",
      "isSystem": true,
      "permissions": [
        { "id": "uuid", "resource": "reservations", "action": "create" },
        { "id": "uuid", "resource": "reservations", "action": "edit" }
      ],
      "userCount": 5
    }
  ]
}
```

---

### POST /roles
Create custom role.

**Permission:** `roles.create`

**Request:**
```json
{
  "name": "Senior Receptionist",
  "description": "Receptionist with discount authority",
  "permissionIds": ["uuid-perm-1", "uuid-perm-2"]
}
```

---

### GET /permissions
List all available permissions.

**Permission:** `roles.view`

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "resource": "reservations", "action": "create", "description": "Create new reservations" },
    { "id": "uuid", "resource": "reservations", "action": "edit", "description": "Edit existing reservations" },
    { "id": "uuid", "resource": "billing", "action": "refund", "description": "Process refunds" }
  ]
}
```

---

## 4. PROPERTIES API

### GET /properties
List all properties for tenant.

**Permission:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Grand Palace Hotel - Main",
      "code": "GPH01",
      "type": "HOTEL",
      "city": "Dubai",
      "country": "AE",
      "starRating": 5,
      "checkInTime": "14:00",
      "checkOutTime": "12:00",
      "isActive": true,
      "roomCount": 120,
      "occupancyToday": 87.5
    }
  ]
}
```

---

### POST /properties
Create new property.

**Permission:** `properties.create`

**Request:**
```json
{
  "name": "Grand Palace Hotel - Marina",
  "code": "GPH02",
  "type": "HOTEL",
  "address": "Marina Walk, Dubai Marina",
  "city": "Dubai",
  "country": "AE",
  "phone": "+97144123456",
  "email": "marina@grandpalace.com",
  "starRating": 5,
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "timezone": "Asia/Dubai",
  "currency": "AED",
  "amenities": ["POOL", "SPA", "GYM", "RESTAURANT", "PARKING"]
}
```

---

### GET /properties/:id
Get property details with stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Grand Palace Hotel - Main",
    "code": "GPH01",
    "type": "HOTEL",
    "address": "Sheikh Zayed Road, Dubai",
    "city": "Dubai",
    "country": "AE",
    "phone": "+97144123456",
    "email": "main@grandpalace.com",
    "starRating": 5,
    "checkInTime": "14:00",
    "checkOutTime": "12:00",
    "timezone": "Asia/Dubai",
    "currency": "AED",
    "amenities": ["POOL", "SPA", "GYM"],
    "floors": [
      { "id": "uuid", "number": 1, "name": "Ground Floor", "roomCount": 20 }
    ],
    "stats": {
      "totalRooms": 120,
      "occupiedRooms": 105,
      "dirtyRooms": 8,
      "outOfOrderRooms": 2,
      "occupancyRate": 87.5,
      "todayArrivals": 15,
      "todayDepartures": 12
    }
  }
}
```

---

## 5. ROOMS API

### GET /properties/:propertyId/rooms
List all rooms for a property.

**Permission:** Authenticated

**Query params:** `status`, `roomTypeId`, `floorId`, `isActive`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "number": "101",
      "name": "Standard Double - Garden View",
      "status": "AVAILABLE",
      "roomType": {
        "id": "uuid",
        "name": "Standard Double",
        "code": "STD",
        "maxOccupancy": 2
      },
      "floor": { "id": "uuid", "number": 1 },
      "currentReservation": null,
      "nextArrival": {
        "reservationNumber": "LUM-2025-00234",
        "guestName": "John Smith",
        "arrivalDate": "2025-06-20"
      }
    }
  ]
}
```

---

### POST /properties/:propertyId/rooms
Create new room.

**Permission:** `rooms.create`

**Request:**
```json
{
  "number": "305",
  "name": "Deluxe King - Sea View",
  "roomTypeId": "uuid-deluxe-type",
  "floorId": "uuid-floor-3",
  "notes": "Corner room, extra large bathroom"
}
```

---

### GET /properties/:propertyId/rooms/availability
Check room availability for date range.

**Permission:** Authenticated

**Query params:** `checkIn` (required), `checkOut` (required), `roomTypeId`, `adults`, `children`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "checkIn": "2025-06-20",
    "checkOut": "2025-06-25",
    "nights": 5,
    "roomTypes": [
      {
        "id": "uuid",
        "name": "Standard Double",
        "code": "STD",
        "availableCount": 8,
        "totalCount": 30,
        "baseRate": 150.00,
        "totalRate": 750.00,
        "availableRooms": [
          { "id": "uuid", "number": "101", "floor": 1 },
          { "id": "uuid", "number": "102", "floor": 1 }
        ]
      },
      {
        "id": "uuid",
        "name": "Deluxe Suite",
        "code": "DLX",
        "availableCount": 3,
        "totalCount": 10,
        "baseRate": 350.00,
        "totalRate": 1750.00,
        "availableRooms": [
          { "id": "uuid", "number": "501", "floor": 5 }
        ]
      }
    ]
  }
}
```

---

### PATCH /properties/:propertyId/rooms/:id/status
Update room status.

**Permission:** `rooms.updateStatus`

**Request:**
```json
{
  "status": "OUT_OF_ORDER",
  "reason": "Bathroom renovation",
  "estimatedReadyDate": "2025-06-25"
}
```

---

## 6. ROOM TYPES API

### GET /properties/:propertyId/room-types
List room types.

**Permission:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Standard Double",
      "code": "STD",
      "description": "Comfortable room with double bed",
      "maxOccupancy": 2,
      "maxAdults": 2,
      "maxChildren": 1,
      "baseRate": 150.00,
      "amenities": ["WIFI", "TV", "MINIBAR", "SAFE"],
      "images": ["https://..."],
      "roomCount": 30,
      "availableCount": 22
    }
  ]
}
```

---

### POST /properties/:propertyId/room-types
Create room type.

**Permission:** `roomTypes.create`

**Request:**
```json
{
  "name": "Presidential Suite",
  "code": "PRES",
  "description": "Our most luxurious suite with panoramic views",
  "maxOccupancy": 4,
  "maxAdults": 4,
  "maxChildren": 2,
  "baseRate": 1200.00,
  "extraAdultRate": 100.00,
  "extraChildRate": 50.00,
  "amenities": ["WIFI", "TV", "MINIBAR", "SAFE", "JACUZZI", "BUTLER"]
}
```

---

## 7. RESERVATIONS API

### GET /reservations
List reservations with filters.

**Permission:** `reservations.view`

**Query params:**
- `page`, `limit`, `sortBy`, `sortOrder`
- `status` — filter by status
- `propertyId` — filter by property
- `arrivalDate[gte]`, `arrivalDate[lte]`
- `departureDate[gte]`, `departureDate[lte]`
- `search` — search by guest name, reservation number, room number
- `sourceId` — filter by source
- `isVip` — filter VIP guests

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reservationNumber": "LUM-2025-00234",
      "status": "CONFIRMED",
      "arrivalDate": "2025-06-20",
      "departureDate": "2025-06-25",
      "nights": 5,
      "adults": 2,
      "children": 0,
      "primaryGuest": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com",
        "isVip": false,
        "nationality": "GB"
      },
      "rooms": [
        {
          "roomNumber": "305",
          "roomType": "Deluxe King",
          "ratePerNight": 350.00
        }
      ],
      "totalAmount": 1750.00,
      "depositPaid": 350.00,
      "balance": 1400.00,
      "source": { "name": "Direct", "code": "DIRECT" },
      "createdAt": "2025-06-01T10:30:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 145 }
}
```

---

### POST /reservations
Create new reservation.

**Permission:** `reservations.create`

**Request:**
```json
{
  "propertyId": "uuid",
  "arrivalDate": "2025-06-20",
  "departureDate": "2025-06-25",
  "adults": 2,
  "children": 1,
  "rooms": [
    {
      "roomTypeId": "uuid-deluxe-type",
      "roomId": "uuid-room-305",
      "ratePerNight": 350.00
    }
  ],
  "primaryGuestId": "uuid-existing-guest",
  "additionalGuestIds": [],
  "newGuest": null,
  "ratePlanId": "uuid-bar-rate",
  "sourceId": "uuid-direct-source",
  "depositAmount": 350.00,
  "specialRequests": "High floor preferred, extra pillows",
  "notes": "Corporate client - invoice to company",
  "isCorporate": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservationNumber": "LUM-2025-00235",
    "status": "CONFIRMED",
    "arrivalDate": "2025-06-20",
    "departureDate": "2025-06-25",
    "nights": 5,
    "totalAmount": 1750.00,
    "folio": {
      "id": "uuid",
      "folioNumber": "LUM-F-2025-00235",
      "total": 1750.00,
      "balance": 1750.00
    }
  }
}
```

---

### GET /reservations/:id
Get full reservation details.

**Permission:** `reservations.view`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservationNumber": "LUM-2025-00234",
    "status": "CONFIRMED",
    "property": { "id": "uuid", "name": "Grand Palace Hotel" },
    "arrivalDate": "2025-06-20",
    "departureDate": "2025-06-25",
    "nights": 5,
    "adults": 2,
    "children": 0,
    "primaryGuest": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+447911123456",
      "nationality": "GB",
      "isVip": false,
      "pastStays": 3
    },
    "rooms": [
      {
        "id": "uuid",
        "room": { "id": "uuid", "number": "305", "floor": 3 },
        "roomType": { "id": "uuid", "name": "Deluxe King", "code": "DLX" },
        "checkInDate": "2025-06-20",
        "checkOutDate": "2025-06-25",
        "ratePerNight": 350.00,
        "totalRate": 1750.00
      }
    ],
    "ratePlan": { "id": "uuid", "name": "Best Available Rate", "code": "BAR" },
    "source": { "id": "uuid", "name": "Direct", "code": "DIRECT" },
    "totalAmount": 1750.00,
    "depositAmount": 350.00,
    "depositPaid": 350.00,
    "specialRequests": "High floor preferred",
    "notes": null,
    "folio": {
      "id": "uuid",
      "folioNumber": "LUM-F-2025-00234",
      "status": "OPEN",
      "total": 1750.00,
      "paidAmount": 350.00,
      "balance": 1400.00
    },
    "logs": [
      {
        "action": "STATUS_CHANGED",
        "description": "Reservation confirmed",
        "createdAt": "2025-06-01T10:30:00Z",
        "user": "Ahmed Al-Rashid"
      }
    ],
    "createdAt": "2025-06-01T10:30:00Z",
    "createdBy": { "id": "uuid", "name": "Ahmed Al-Rashid" }
  }
}
```

---

### PATCH /reservations/:id
Update reservation.

**Permission:** `reservations.edit`

**Request:**
```json
{
  "departureDate": "2025-06-27",
  "adults": 2,
  "children": 1,
  "specialRequests": "Baby cot required",
  "notes": "Extended stay approved"
}
```

---

### POST /reservations/:id/check-in
Process check-in.

**Permission:** `checkin.process`

**Request:**
```json
{
  "roomId": "uuid-room-305",
  "identityVerified": true,
  "idType": "PASSPORT",
  "idNumber": "GB123456789",
  "idExpiryDate": "2030-01-01",
  "collectDeposit": true,
  "depositAmount": 350.00,
  "depositMethod": "CREDIT_CARD",
  "depositReference": "VISA ****4242"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reservationId": "uuid",
    "status": "CHECKED_IN",
    "checkedInAt": "2025-06-20T14:35:00Z",
    "room": { "number": "305", "floor": 3 },
    "registrationCardUrl": "https://..."
  }
}
```

---

### POST /reservations/:id/check-out
Process check-out.

**Permission:** `checkout.process`

**Request:**
```json
{
  "finalPaymentMethod": "CREDIT_CARD",
  "finalPaymentAmount": 1400.00,
  "finalPaymentReference": "VISA ****4242",
  "sendInvoiceEmail": true,
  "invoiceEmail": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reservationId": "uuid",
    "status": "CHECKED_OUT",
    "checkedOutAt": "2025-06-25T11:45:00Z",
    "invoice": {
      "id": "uuid",
      "invoiceNumber": "LUM-INV-2025-00234",
      "total": 1750.00,
      "pdfUrl": "https://..."
    }
  }
}
```

---

### POST /reservations/:id/cancel
Cancel reservation.

**Permission:** `reservations.cancel`

**Request:**
```json
{
  "reason": "Guest requested cancellation",
  "cancellationFee": 175.00,
  "refundAmount": 175.00,
  "refundMethod": "CREDIT_CARD"
}
```

---

### POST /reservations/:id/no-show
Mark reservation as no-show.

**Permission:** `reservations.cancel`

**Request:**
```json
{
  "chargeNoShowFee": true,
  "noShowFeeAmount": 350.00
}
```

---

### POST /reservations/:id/change-room
Change room assignment.

**Permission:** `reservations.edit`

**Request:**
```json
{
  "newRoomId": "uuid-room-307",
  "reason": "Guest requested quieter room",
  "adjustRate": false
}
```

---

### POST /reservations/walk-in
Create walk-in reservation and immediately check in.

**Permission:** `checkin.process`

**Request:**
```json
{
  "propertyId": "uuid",
  "roomId": "uuid-room-101",
  "checkOutDate": "2025-06-22",
  "adults": 1,
  "children": 0,
  "guest": {
    "firstName": "Carlos",
    "lastName": "Mendez",
    "email": "carlos@example.com",
    "phone": "+34612345678",
    "nationality": "ES",
    "idType": "PASSPORT",
    "idNumber": "ES987654321"
  },
  "ratePerNight": 150.00,
  "paymentMethod": "CASH",
  "depositAmount": 150.00
}
```

---

## 8. GUESTS API

### GET /guests
List guests with search.

**Permission:** `guests.view`

**Query params:** `search`, `isVip`, `isBlacklisted`, `nationality`, `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+447911123456",
      "nationality": "GB",
      "isVip": false,
      "isBlacklisted": false,
      "loyaltyPoints": 1250,
      "totalStays": 5,
      "lastStayDate": "2025-03-15",
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1847 }
}
```

---

### POST /guests
Create new guest profile.

**Permission:** `guests.create`

**Request:**
```json
{
  "firstName": "Yuki",
  "lastName": "Tanaka",
  "email": "yuki@example.com",
  "phone": "+81901234567",
  "nationality": "JP",
  "language": "ja",
  "dateOfBirth": "1985-03-15",
  "gender": "F",
  "idType": "PASSPORT",
  "idNumber": "JP123456789",
  "idExpiryDate": "2030-03-15",
  "address": "1-1 Shinjuku, Tokyo",
  "country": "JP",
  "preferences": {
    "floorPreference": "HIGH",
    "bedPreference": "KING",
    "smokingPreference": "NON_SMOKING",
    "pillowPreference": "SOFT",
    "dietaryRestrictions": ["VEGETARIAN"]
  },
  "marketingConsent": true
}
```

---

### GET /guests/:id
Get guest profile with stay history.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Yuki",
    "lastName": "Tanaka",
    "email": "yuki@example.com",
    "phone": "+81901234567",
    "nationality": "JP",
    "language": "ja",
    "isVip": true,
    "vipLevel": 3,
    "loyaltyPoints": 4500,
    "loyaltyTier": "GOLD",
    "preferences": { "floorPreference": "HIGH", "bedPreference": "KING" },
    "notes": "Prefers quiet rooms, allergic to feather pillows",
    "stayHistory": [
      {
        "reservationNumber": "LUM-2025-00100",
        "propertyName": "Grand Palace Hotel",
        "arrivalDate": "2025-03-10",
        "departureDate": "2025-03-15",
        "nights": 5,
        "roomType": "Deluxe Suite",
        "totalSpent": 1750.00,
        "status": "CHECKED_OUT"
      }
    ],
    "totalStays": 8,
    "totalNights": 42,
    "totalSpent": 14200.00,
    "averageSpendPerStay": 1775.00
  }
}
```

---

### POST /guests/:id/merge
Merge duplicate guest profiles.

**Permission:** `guests.merge`

**Request:**
```json
{
  "mergeFromId": "uuid-duplicate-guest",
  "keepId": "uuid-primary-guest"
}
```

---

## 9. FOLIOS API

### GET /reservations/:reservationId/folio
Get folio for reservation.

**Permission:** `billing.view`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "folioNumber": "LUM-F-2025-00234",
    "status": "OPEN",
    "currency": "AED",
    "items": [
      {
        "id": "uuid",
        "type": "ROOM_CHARGE",
        "description": "Deluxe King - Room 305 (Jun 20-21)",
        "quantity": 1,
        "unitPrice": 350.00,
        "taxRate": 5.00,
        "taxAmount": 17.50,
        "total": 367.50,
        "serviceDate": "2025-06-20",
        "isVoided": false
      },
      {
        "id": "uuid",
        "type": "SERVICE",
        "description": "Room Service - Dinner",
        "quantity": 1,
        "unitPrice": 85.00,
        "taxRate": 5.00,
        "taxAmount": 4.25,
        "total": 89.25,
        "serviceDate": "2025-06-20",
        "isVoided": false
      }
    ],
    "payments": [
      {
        "id": "uuid",
        "method": "CREDIT_CARD",
        "amount": 350.00,
        "reference": "VISA ****4242",
        "isDeposit": true,
        "processedAt": "2025-06-01T10:30:00Z"
      }
    ],
    "subtotal": 1750.00,
    "taxTotal": 87.50,
    "discountTotal": 0,
    "total": 1837.50,
    "paidAmount": 350.00,
    "balance": 1487.50
  }
}
```

---

### POST /folios/:folioId/items
Add charge to folio.

**Permission:** `billing.edit`

**Request:**
```json
{
  "type": "SERVICE",
  "description": "Spa Treatment - Swedish Massage",
  "quantity": 1,
  "unitPrice": 200.00,
  "taxRate": 5.00,
  "serviceDate": "2025-06-21",
  "roomId": "uuid-room-305"
}
```

---

### DELETE /folios/:folioId/items/:itemId
Void folio item.

**Permission:** `billing.void`

**Request:**
```json
{
  "reason": "Charged in error"
}
```

---

### POST /folios/:folioId/discount
Apply discount to folio.

**Permission:** `billing.discount`

**Request:**
```json
{
  "type": "PERCENTAGE",
  "value": 10,
  "reason": "Loyalty discount - Gold member",
  "applyTo": "ROOM_CHARGES"
}
```

---

## 10. PAYMENTS API

### POST /folios/:folioId/payments
Record payment.

**Permission:** `payments.process`

**Request:**
```json
{
  "method": "CREDIT_CARD",
  "amount": 1487.50,
  "currency": "AED",
  "reference": "VISA ****4242",
  "isDeposit": false,
  "notes": "Final payment at checkout"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "paymentNumber": "LUM-P-2025-00234",
    "method": "CREDIT_CARD",
    "amount": 1487.50,
    "status": "COMPLETED",
    "processedAt": "2025-06-25T11:45:00Z",
    "folio": {
      "status": "PAID",
      "balance": 0
    }
  }
}
```

---

### POST /payments/:id/refund
Process refund.

**Permission:** `payments.refund`

**Request:**
```json
{
  "amount": 175.00,
  "reason": "Cancellation refund",
  "method": "CREDIT_CARD"
}
```

---

### GET /payments
List payments with filters.

**Permission:** `payments.view`

**Query params:** `page`, `limit`, `method`, `status`, `dateFrom`, `dateTo`, `propertyId`

---

## 11. INVOICES API

### POST /folios/:folioId/invoices
Generate invoice from folio.

**Permission:** `invoices.create`

**Request:**
```json
{
  "isProforma": false,
  "billingName": "John Smith",
  "billingAddress": "123 Main St, London, UK",
  "billingEmail": "john@example.com",
  "billingTaxNo": null,
  "notes": "Thank you for staying with us",
  "sendEmail": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoiceNumber": "LUM-INV-2025-00234",
    "status": "ISSUED",
    "total": 1837.50,
    "pdfUrl": "https://storage.Noblessepms.com/invoices/LUM-INV-2025-00234.pdf",
    "issuedAt": "2025-06-25T11:45:00Z"
  }
}
```

---

### GET /invoices/:id/pdf
Download invoice PDF.

**Permission:** `invoices.view`

**Response:** PDF file stream

---

## 12. HOUSEKEEPING API

### GET /housekeeping/tasks
List housekeeping tasks.

**Permission:** `housekeeping.view`

**Query params:** `date`, `status`, `assignedTo`, `propertyId`, `roomId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room": {
        "id": "uuid",
        "number": "305",
        "floor": 3,
        "status": "DIRTY",
        "roomType": "Deluxe King"
      },
      "type": "CHECKOUT_CLEAN",
      "status": "PENDING",
      "priority": 1,
      "assignedTo": {
        "id": "uuid",
        "firstName": "Maria",
        "lastName": "Santos"
      },
      "scheduledDate": "2025-06-25",
      "nextArrival": {
        "guestName": "New Guest",
        "arrivalTime": "14:00",
        "isVip": false
      },
      "checklistItems": [
        { "id": "1", "label": "Change bed linen", "completed": false },
        { "id": "2", "label": "Clean bathroom", "completed": false },
        { "id": "3", "label": "Vacuum floor", "completed": false },
        { "id": "4", "label": "Restock minibar", "completed": false }
      ]
    }
  ]
}
```

---

### POST /housekeeping/tasks
Create housekeeping task.

**Permission:** `housekeeping.assign`

**Request:**
```json
{
  "propertyId": "uuid",
  "roomId": "uuid",
  "type": "FULL_CLEAN",
  "priority": 2,
  "assignedTo": "uuid-housekeeper",
  "scheduledDate": "2025-06-25",
  "notes": "Guest requested extra towels"
}
```

---

### PATCH /housekeeping/tasks/:id/status
Update task status.

**Permission:** `housekeeping.update`

**Request:**
```json
{
  "status": "COMPLETED",
  "checklistItems": [
    { "id": "1", "label": "Change bed linen", "completed": true },
    { "id": "2", "label": "Clean bathroom", "completed": true },
    { "id": "3", "label": "Vacuum floor", "completed": true },
    { "id": "4", "label": "Restock minibar", "completed": true }
  ],
  "notes": "Room cleaned and ready"
}
```

---

### POST /housekeeping/auto-assign
Auto-assign housekeeping tasks for a date.

**Permission:** `housekeeping.assign`

**Request:**
```json
{
  "propertyId": "uuid",
  "date": "2025-06-25",
  "strategy": "FLOOR_BASED"
}
```

---

### GET /housekeeping/board
Get housekeeping board view (all rooms with status).

**Permission:** `housekeeping.view`

**Query params:** `propertyId`, `date`, `floorId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-06-25",
    "summary": {
      "total": 120,
      "available": 45,
      "occupied": 62,
      "dirty": 10,
      "outOfOrder": 3
    },
    "rooms": [
      {
        "id": "uuid",
        "number": "101",
        "floor": 1,
        "roomType": "Standard Double",
        "status": "DIRTY",
        "task": {
          "id": "uuid",
          "type": "CHECKOUT_CLEAN",
          "status": "IN_PROGRESS",
          "assignedTo": "Maria Santos"
        },
        "currentGuest": null,
        "nextArrival": { "guestName": "New Guest", "time": "14:00" }
      }
    ]
  }
}
```

---

## 13. MAINTENANCE API

### GET /maintenance/tickets
List maintenance tickets.

**Permission:** `maintenance.view`

**Query params:** `status`, `priority`, `propertyId`, `roomId`, `assignedTo`, `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "LUM-MT-2025-00045",
      "title": "Air conditioning not working",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "category": "HVAC",
      "room": { "id": "uuid", "number": "305", "floor": 3 },
      "assignedTo": { "id": "uuid", "firstName": "Carlos", "lastName": "Tech" },
      "roomOutOfOrder": true,
      "createdAt": "2025-06-20T09:00:00Z",
      "updatedAt": "2025-06-20T10:30:00Z"
    }
  ]
}
```

---

### POST /maintenance/tickets
Create maintenance ticket.

**Permission:** `maintenance.create`

**Request:**
```json
{
  "propertyId": "uuid",
  "roomId": "uuid",
  "title": "Leaking faucet in bathroom",
  "description": "Hot water tap is dripping constantly",
  "priority": "MEDIUM",
  "category": "PLUMBING",
  "roomOutOfOrder": false,
  "assignedTo": "uuid-technician"
}
```

---

### PATCH /maintenance/tickets/:id
Update maintenance ticket.

**Permission:** `maintenance.edit`

**Request:**
```json
{
  "status": "RESOLVED",
  "resolutionNotes": "Replaced washer in faucet. Issue resolved.",
  "actualCost": 25.00,
  "roomOutOfOrder": false
}
```

---

## 14. REPORTS API

### GET /reports/dashboard
Get dashboard KPI summary.

**Permission:** `reports.view`

**Query params:** `propertyId`, `date`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-06-25",
    "property": { "id": "uuid", "name": "Grand Palace Hotel" },
    "occupancy": {
      "rate": 87.5,
      "occupiedRooms": 105,
      "totalRooms": 120,
      "changeFromYesterday": 2.5,
      "changeFromLastWeek": -1.2
    },
    "revenue": {
      "today": 42500.00,
      "mtd": 875000.00,
      "ytd": 4250000.00,
      "changeFromYesterday": 5.2
    },
    "adr": {
      "value": 404.76,
      "changeFromYesterday": 2.8
    },
    "revpar": {
      "value": 354.17,
      "changeFromYesterday": 5.5
    },
    "arrivals": { "today": 15, "tomorrow": 22 },
    "departures": { "today": 12, "overdue": 2 },
    "inHouse": 105,
    "pendingPayments": { "count": 8, "amount": 12500.00 },
    "dirtyRooms": 10,
    "maintenanceOpen": 3
  }
}
```

---

### GET /reports/occupancy
Occupancy report.

**Permission:** `reports.view`

**Query params:** `propertyId`, `dateFrom`, `dateTo`, `groupBy` (day/week/month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "averageOccupancy": 82.3,
      "totalRoomNights": 3600,
      "occupiedRoomNights": 2963,
      "peakOccupancyDate": "2025-06-15",
      "peakOccupancyRate": 98.3
    },
    "chart": [
      { "date": "2025-06-01", "occupancyRate": 75.0, "occupiedRooms": 90, "totalRooms": 120 },
      { "date": "2025-06-02", "occupancyRate": 82.5, "occupiedRooms": 99, "totalRooms": 120 }
    ]
  }
}
```

---

### GET /reports/revenue
Revenue report.

**Permission:** `reports.financial`

**Query params:** `propertyId`, `dateFrom`, `dateTo`, `groupBy`, `breakdownBy` (roomType/source/ratePlan)

---

### GET /reports/arrivals-departures
Arrivals and departures report.

**Permission:** `reports.view`

**Query params:** `propertyId`, `date`

---

### GET /reports/daily-manager
Daily manager report.

**Permission:** `reports.view`

**Query params:** `propertyId`, `date`

---

### GET /reports/housekeeping
Housekeeping performance report.

**Permission:** `reports.view`

**Query params:** `propertyId`, `dateFrom`, `dateTo`

---

### GET /reports/financial-summary
Financial summary report.

**Permission:** `reports.financial`

**Query params:** `propertyId`, `dateFrom`, `dateTo`

---

### POST /reports/export
Export report as CSV or PDF.

**Permission:** `reports.export`

**Request:**
```json
{
  "reportType": "OCCUPANCY",
  "format": "PDF",
  "propertyId": "uuid",
  "dateFrom": "2025-06-01",
  "dateTo": "2025-06-30",
  "parameters": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.Noblessepms.com/reports/temp/report-uuid.pdf",
    "expiresAt": "2025-06-25T12:45:00Z"
  }
}
```

---

## 15. SETTINGS API

### GET /settings
Get all settings for tenant/property.

**Permission:** `settings.view`

**Query params:** `propertyId`

---

### PATCH /settings
Update settings.

**Permission:** `settings.edit`

**Request:**
```json
{
  "propertyId": "uuid",
  "settings": {
    "defaultCheckInTime": "15:00",
    "defaultCheckOutTime": "11:00",
    "autoNightAuditTime": "02:00",
    "requireDepositOnBooking": true,
    "defaultDepositPercent": 20,
    "allowOverbooking": false,
    "overbookingThreshold": 0,
    "sendConfirmationEmail": true,
    "sendCheckinReminderHours": 24
  }
}
```

---

## 16. NOTIFICATIONS API

### GET /notifications
Get notifications for current user.

**Permission:** Authenticated

**Query params:** `isRead`, `type`, `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "CHECKOUT_OVERDUE",
      "title": "Overdue Check-out",
      "message": "Room 305 - John Smith was due to check out at 12:00. It is now 13:30.",
      "data": { "reservationId": "uuid", "roomNumber": "305" },
      "isRead": false,
      "createdAt": "2025-06-25T13:30:00Z"
    }
  ],
  "meta": { "unreadCount": 5 }
}
```

---

### PATCH /notifications/:id/read
Mark notification as read.

**Permission:** Authenticated

---

### PATCH /notifications/read-all
Mark all notifications as read.

**Permission:** Authenticated

---

## 17. RATE PLANS API

### GET /properties/:propertyId/rate-plans
List rate plans.

**Permission:** `rates.view`

---

### POST /properties/:propertyId/rate-plans
Create rate plan.

**Permission:** `rates.create`

**Request:**
```json
{
  "name": "Summer Special 2025",
  "code": "SUM25",
  "type": "PROMOTIONAL",
  "description": "20% off for summer bookings",
  "isRefundable": false,
  "cancellationHours": 0,
  "depositRequired": true,
  "depositPercent": 50,
  "minStay": 3,
  "roomTypeRates": [
    { "roomTypeId": "uuid-std", "baseRate": 120.00 },
    { "roomTypeId": "uuid-dlx", "baseRate": 280.00 }
  ]
}
```

---

### GET /properties/:propertyId/rate-plans/:id/seasonal-rates
Get seasonal rates for a rate plan.

---

### POST /properties/:propertyId/rate-plans/:id/seasonal-rates
Create seasonal rate override.

**Request:**
```json
{
  "roomTypeId": "uuid",
  "startDate": "2025-12-20",
  "endDate": "2026-01-05",
  "rate": 450.00,
  "minStay": 5,
  "stopSell": false,
  "closedToArrival": false,
  "closedToDeparture": false
}
```

---

## 18. ROOM RACK API

### GET /room-rack
Get room rack data for calendar view.

**Permission:** Authenticated

**Query params:** `propertyId` (required), `startDate` (required), `endDate` (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "startDate": "2025-06-20",
    "endDate": "2025-06-27",
    "rooms": [
      {
        "id": "uuid",
        "number": "101",
        "floor": 1,
        "roomType": { "id": "uuid", "name": "Standard Double", "code": "STD" },
        "status": "OCCUPIED",
        "reservations": [
          {
            "id": "uuid",
            "reservationNumber": "LUM-2025-00200",
            "checkIn": "2025-06-18",
            "checkOut": "2025-06-22",
            "guestName": "Alice Brown",
            "status": "CHECKED_IN",
            "nights": 4,
            "isVip": false,
            "color": "#22c55e"
          },
          {
            "id": "uuid",
            "reservationNumber": "LUM-2025-00234",
            "checkIn": "2025-06-23",
            "checkOut": "2025-06-27",
            "guestName": "John Smith",
            "status": "CONFIRMED",
            "nights": 4,
            "isVip": false,
            "color": "#3b82f6"
          }
        ],
        "maintenanceBlocks": []
      }
    ]
  }
}
```

---

## 19. NIGHT AUDIT API

### GET /night-audit/status
Get current night audit status.

**Permission:** `nightAudit.view`

---

### POST /night-audit/run
Run night audit for a property.

**Permission:** `nightAudit.run`

**Request:**
```json
{
  "propertyId": "uuid",
  "auditDate": "2025-06-25",
  "confirmChecklist": {
    "allDeparturesProcessed": true,
    "allArrivalsProcessed": true,
    "openFoliosReviewed": true
  }
}
```

---

## 20. AI FEATURES API

### POST /ai/command
Process natural language command.

**Permission:** Authenticated

**Request:**
```json
{
  "command": "show unpaid departures today",
  "propertyId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "intent": "FILTER_RESERVATIONS",
    "action": "navigate",
    "destination": "/reservations",
    "filters": {
      "status": "CHECKED_IN",
      "departureDate": "2025-06-25",
      "hasOutstandingBalance": true
    },
    "message": "Showing 3 departures today with outstanding balances"
  }
}
```

---

### GET /ai/daily-summary
Get AI-generated daily summary.

**Permission:** `reports.view`

**Query params:** `propertyId`, `date`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": "Good morning. Today you have 15 arrivals and 12 departures. Current occupancy is 87.5%, up 2.5% from yesterday. Revenue forecast for today is AED 42,500. 3 rooms are still dirty from last night — housekeeping has been notified. 2 VIP guests are arriving: Mr. Johnson (Suite 501) and Ms. Tanaka (Deluxe 305). Outstanding payment of AED 8,500 from 3 reservations requires attention.",
    "alerts": [
      { "type": "DIRTY_ROOMS", "message": "3 rooms dirty with arrivals today", "severity": "HIGH" },
      { "type": "OUTSTANDING_PAYMENTS", "message": "AED 8,500 outstanding from 3 reservations", "severity": "MEDIUM" }
    ],
    "generatedAt": "2025-06-25T07:00:00Z"
  }
}
```

---

### GET /ai/pricing-suggestions
Get dynamic pricing suggestions.

**Permission:** `rates.view`

**Query params:** `propertyId`, `dateFrom`, `dateTo`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-07-04",
      "roomTypeId": "uuid",
      "roomTypeName": "Standard Double",
      "currentRate": 150.00,
      "suggestedRate": 195.00,
      "changePercent": 30.0,
      "confidence": 0.85,
      "reason": "High demand period - local event detected. Historical occupancy on this date: 96%",
      "currentOccupancy": 72.0,
      "forecastOccupancy": 95.0
    }
  ]
}
```

---

## WebSocket Events

### Connection
```javascript
// Client connects with auth token
const socket = io('wss://api.Noblessepms.com', {
  auth: { token: 'Bearer eyJhbGci...' },
  query: { tenantId: 'grand-palace', propertyId: 'uuid' }
});
```

### Events (Server → Client)

```javascript
// Room status changed
socket.on('room:status_changed', {
  roomId: 'uuid',
  roomNumber: '305',
  oldStatus: 'OCCUPIED',
  newStatus: 'DIRTY',
  timestamp: '2025-06-25T11:45:00Z'
});

// New reservation created
socket.on('reservation:created', {
  reservationId: 'uuid',
  reservationNumber: 'LUM-2025-00235',
  guestName: 'New Guest',
  arrivalDate: '2025-06-28',
  roomNumber: '101'
});

// Reservation status changed
socket.on('reservation:status_changed', {
  reservationId: 'uuid',
  oldStatus: 'CONFIRMED',
  newStatus: 'CHECKED_IN',
  timestamp: '2025-06-25T14:35:00Z'
});

// New notification
socket.on('notification:new', {
  id: 'uuid',
  type: 'CHECKOUT_OVERDUE',
  title: 'Overdue Check-out',
  message: 'Room 305 - John Smith is overdue for check-out',
  severity: 'HIGH'
});

// Housekeeping task updated
socket.on('housekeeping:task_updated', {
  taskId: 'uuid',
  roomId: 'uuid',
  roomNumber: '305',
  status: 'COMPLETED',
  updatedBy: 'Maria Santos'
});
```

### Events (Client → Server)

```javascript
// Subscribe to property updates
socket.emit('subscribe:property', { propertyId: 'uuid' });

// Subscribe to room rack updates
socket.emit('subscribe:room_rack', { propertyId: 'uuid' });