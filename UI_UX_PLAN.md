# Noblesse PMS — UI/UX Page Plan

> **Theme:** White + Gold Luxury SaaS  
> **Primary Font:** Inter (body) + Playfair Display (headings)  
> **Design System:** Tailwind CSS + shadcn/ui (customized)

---

## Design Language

### Color Palette
```
Background:     #FAFAFA (near white)
Card:           #FFFFFF (pure white)
Primary Gold:   #D4AF37
Gold Light:     #F7F0D3
Text Primary:   #1A1A1A (charcoal)
Text Secondary: #666666
Text Muted:     #A4A4A4
Border:         #E8E8E8
Border Light:   #F0F0F0

Status Colors:
  Confirmed:    #3B82F6 (blue)
  Checked In:   #22C55E (green)
  Checked Out:  #6B7280 (gray)
  Cancelled:    #EF4444 (red)
  No Show:      #F97316 (orange)
  Tentative:    #A855F7 (purple)

Room Status:
  Available:    #22C55E
  Occupied:     #3B82F6
  Dirty:        #F59E0B
  Out of Order: #EF4444
  Maintenance:  #8B5CF6
```

### Typography Scale
```
Display:  32px / Playfair Display / Semibold
H1:       24px / Inter / Semibold
H2:       20px / Inter / Semibold
H3:       16px / Inter / Semibold
Body:     14px / Inter / Regular
Small:    12px / Inter / Regular
Tiny:     11px / Inter / Medium (labels, badges)
```

### Spacing System
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
```

### Component Patterns
- Cards: white background, 12px border-radius, 1px border (#E8E8E8), subtle shadow
- Buttons: Gold primary (filled), White secondary (outlined), Ghost (transparent)
- Inputs: White background, light gray border, gold focus ring
- Badges: Pill shape, colored background (10% opacity), colored text
- Tables: White rows, light gray header, hover gold tint
- Modals: White, 16px radius, dark overlay, centered

---

## Page 1: Login Page

### Purpose
Authenticate existing users. Entry point for all hotel staff.

### Layout
Centered card on a subtle gradient background (white to very light gold).

### Components
```
┌─────────────────────────────────────────┐
│                                         │
│         [Noblesse Logo + Name]          │
│      "The intelligence behind           │
│       exceptional hospitality"          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  Welcome back                     │  │
│  │  Sign in to your hotel account    │  │
│  │                                   │  │
│  │  Hotel Subdomain                  │  │
│  │  [grand-palace          ]         │  │
│  │  .Noblessepms.com                 │  │
│  │                                   │  │
│  │  Email Address                    │  │
│  │  [email@hotel.com       ]         │  │
│  │                                   │  │
│  │  Password                         │  │
│  │  [••••••••••••••         ] [👁]   │  │
│  │                                   │  │
│  │  [Forgot password?]               │  │
│  │                                   │  │
│  │  [████ Sign In ████████████████]  │  │
│  │         (Gold button)             │  │
│  │                                   │  │
│  │  Don't have an account?           │  │
│  │  [Register your hotel →]          │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  © 2025 Noblesse PMS · Privacy · Terms  │
└─────────────────────────────────────────┘
```

### UX Details
- Auto-focus on email field
- Show/hide password toggle
- Remember hotel subdomain in localStorage
- Error states: red border + error message below field
- Loading state: spinner in button, button disabled
- Keyboard: Enter submits form
- Failed login: show attempt count after 3 failures
- After 5 failures: show lockout message with countdown

### Empty/Error States
- Wrong credentials: "Invalid email or password. 2 attempts remaining."
- Account locked: "Account locked for 15 minutes due to too many failed attempts."
- Tenant not found: "Hotel account not found. Check your subdomain."

---

## Page 2: Register Hotel Page

### Purpose
Onboard a new hotel/company as a tenant. Multi-step wizard.

### Layout
Centered, multi-step form with progress indicator.

### Steps
```
Step 1: Hotel Information
  - Hotel name
  - Hotel type (dropdown)
  - Country
  - Timezone
  - Currency

Step 2: Admin Account
  - First name, Last name
  - Email
  - Password + confirm
  - Phone

Step 3: Confirmation
  - Summary of entered info
  - Terms acceptance checkbox
  - [Create Account] button
  - Redirect to dashboard after success
```

### UX Details
- Progress bar at top showing step 1/2/3
- Back button on steps 2 and 3
- Inline validation as user types
- Subdomain auto-generated from hotel name (editable)
- Password strength indicator
- Trial period clearly shown: "14-day free trial, no credit card required"

---

## Page 3: Main Dashboard

### Purpose
High-level KPI overview for managers. First page after login.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR: [Logo] [Property Selector ▼] [Search] [🔔] [User ▼] │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                    │
│ SIDEBAR  │  Good morning, Ahmed ☀️                           │
│          │  Grand Palace Hotel · Tuesday, June 25, 2025      │
│ Dashboard│                                                    │
│ Front    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ Desk     │  │Occupancy │ │ Revenue  │ │   ADR    │ │RevPAR│ │
│ Reserv.  │  │  87.5%   │ │ AED 42.5K│ │ AED 405  │ │AED354│ │
│ Room Rack│  │ ↑2.5%    │ │ ↑5.2%    │ │ ↑2.8%    │ │↑5.5% │ │
│ Guests   │  └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│ Billing  │                                                    │
│ Housekp. │  ┌─────────────────────────┐ ┌─────────────────┐  │
│ Mainten. │  │  Occupancy Trend        │ │  Today's Status │  │
│ Reports  │  │  [Line chart - 30 days] │ │  Arrivals:  15  │  │
│ Settings │  │                         │ │  Departures: 12 │  │
│          │  └─────────────────────────┘ │  In-House: 105  │  │
│          │                              │  Dirty Rooms: 8 │  │
│          │  ┌─────────────────────────┐ └─────────────────┘  │
│          │  │  Revenue by Source      │                       │
│          │  │  [Pie chart]            │ ┌─────────────────┐  │
│          │  │                         │ │  Smart Alerts   │  │
│          │  └─────────────────────────┘ │  ⚠ 2 overdue   │  │
│          │                              │  ⚠ 3 dirty rooms│  │
│          │  ┌─────────────────────────┐ │  ℹ VIP arrival  │  │
│          │  │  Revenue by Room Type   │ └─────────────────┘  │
│          │  │  [Bar chart]            │                       │
│          │  └─────────────────────────┘                       │
└──────────┴──────────────────────────────────────────────────┘
```

### Stat Cards (Row 1)
- **Occupancy Rate:** percentage + trend arrow + vs yesterday
- **Today's Revenue:** amount + trend + vs yesterday
- **ADR (Average Daily Rate):** amount + trend
- **RevPAR:** amount + trend

### Stat Cards (Row 2)
- **Arrivals Today:** count + link to arrivals list
- **Departures Today:** count + overdue count
- **In-House Guests:** count
- **Pending Payments:** count + total amount

### Charts
- Occupancy trend (30-day line chart)
- Revenue by source (pie chart)
- Revenue by room type (bar chart)
- Forecast vs actual (area chart)

### Smart Alerts Panel
- Color-coded alerts (red/amber/blue)
- Click to navigate to relevant page
- Dismiss individual alerts

### UX Details
- Property selector in topbar (if multi-property)
- Date shown in hotel's timezone
- Charts use gold as primary color
- All numbers formatted in hotel's currency
- Refresh button for live data
- Last updated timestamp

---

## Page 4: Front Desk Dashboard

### Purpose
Operational command center for receptionists. Real-time view of today's activity.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Front Desk · Tuesday, June 25, 2025                         │
│ [Quick Search: guest name, room, reservation #...]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Today's Arrivals (15)] [Departures (12)] [In-House (105)] │
│  [Overdue (2)] [Pending Payment (8)] [Dirty Rooms (10)]     │
│                                                             │
├──────────────────────────┬──────────────────────────────────┤
│  TODAY'S ARRIVALS        │  TODAY'S DEPARTURES              │
│  ─────────────────────   │  ─────────────────────────────   │
│  ● John Smith            │  ✓ Alice Brown (Checked Out)     │
│    Room 305 · 2 nights   │    Room 101 · Paid               │
│    Confirmed · 14:00     │                                  │
│    [Check In]            │  ⚠ Carlos Mendez (Overdue)       │
│                          │    Room 202 · Balance: AED 850   │
│  ★ Yuki Tanaka (VIP)     │    Due: 12:00 · Now: 13:30       │
│    Suite 501 · 5 nights  │    [Process Checkout]            │
│    Confirmed · 15:00     │                                  │
│    [Check In]            │  ● Maria Santos                  │
│                          │    Room 304 · Balance: AED 0     │
│  [View All Arrivals →]   │    [Process Checkout]            │
│                          │                                  │
│                          │  [View All Departures →]         │
├──────────────────────────┴──────────────────────────────────┤
│  IN-HOUSE GUESTS                                            │
│  [Search in-house guests...]                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Room │ Guest          │ Arrival  │ Departure│ Balance │   │
│  │ 101  │ Alice Brown    │ Jun 20   │ Jun 25   │ AED 0   │   │
│  │ 202  │ Carlos Mendez  │ Jun 22   │ Jun 25   │ AED 850 │   │
│  │ 305  │ John Smith     │ Jun 25   │ Jun 30   │ AED 1,750│  │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Quick Actions Panel
- [+ New Reservation] — gold button
- [Walk-in Check-in] — secondary button
- [Search Guest] — search input
- [Room Rack] — link to visual calendar

### Tab Sections
1. **Today's Arrivals** — sorted by expected arrival time, VIPs first
2. **Today's Departures** — overdue highlighted in red
3. **In-House Guests** — searchable, sortable table
4. **Pending Payments** — guests with outstanding balances
5. **Dirty Rooms** — rooms needing cleaning before arrivals

### UX Details
- Real-time updates via WebSocket (no manual refresh needed)
- Overdue items highlighted with red/amber background
- VIP guests marked with gold star icon
- One-click check-in/check-out from this page
- Quick payment button on guests with balance
- Keyboard shortcut: Ctrl+N for new reservation

---

## Page 5: Reservation List

### Purpose
Browse, search, and filter all reservations.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Reservations                          [+ New Reservation]   │
│                                                             │
│ [Search: guest, room, #...] [Status ▼] [Date Range] [More ▼]│
│                                                             │
│ Showing 145 reservations                    [Export CSV]    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ # Res.     │ Guest        │ Room  │ Dates    │ Status  │ │ │
│ ├────────────┼──────────────┼───────┼──────────┼─────────┤ │
│ │ LUM-00234  │ John Smith   │ 305   │ Jun20-25 │ ●Conf.  │ │ │
│ │ LUM-00233  │ Yuki Tanaka  │ 501   │ Jun25-30 │ ●Conf.  │ │ │
│ │ LUM-00232  │ Alice Brown  │ 101   │ Jun20-25 │ ●In     │ │ │
│ │ LUM-00231  │ Carlos M.    │ 202   │ Jun22-25 │ ●In     │ │ │
│ │ LUM-00230  │ Sara Johnson │ 304   │ Jun15-20 │ ✓ Out   │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [← Prev]  Page 1 of 8  [Next →]                            │
└─────────────────────────────────────────────────────────────┘
```

### Filters
- **Search:** guest name, reservation number, room number, email, phone
- **Status:** All / Confirmed / Checked In / Checked Out / Cancelled / No Show
- **Date Range:** arrival date range picker
- **Source:** Direct / OTA / Corporate / Agency / Walk-in
- **Property:** (if multi-property)
- **Room Type:** dropdown
- **VIP Only:** toggle

### Table Columns
- Reservation # (sortable, clickable)
- Guest name + VIP badge
- Room number + room type
- Arrival date (sortable)
- Departure date
- Nights
- Status badge
- Total amount
- Balance (highlighted if > 0)
- Actions: [View] [Check In/Out] [Edit]

### Empty State
- Icon: calendar with X
- Message: "No reservations found matching your filters"
- Action: [Clear Filters] or [Create Reservation]

---

## Page 6: Create Reservation Page

### Purpose
Multi-step form to create a new reservation.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    New Reservation                                   │
│                                                             │
│ ●─────────●─────────●─────────●                            │
│ Guest   Dates    Room     Confirm                           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │  STEP 1: Guest Information                              │ │
│ │                                                         │ │
│ │  Search existing guest:                                 │ │
│ │  [🔍 Type name, email, or phone...]                     │ │
│ │                                                         │ │
│ │  ┌─────────────────────────────────────────────────┐   │ │
│ │  │ John Smith · john@example.com · +44791...       │   │ │
│ │  │ 5 past stays · Gold member                      │   │ │
│ │  └─────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │  ─── or ───                                             │ │
│ │                                                         │ │
│ │  [+ Create New Guest]                                   │ │
│ │                                                         │ │
│ │  Additional guests: [+ Add Guest]                       │ │
│ │                                                         │ │
│ │  Reservation Source: [Direct ▼]                         │ │
│ │                                                         │ │
│ │                              [Continue →]               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Guest
- Guest search with autocomplete (debounced, 300ms)
- Guest card shows: name, email, past stays, VIP status, preferences
- Create new guest inline (expandable form)
- Add additional guests
- Reservation source selector

### Step 2: Dates & Details
- Arrival date picker
- Departure date picker (auto-calculates nights)
- Adults count (stepper)
- Children count (stepper)
- Special requests textarea
- Notes (internal)

### Step 3: Room Selection
- Shows available room types for selected dates
- Each room type card shows: name, capacity, rate, available count
- Select room type → shows specific available rooms
- Smart room suggestion highlighted with gold badge
- Rate plan selector
- Rate breakdown: per night × nights + taxes = total

### Step 4: Confirmation
- Full summary of reservation
- Deposit amount input
- Payment method for deposit
- Send confirmation email toggle
- [Confirm Reservation] gold button

### UX Details
- Progress saved between steps (don't lose data on back)
- Real-time availability check as dates change
- Rate auto-calculated when room type selected
- Conflict warning if room becomes unavailable
- Keyboard navigation between steps

---

## Page 7: Reservation Detail Page

### Purpose
Full view of a single reservation with all actions.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ← Reservations    LUM-2025-00234    [● Confirmed]           │
│                                                             │
│ [Check In] [Edit] [Cancel] [Print] [More ▼]                 │
│                                                             │
│ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │ GUEST                    │ │ STAY DETAILS             │   │
│ │ John Smith               │ │ Jun 20 → Jun 25 (5 nts)  │   │
│ │ john@example.com         │ │ Room 305 · Deluxe King   │   │
│ │ +44 7911 123456          │ │ 2 Adults · 0 Children    │   │
│ │ 🇬🇧 British · 5 stays    │ │ Rate: AED 350/night      │   │
│ │ [View Profile]           │ │ Source: Direct           │   │
│ └──────────────────────────┘ └──────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ FOLIO                                    [Add Charge] │    │
│ │                                                       │    │
│ │ Room Charge (5 nights × AED 350)    AED 1,750.00     │    │
│ │ Room Service - Dinner               AED    89.25     │    │
│ │ ─────────────────────────────────────────────────    │    │
│ │ Subtotal                            AED 1,839.25     │    │
│ │ VAT (5%)                            AED    91.96     │    │
│ │ ─────────────────────────────────────────────────    │    │
│ │ Total                               AED 1,931.21     │    │
│ │ Deposit Paid                       -AED   350.00     │    │
│ │ ─────────────────────────────────────────────────    │    │
│ │ Balance Due                         AED 1,581.21     │    │
│ │                                                       │    │
│ │ [Record Payment]                                      │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ ACTIVITY LOG                                          │    │
│ │ ● Jun 01 10:30 · Ahmed A. · Reservation created      │    │
│ │ ● Jun 01 10:31 · System · Confirmation email sent    │    │
│ │ ● Jun 20 14:35 · Sara J. · Guest checked in          │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sections
1. **Header:** Reservation number, status badge, action buttons
2. **Guest Card:** Primary guest info, link to profile
3. **Stay Details:** Dates, room, rate, source
4. **Special Requests:** If any
5. **Folio:** Itemized charges, payments, balance
6. **Activity Log:** Timeline of all actions

### Action Buttons
- **Check In** (if CONFIRMED) → opens check-in flow
- **Check Out** (if CHECKED_IN) → opens check-out flow
- **Edit** → opens edit form
- **Cancel** → opens cancel dialog with fee calculation
- **Change Room** → room selector modal
- **Add Charge** → add folio item modal
- **Record Payment** → payment modal
- **Print** → registration card / invoice
- **Send Email** → email template selector

---

## Page 8: Room Rack / Visual Room Calendar

### Purpose
Visual timeline of all room reservations. Primary tool for room management.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Room Rack                                                   │
│ [← Prev Week] Jun 20 – Jul 3, 2025 [Next Week →] [Today]   │
│ [Day] [Week] [2 Weeks] [Month]    [Filter: All Types ▼]     │
│                                                             │
│ ┌────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐    │
│ │ Room   │ 20 │ 21 │ 22 │ 23 │ 24 │ 25 │ 26 │ 27 │ 28 │    │
│ │        │ Fri│ Sat│ Sun│ Mon│ Tue│ Wed│ Thu│ Fri│ Sat│    │
│ ├────────┼────┴────┴────┴────┴────┴────┴────┴────┴────┤    │
│ │ 101    │ [████ Alice Brown ████████]  [John S. ████] │    │
│ │ STD    │                                             │    │
│ ├────────┼─────────────────────────────────────────────┤    │
│ │ 102    │              [Available]                    │    │
│ │ STD    │                                             │    │
│ ├────────┼─────────────────────────────────────────────┤    │
│ │ 201    │ [████████ Carlos M. ████]                   │    │
│ │ DLX    │                                             │    │
│ ├────────┼─────────────────────────────────────────────┤    │
│ │ 305    │              [████ John Smith ████████████] │    │
│ │ DLX    │                                             │    │
│ ├────────┼─────────────────────────────────────────────┤    │
│ │ 501    │ [🔧 Maintenance ████████]  [Yuki T. ██████] │    │
│ │ SUITE  │                                             │    │
│ └────────┴─────────────────────────────────────────────┘    │
│                                                             │
│ Legend: [● Confirmed] [● Checked In] [● Checked Out]        │
│         [🔧 Maintenance] [⚠ Dirty]                          │
└─────────────────────────────────────────────────────────────┘
```

### Features
- **Drag-and-drop:** Move reservations between rooms (same type)
- **Click reservation block:** Opens reservation detail panel (slide-in)
- **Click empty cell:** Opens new reservation form pre-filled with room + date
- **Hover reservation:** Tooltip with guest name, dates, status
- **Color coding:** Blue=Confirmed, Green=Checked In, Gray=Checked Out, Red=Maintenance
- **Today column:** Highlighted with gold tint
- **Zoom levels:** Day / Week / 2 Weeks / Month
- **Filter by room type:** Dropdown to show only specific types
- **Floor grouping:** Group rooms by floor (collapsible)

### Right Panel (on reservation click)
- Guest name + status badge
- Dates + room
- Balance
- Quick actions: [Check In] [Check Out] [View Full]

### UX Details
- Smooth horizontal scroll for date navigation
- Sticky room labels column
- Sticky date header row
- Real-time updates via WebSocket
- Conflict prevention: can't drag to occupied room
- Overbooking warning shown as red indicator

---

## Page 9: Rooms Page

### Purpose
Manage all rooms in a property. View status, edit rooms.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Rooms · Grand Palace Hotel                  [+ Add Room]    │
│                                                             │
│ [All Floors ▼] [All Types ▼] [All Statuses ▼]              │
│                                                             │
│ Summary: 120 total · 105 occupied · 8 dirty · 3 OOO · 4 avail│
│                                                             │
│ FLOOR 1 (20 rooms)                                          │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐  │
│ │ 101  │ 102  │ 103  │ 104  │ 105  │ 106  │ 107  │ 108  │  │
│ │ STD  │ STD  │ STD  │ STD  │ STD  │ STD  │ STD  │ STD  │  │
│ │ 🟢   │ 🔵   │ 🟡   │ 🔵   │ 🟢   │ 🔴   │ 🔵   │ 🟡   │  │
│ │ Avail│ Occup│ Dirty│ Occup│ Avail│ OOO  │ Occup│ Dirty│  │
│ └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘  │
│                                                             │
│ FLOOR 2 (20 rooms)                                          │
│ [Similar grid...]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Views
- **Grid view:** Room cards with status color (default)
- **List view:** Table with all room details

### Room Card
- Room number (large)
- Room type code
- Status indicator (colored dot + label)
- Current guest name (if occupied)
- Next arrival (if available)
- Click → Room detail page

### Filters
- Floor selector
- Room type selector
- Status filter (Available / Occupied / Dirty / OOO)

---

## Page 10: Guest List

### Purpose
Browse and search all guest profiles.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Guests                                    [+ New Guest]     │
│                                                             │
│ [🔍 Search by name, email, phone, ID...]                    │
│ [Nationality ▼] [VIP Only] [Blacklisted]                    │
│                                                             │
│ 1,847 guests                                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Guest          │ Contact        │ Stays │ Last Stay │ VIP│ │
│ ├────────────────┼────────────────┼───────┼───────────┼────┤ │
│ │ John Smith     │ john@ex.com    │   5   │ Jun 2025  │    │ │
│ │ 🇬🇧 British    │ +44791...      │       │           │    │ │
│ ├────────────────┼────────────────┼───────┼───────────┼────┤ │
│ │ ★ Yuki Tanaka  │ yuki@ex.com    │   8   │ Jun 2025  │ ★  │ │
│ │ 🇯🇵 Japanese   │ +81901...      │       │           │    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Table Columns
- Guest name + nationality flag
- Email + phone
- Total stays + total nights
- Last stay date
- VIP badge (if VIP)
- Blacklist warning (if blacklisted)
- Loyalty tier badge

### Search
- Full-text search across name, email, phone, ID number
- Debounced (300ms)
- Highlights matching text in results

---

## Page 11: Guest Profile

### Purpose
Complete guest profile with stay history, preferences, and CRM data.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ← Guests    Yuki Tanaka    [★ VIP · Gold Member]            │
│                            [Edit] [New Reservation] [More ▼]│
│                                                             │
│ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │ [Avatar/Initials]        │ │ CONTACT                  │   │
│ │ Yuki Tanaka              │ │ yuki@example.com         │   │
│ │ 🇯🇵 Japanese · Female    │ │ +81 90 1234 5678         │   │
│ │ Born: Mar 15, 1985       │ │ 1-1 Shinjuku, Tokyo, JP  │   │
│ │ Passport: JP123456789    │ │                          │   │
│ │ Exp: Mar 2030            │ │ LOYALTY                  │   │
│ │                          │ │ 4,500 points · Gold      │   │
│ └──────────────────────────┘ │ 8 stays · 42 nights      │   │
│                              │ AED 14,200 total spent   │   │
│                              └──────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PREFERENCES                                           │    │
│ │ Floor: High floor preferred                           │    │
│ │ Bed: King size                                        │    │
│ │ Smoking: Non-smoking                                  │    │
│ │ Pillow: Soft (allergic to feather)                    │    │
│ │ Diet: Vegetarian                                      │    │
│ │ Notes: Prefers quiet rooms away from elevator         │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ STAY HISTORY                                          │    │
│ │ Jun 2025 · Suite 501 · 5 nights · AED 6,000 · ✓ Out  │    │
│ │ Mar 2025 · Deluxe 305 · 5 nights · AED 1,750 · ✓ Out │    │
│ │ Dec 2024 · Suite 501 · 7 nights · AED 8,400 · ✓ Out  │    │
│ │ [View All 8 Stays]                                    │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sections
1. **Profile Header:** Avatar, name, nationality, ID info
2. **Contact Info:** Email, phone, address
3. **Loyalty:** Points, tier, stay statistics
4. **Preferences:** All stored preferences
5. **Stay History:** Past reservations table
6. **Notes:** Internal staff notes
7. **GDPR Actions:** Export data / Delete data (admin only)

---

## Page 12: Billing / Folio Page

### Purpose
View and manage guest folio. Add charges, record payments, generate invoice.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Folio · LUM-F-2025-00234                    [● Open]        │
│ John Smith · Reservation LUM-2025-00234                     │
│                                                             │
│ [+ Add Charge] [Apply Discount] [Record Payment] [Invoice]  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Date     │ Description              │ Qty │ Amount   │    │
│ ├──────────┼──────────────────────────┼─────┼──────────┤    │
│ │ Jun 20   │ Room Charge - Night 1    │  1  │ AED 350  │    │
│ │ Jun 21   │ Room Charge - Night 2    │  1  │ AED 350  │    │
│ │ Jun 22   │ Room Charge - Night 3    │  1  │ AED 350  │    │
│ │ Jun 23   │ Room Charge - Night 4    │  1  │ AED 350  │    │
│ │ Jun 24   │ Room Charge - Night 5    │  1  │ AED 350  │    │
│ │ Jun 20   │ Room Service - Dinner    │  1  │ AED  85  │    │
│ │ Jun 21   │ Spa - Swedish Massage    │  1  │ AED 200  │    │
│ ├──────────┼──────────────────────────┼─────┼──────────┤    │
│ │          │ Subtotal                 │     │ AED 2,035│    │
│ │          │ VAT (5%)                 │     │ AED 101.75│   │
│ │          │ ─────────────────────────────────────────│    │
│ │          │ Total                    │     │ AED 2,136│    │
│ ├──────────┼──────────────────────────┼─────┼──────────┤    │
│ │ Jun 01   │ Deposit (VISA ****4242)  │     │-AED  350 │    │
│ │          │ ─────────────────────────────────────────│    │
│ │          │ Balance Due              │     │ AED 1,786│    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ PAYMENTS                                                    │
│ Jun 01 · Deposit · VISA ****4242 · AED 350 · ✓ Completed   │
└─────────────────────────────────────────────────────────────┘
```

### Features
- Itemized charge list with void option (per item)
- Add charge modal (type, description, amount, tax)
- Apply discount modal (percentage or fixed)
- Payment modal (method, amount, reference)
- Split folio option
- Generate invoice button
- Print folio button

---

## Page 13: Housekeeping Board

### Purpose
Visual board for managing room cleaning tasks.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Housekeeping · June 25, 2025              [Auto-Assign]     │
│                                                             │
│ Summary: 10 Dirty · 5 In Progress · 3 Completed · 2 Inspect │
│                                                             │
│ [All Housekeepers ▼] [All Floors ▼] [All Statuses ▼]        │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PRIORITY ROOMS (Arrivals Today)                       │    │
│ │                                                       │    │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│ │ │ Room 305 │ │ Room 101 │ │ Room 202 │               │    │
│ │ │ Deluxe K │ │ Standard │ │ Deluxe K │               │    │
│ │ │ 🟡 Dirty │ │ 🔄 In Pr.│ │ 🟡 Dirty │               │    │
│ │ │ Arrival: │ │ Arrival: │ │ Arrival: │               │    │
│ │ │ 14:00    │ │ 15:00    │ │ 16:00    │               │    │
│ │ │ VIP ★    │ │          │ │          │               │    │
│ │ │ [Assign] │ │ Maria S. │ │ [Assign] │               │    │
│ │ └──────────┘ └──────────┘ └──────────┘               │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ALL TASKS                                                   │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Room │ Type        │ Status    │ Assigned  │ Priority │    │
│ │ 305  │ Checkout    │ 🟡 Dirty  │ Unassigned│ ★★★★★   │    │
│ │ 101  │ Checkout    │ 🔄 In Pr. │ Maria S.  │ ★★★★    │    │
│ │ 202  │ Checkout    │ 🟡 Dirty  │ Unassigned│ ★★★     │    │
│ │ 304  │ Stay-over   │ ✓ Done    │ Carlos T. │ ★★      │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Views
- **Board view:** Kanban-style columns (Pending / In Progress / Done / Inspected)
- **List view:** Table with all tasks
- **Map view:** Floor plan with room status (future)

### Task Card (Board View)
- Room number + type
- Task type (Checkout Clean / Refresh / Turndown)
- Priority indicator (stars)
- Assigned housekeeper (or "Unassigned")
- Next arrival time (if applicable)
- VIP badge (if VIP guest arriving)
- [Start] / [Complete] / [Inspect] action button

---

## Page 14: Maintenance Tickets

### Purpose
Track and manage maintenance issues.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Maintenance                              [+ New Ticket]     │
│                                                             │
│ [Search...] [Status ▼] [Priority ▼] [Category ▼]           │
│                                                             │
│ Open: 8 · In Progress: 3 · Resolved: 45                    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ # Ticket   │ Room │ Issue          │ Priority│ Status │    │
│ ├────────────┼──────┼────────────────┼─────────┼────────┤    │
│ │ LUM-MT-045 │ 501  │ AC not working │ 🔴 High │ In Pr. │    │
│ │ LUM-MT-044 │ 202  │ Leaking faucet │ 🟡 Med  │ Open   │    │
│ │ LUM-MT-043 │ 105  │ TV remote miss │ 🟢 Low  │ Open   │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Ticket Detail Page
- Title + description
- Room + property
- Priority badge
- Status (Open / In Progress / Resolved)
- Assigned technician
- Room out-of-order toggle + dates
- Estimated / actual cost
- Resolution notes
- Activity timeline
- Photo attachments (placeholder)

---

## Page 15: Reports Dashboard

### Purpose
Analytics and reporting hub.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Reports                                                     │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ QUICK REPORTS                                         │    │
│ │ [Daily Manager] [Occupancy] [Revenue] [Arrivals]      │    │
│ │ [Departures] [Housekeeping] [Financial] [Forecast]    │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ OCCUPANCY REPORT                                            │
│ [Property ▼] [Jun 1 - Jun 30, 2025] [Group by: Day ▼]      │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Average Occupancy: 82.3%                              │    │
│ │ Peak: Jun 15 (98.3%) · Low: Jun 3 (61.2%)            │    │
│ │                                                       │    │
│ │ [Line chart: occupancy by day]                        │    │
│ │                                                       │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Date     │ Occupied │ Total │ Occupancy │ ADR  │RevPAR│    │
│ │ Jun 01   │    90    │  120  │   75.0%   │ 380  │ 285  │    │
│ │ Jun 02   │    99    │  120  │   82.5%   │ 395  │ 326  │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ [Export CSV] [Export PDF] [Email Report]                    │
└─────────────────────────────────────────────────────────────┘
```

### Available Reports
1. **Daily Manager Report** — comprehensive daily summary
2. **Occupancy Report** — occupancy rate by date/period
3. **Revenue Report** — revenue breakdown by type/source
4. **ADR & RevPAR** — rate performance metrics
5. **Arrivals Report** — detailed arrivals list
6. **Departures Report** — detailed departures list
7. **In-House Report** — current in-house guests
8. **Housekeeping Report** — cleaning performance
9. **Financial Summary** — payments and outstanding
10. **Cancellation Report** — cancellation analysis
11. **No-Show Report** — no-show tracking
12. **Source Analysis** — bookings by channel
13. **Forecast Report** — future occupancy forecast
14. **Debtor Report** — outstanding balances

---

## Page 16: Settings

### Purpose
System configuration hub.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PROPERTY SETTINGS                                     │    │
│ │ [Hotel Profile] [Check-in/out Rules] [Policies]       │    │
│ │                                                       │    │
│ │ ROOM MANAGEMENT                                       │    │
│ │ [Room Types] [Rooms] [Floors]                         │    │
│ │                                                       │    │
│ │ RATES & PRICING                                       │    │
│ │ [Rate Plans] [Seasonal Rates] [Taxes] [Currencies]    │    │
│ │                                                       │    │
│ │ STAFF & ACCESS                                        │    │
│ │ [Users] [Roles & Permissions] [Departments]           │    │
│ │                                                       │    │
│ │ OPERATIONS                                            │    │
│ │ [Reservation Sources] [Payment Methods] [Templates]   │    │
│ │                                                       │    │
│ │ SYSTEM                                                │    │
│ │ [Audit Logs] [Notifications] [Integrations] [Billing] │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Settings Sections
Each section opens a dedicated settings page with forms.

---

## Page 17: User Management

### Purpose
Manage staff accounts and their access.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Users                                      [+ Invite User]  │
│                                                             │
│ [Search users...] [Role ▼] [Status ▼]                       │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ User           │ Role          │ Status  │ Last Login │    │
│ ├────────────────┼───────────────┼─────────┼────────────┤    │
│ │ Ahmed Al-Rashid│ Tenant Admin  │ ● Active│ 2h ago     │    │
│ │ Sara Johnson   │ Receptionist  │ ● Active│ 30m ago    │    │
│ │ Maria Santos   │ Housekeeper   │ ● Active│ 1h ago     │    │
│ │ Carlos Tech    │ Maintenance   │ ○ Invite│ Never      │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### User Detail / Edit
- Name, email, phone
- Role assignment (multi-select)
- Property access (multi-select)
- Status toggle
- Reset password button
- Activity log

---

## Page 18: Notification Center

### Purpose
View all system notifications and alerts.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Notifications                          [Mark All Read]      │
│                                                             │
│ [All] [Unread (5)] [Reservations] [Payments] [Housekeeping] │
│                                                             │
│ TODAY                                                       │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 🔴 Overdue Check-out · 13:30                          │    │
│ │    Room 305 - John Smith was due at 12:00             │    │
│ │    [View Reservation →]                               │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ 🟡 Dirty Room for Arrival · 12:00                     │    │
│ │    Room 101 is dirty. Guest arriving at 14:00         │    │
│ │    [View Housekeeping →]                              │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ ℹ VIP Arrival · 09:00                                 │    │
│ │    Yuki Tanaka (Gold Member) arriving today at 15:00  │    │
│ │    [View Reservation →]                               │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ YESTERDAY                                                   │
│ [Older notifications...]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Notification Types
- 🔴 Critical (overdue, payment issues)
- 🟡 Warning (dirty rooms, pending tasks)
- 🔵 Info (arrivals, confirmations)
- ✅ Success (completed tasks)

---

## Global UI Components

### Topbar
```
[Logo] [Property: Grand Palace ▼] ─────────── [🔍 Search] [🔔 3] [Ahmed ▼]
```
- Property selector (dropdown with all accessible properties)
- Global search (opens command palette)
- Notification bell with unread count
- User menu: Profile / Settings / Logout

### Command Bar (Cmd+K)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 What would you like to do?                               │
│                                                             │
│ [Type a command or search...]                               │
│                                                             │
│ QUICK ACTIONS                                               │
│ ⚡ New Reservation                                          │
│ ⚡ Walk-in Check-in                                         │
│ ⚡ Search Guest                                             │
│                                                             │
│ RECENT                                                      │
│ 📋 LUM-2025-00234 · John Smith                              │
│ 👤 Yuki Tanaka · Suite 501                                  │
│                                                             │
│ AI COMMANDS (try these)                                     │
│ 💬 "show unpaid departures today"                           │
│ 💬 "which rooms are dirty?"                                 │
│ 💬 "VIP arrivals this week"                                 │
└─────────────────────────────────────────────────────────────┘
```

### Toast Notifications
- Success: green left border, checkmark icon
- Error: red left border, X icon
- Warning: amber left border, warning icon
- Info: blue left border, info icon
- Position: bottom-right
- Auto-dismiss: 4 seconds
- Stack up to 3 toasts

### Loading States
- Skeleton loaders (not spinners) for page content
- Spinner only for button actions
- Optimistic updates where possible (TanStack Query)

### Mobile Responsiveness
- Sidebar collapses to bottom navigation on mobile
- Tables become card lists on mobile
- Room rack becomes simplified list on mobile
- All modals are full-screen on mobile
- Touch-friendly tap targets (min 44px)