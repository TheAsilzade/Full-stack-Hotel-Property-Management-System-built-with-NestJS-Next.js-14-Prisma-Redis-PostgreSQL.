# Noblesse PMS — MVP Scope Definition

> **MVP Goal:** A fully operational hotel PMS that a real hotel can use daily  
> **MVP Timeline:** 12 weeks  
> **MVP Philosophy:** Deep on core operations, minimal on advanced features

---

## MVP Definition

The MVP must allow a hotel to:
1. Set up their property, rooms, and rates
2. Create and manage reservations
3. Check guests in and out
4. Manage billing and collect payments
5. Track housekeeping and maintenance
6. View basic operational reports
7. Manage staff access

Everything else is post-MVP.

---

## MUST-HAVE (MVP — Ship in 12 weeks)

### Authentication & Multi-tenancy
- [x] Hotel registration (create tenant + admin account)
- [x] Staff login with JWT tokens
- [x] Token refresh and logout
- [x] Multi-tenant data isolation
- [x] Role-based access control (6 default roles)
- [x] User management (invite, edit, deactivate)
- [x] Password reset via email
- [x] Session management (Redis)
- [x] Audit logging for critical actions

### Property Setup
- [x] Single property management
- [x] Floor management
- [x] Room type CRUD (name, capacity, base rate, amenities)
- [x] Room CRUD (number, type, floor, status)
- [x] Basic rate plan (BAR rate)
- [x] Tax configuration (percentage and fixed)
- [x] Currency setting (single currency per property)
- [x] Check-in/check-out time settings
- [x] Reservation source configuration

### Guest Management
- [x] Guest profile CRUD
- [x] Guest search (name, email, phone, ID)
- [x] Identity information (ID type, number, expiry)
- [x] Contact information
- [x] Nationality and language
- [x] VIP flag
- [x] Blacklist flag with reason
- [x] Guest notes
- [x] Stay history view

### Reservation Management
- [x] Create reservation (individual)
- [x] Edit reservation (dates, guests, notes)
- [x] Cancel reservation
- [x] No-show marking
- [x] Walk-in reservation (create + immediate check-in)
- [x] Room assignment
- [x] Guest count (adults/children)
- [x] Special requests field
- [x] Reservation status tracking
- [x] Reservation number (sequential, human-readable)
- [x] Reservation search and filtering
- [x] Reservation detail page with activity log
- [x] Double-booking prevention (advisory locks)
- [x] Room availability query

### Check-in / Check-out
- [x] Pre-booked guest check-in
- [x] Walk-in check-in
- [x] Identity verification fields
- [x] Room assignment at check-in
- [x] Deposit collection at check-in
- [x] Check-out with folio review
- [x] Final payment at check-out
- [x] Room change (with folio adjustment)
- [x] Registration card print view
- [x] Automatic room status update (OCCUPIED on check-in, DIRTY on check-out)

### Front Desk Dashboard
- [x] Today's arrivals list (sorted, VIP first)
- [x] Today's departures list (overdue highlighted)
- [x] In-house guests list (searchable)
- [x] Overdue check-out alerts
- [x] Pending payments list
- [x] Dirty rooms count
- [x] Quick check-in/check-out from dashboard
- [x] Real-time updates (WebSocket)

### Billing & Folio
- [x] Guest folio (auto-created with reservation)
- [x] Room charges (auto-posted per night)
- [x] Add extra charges (service, minibar, etc.)
- [x] Void folio items (with reason)
- [x] Apply discount (percentage or fixed amount)
- [x] Tax calculation (inclusive and exclusive)
- [x] Record payment (cash, card, bank transfer)
- [x] Deposit tracking
- [x] Outstanding balance display
- [x] Folio balance always accurate
- [x] Invoice generation (PDF)
- [x] Invoice email sending

### Housekeeping
- [x] Room cleaning status (dirty/clean/inspected/out-of-order)
- [x] Housekeeping task creation (manual)
- [x] Auto-create task on checkout
- [x] Task assignment to housekeeper
- [x] Task status update (pending/in-progress/completed/inspected)
- [x] Cleaning checklist (configurable items)
- [x] Priority rooms for arrivals
- [x] Housekeeping board view
- [x] Auto-assign algorithm (priority-based)

### Maintenance
- [x] Create maintenance ticket
- [x] Room out-of-order flag (blocks from reservations)
- [x] Priority levels (low/medium/high/urgent)
- [x] Assign to technician
- [x] Status tracking (open/in-progress/resolved)
- [x] Resolution notes
- [x] Maintenance history per room

### Night Audit
- [x] Post room charges for in-house guests
- [x] Daily statistics calculation
- [x] Pre-audit checklist validation
- [x] Idempotent (safe to re-run)
- [x] Audit log of night audit run

### Basic Reports
- [x] Occupancy rate (daily/weekly/monthly)
- [x] Revenue summary
- [x] ADR and RevPAR
- [x] Today's arrivals report
- [x] Today's departures report
- [x] In-house guests report
- [x] Outstanding payments report
- [x] Daily manager report
- [x] CSV export for all reports

### Room Rack
- [x] Timeline view (week/2-week)
- [x] Color-coded reservation blocks
- [x] Click to view reservation detail
- [x] Click empty cell to create reservation
- [x] Today highlighted
- [x] Real-time updates

### Notifications
- [x] In-app notification center
- [x] Overdue check-out alerts
- [x] Dirty room for arrival alerts
- [x] VIP arrival alerts
- [x] Booking confirmation email
- [x] Invoice email on checkout
- [x] WebSocket push for real-time alerts

### Settings
- [x] Property profile settings
- [x] Room type management
- [x] Room management
- [x] Rate plan management (basic)
- [x] Tax configuration
- [x] User management
- [x] Role management
- [x] Reservation source management
- [x] Email template management (basic)
- [x] Audit log viewer

### UI/UX
- [x] White + gold luxury theme
- [x] Responsive layout (desktop primary, mobile usable)
- [x] Sidebar navigation with permission-based items
- [x] Global search (basic)
- [x] Toast notifications
- [x] Loading states (skeleton loaders)
- [x] Empty states with helpful messages
- [x] Confirm dialogs for destructive actions
- [x] Form validation with inline errors

---

## SHOULD-HAVE (Post-MVP — Phase 7–8, Weeks 13–18)

### Enhanced Reservations
- [ ] Group reservation management
- [ ] Corporate account management
- [ ] Agency/travel agent management
- [ ] Reservation deposit rules per rate plan
- [ ] Cancellation policy enforcement
- [ ] Waitlist management
- [ ] Extend stay workflow
- [ ] Early check-in / late check-out fees

### Enhanced Billing
- [ ] Split folio (split charges between multiple folios)
- [ ] City ledger (corporate billing)
- [ ] Proforma invoice
- [ ] Multiple currencies per folio
- [ ] Refund processing
- [ ] Partial payment tracking
- [ ] End-of-day financial closing report

### Enhanced Rate Management
- [ ] Multiple rate plans (corporate, promotional, package)
- [ ] Seasonal rate overrides
- [ ] Minimum stay restrictions
- [ ] Stop-sell restrictions
- [ ] Closed to arrival/departure
- [ ] Occupancy-based pricing rules

### Enhanced Reports
- [ ] Revenue by room type breakdown
- [ ] Revenue by source breakdown
- [ ] Cancellation analysis report
- [ ] No-show analysis report
- [ ] Housekeeping performance report
- [ ] Forecast report (next 30/60/90 days)
- [ ] Debtor report (outstanding balances)
- [ ] PDF export for all reports
- [ ] Scheduled report emails

### Enhanced Guest CRM
- [ ] Guest preferences (detailed: pillow type, floor, view)
- [ ] Loyalty points system
- [ ] Loyalty tiers (Bronze/Silver/Gold/Platinum)
- [ ] Guest segmentation
- [ ] Duplicate guest detection and merge
- [ ] GDPR data export
- [ ] GDPR data deletion/anonymization
- [ ] Marketing consent tracking

### Room Rack Enhancements
- [ ] Drag-and-drop reservation assignment
- [ ] Month view
- [ ] Maintenance blocks on calendar
- [ ] Overbooking warning indicator
- [ ] Floor grouping (collapsible)
- [ ] Room type filter

### Communication
- [ ] SMS notifications (Twilio integration)
- [ ] WhatsApp notifications
- [ ] Pre-arrival email (automated, 24h before)
- [ ] Post-stay thank you email
- [ ] Payment reminder email
- [ ] Custom email template editor

### Multi-Property
- [ ] Multiple properties per tenant
- [ ] Property selector in UI
- [ ] Cross-property reporting
- [ ] Property-level user access control
- [ ] Consolidated dashboard (all properties)

### Housekeeping Enhancements
- [ ] Lost and found management
- [ ] Housekeeper mobile view (optimized)
- [ ] Cleaning schedule templates
- [ ] Housekeeping performance metrics
- [ ] Linen tracking

---

## NICE-TO-HAVE (Phase 8–9, Months 4–6)

### AI & Automation
- [ ] AI command bar (natural language)
- [ ] Smart room assignment (preference-based)
- [ ] Dynamic pricing suggestions
- [ ] Overbooking risk prediction
- [ ] AI daily manager summary
- [ ] Revenue anomaly detection
- [ ] AI guest communication drafts
- [ ] Automatic housekeeping prioritization
- [ ] Staff workload prediction

### Advanced UI
- [ ] Dark mode
- [ ] Customizable dashboard widgets
- [ ] Keyboard shortcuts throughout
- [ ] Mobile app (React Native)
- [ ] Offline mode for housekeeping
- [ ] Drag-and-drop room rack
- [ ] Floor plan view for housekeeping

### Integrations
- [ ] Channel manager (SiteMinder/Cloudbeds)
- [ ] OTA direct connect (Booking.com, Expedia)
- [ ] Stripe payment gateway
- [ ] POS system integration
- [ ] Key card system integration
- [ ] Accounting software export (QuickBooks/Xero)
- [ ] Google Calendar sync
- [ ] Zapier/webhook integration

### Advanced Analytics
- [ ] Custom report builder
- [ ] Benchmark comparison (vs. market)
- [ ] Revenue management dashboard
- [ ] Competitor rate tracking
- [ ] Demand forecasting
- [ ] BI dashboard (Metabase/Grafana)

---

## FUTURE ENTERPRISE FEATURES (Phase 9–10, Month 6+)

### Enterprise Scale
- [ ] Multi-region deployment
- [ ] Data residency compliance (EU/US/APAC)
- [ ] Enterprise SSO (SAML 2.0, OIDC)
- [ ] Advanced audit compliance (SOC 2)
- [ ] Custom branding per tenant
- [ ] White-label option
- [ ] API marketplace for third-party developers
- [ ] Webhook system (outbound events)

### Advanced Operations
- [ ] Revenue management system (full RMS)
- [ ] Yield management automation
- [ ] Group block management
- [ ] Event/conference management
- [ ] Spa/restaurant module
- [ ] Parking management
- [ ] Loyalty program management
- [ ] Gift card management

### SaaS Platform
- [ ] Self-service subscription management
- [ ] Usage-based billing
- [ ] Tenant onboarding wizard
- [ ] In-app help center
- [ ] Video tutorials
- [ ] Live chat support
- [ ] Super admin analytics dashboard
- [ ] Tenant health monitoring

---

## MVP Feature Comparison

| Feature | Noblesse MVP | Elektra V3 | Cloudbeds | Mews |
|---|---|---|---|---|
| Multi-tenant SaaS | ✅ | ❌ | ✅ | ✅ |
| Modern UI | ✅ | ❌ | ✅ | ✅ |
| Room rack calendar | ✅ | ✅ | ✅ | ✅ |
| Real-time updates | ✅ | ❌ | Partial | ✅ |
| AI features | ❌ (post-MVP) | ❌ | ❌ | Partial |
| Mobile responsive | ✅ | ❌ | ✅ | ✅ |
| Open API | ✅ | ❌ | ✅ | ✅ |
| Channel manager | ❌ (post-MVP) | ✅ | ✅ | ✅ |
| Online booking engine | ❌ (post-MVP) | ✅ | ✅ | ✅ |
| Revenue management | ❌ (future) | Partial | Partial | ✅ |
| Multi-property | ❌ (post-MVP) | ✅ | ✅ | ✅ |
| Audit logs | ✅ | Partial | ❌ | ✅ |
| GDPR tools | Partial | ❌ | Partial | ✅ |

**MVP Verdict:** Noblesse MVP is competitive for small-to-mid hotels that need a modern, reliable core PMS without the complexity of full enterprise features.

---

## MVP Success Metrics

### Technical Metrics
- API response time: < 200ms (p95)
- Availability query: < 50ms
- Dashboard load: < 1s
- Zero double-bookings in production
- 99.5% uptime
- Zero data leaks between tenants

### Business Metrics (after 3 months in production)
- 5+ hotels using the system daily
- < 2 critical bugs per month
- Staff can complete check-in in < 2 minutes
- Staff can create reservation in < 3 minutes
- Net Promoter Score (NPS) > 40

### Quality Gates (before MVP launch)
- [ ] All MUST-HAVE features implemented
- [ ] Core test suite passing (>80% coverage on critical modules)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Tested with real hotel staff (at least 1 beta hotel)
- [ ] Documentation complete
- [ ] Backup and recovery tested
- [ ] Zero critical bugs in staging for 2 weeks

---

## MVP Exclusions (Explicitly Out of Scope)

The following are explicitly NOT in the MVP and should not be built:

1. **Online booking engine** — guests cannot book directly through Noblesse
2. **Channel manager** — no OTA sync (Booking.com, Expedia)
3. **Payment gateway** — no Stripe/online payments (cash/card recorded manually)
4. **Mobile app** — web only (responsive)
5. **AI features** — no AI command bar, no dynamic pricing
6. **Multi-property** — single property per tenant in MVP
7. **SMS/WhatsApp** — email only
8. **Loyalty program** — VIP flag only, no points system
9. **Restaurant/spa module** — manual charge posting only
10. **Key card integration** — placeholder only
11. **Accounting integration** — CSV export only
12. **Custom report builder** — predefined reports only
13. **Dark mode** — white/gold theme only
14. **Offline mode** — requires internet connection

These exclusions keep the MVP focused and deliverable in 12 weeks while still providing a complete, usable hotel management system.