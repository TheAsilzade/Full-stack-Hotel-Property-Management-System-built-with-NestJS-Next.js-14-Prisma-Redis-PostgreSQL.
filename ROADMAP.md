# Noblesse PMS — Development Roadmap

> **Total Estimated Timeline:** 12–18 months to full SaaS product  
> **MVP Target:** 12 weeks (3 months)  
> **Team Assumption:** 2–4 developers (or AI-assisted solo development)

---

## Roadmap Overview

```
Phase 1: Foundation & Auth          Weeks 1–2    (MVP Core)
Phase 2: Property & Room Setup      Weeks 3–4    (MVP Core)
Phase 3: Reservation Engine         Weeks 5–6    (MVP Core)
Phase 4: Check-in / Check-out       Weeks 7–8    (MVP Core)
Phase 5: Billing & Payments         Weeks 9–10   (MVP Core)
Phase 6: Housekeeping & Maintenance Weeks 11–12  (MVP Core)
Phase 7: Reports & Analytics        Weeks 13–14  (Post-MVP)
Phase 8: AI & Automation            Weeks 15–18  (Post-MVP)
Phase 9: SaaS Scaling               Weeks 19–22  (Enterprise)
Phase 10: Integrations              Weeks 23–26  (Enterprise)
```

---

## PHASE 1: Foundation & Authentication
**Duration:** 2 weeks  
**Goal:** Working monorepo with auth, multi-tenancy, and base UI

### Deliverables

#### Backend
- [ ] NestJS project initialized with TypeScript
- [ ] PostgreSQL + Prisma setup with initial schema
- [ ] Redis setup for caching and sessions
- [ ] Docker Compose for local development
- [ ] JWT authentication (login, register, refresh, logout)
- [ ] Multi-tenant middleware (tenant context injection)
- [ ] RBAC permission system (roles, permissions, guards)
- [ ] User management CRUD
- [ ] Audit logging service
- [ ] Rate limiting middleware
- [ ] Global error handling filter
- [ ] Response envelope interceptor
- [ ] Swagger/OpenAPI documentation setup
- [ ] Environment configuration system
- [ ] Database seeding (default roles, permissions)

#### Frontend
- [ ] Next.js 14 project with TypeScript
- [ ] Tailwind CSS + shadcn/ui setup
- [ ] Custom gold/white theme configuration
- [ ] AppShell layout (Sidebar + Topbar)
- [ ] Login page (with validation)
- [ ] Register hotel page (multi-step wizard)
- [ ] Forgot/reset password pages
- [ ] Auth store (Zustand)
- [ ] API client (Axios with interceptors)
- [ ] Route protection middleware
- [ ] Permission hook
- [ ] Toast notification system
- [ ] Loading skeleton components

#### Infrastructure
- [ ] Monorepo structure (apps/api + apps/web)
- [ ] Shared TypeScript types package
- [ ] ESLint + Prettier configuration
- [ ] Git repository with branch strategy
- [ ] GitHub Actions CI pipeline (lint + test)

### Acceptance Criteria
- User can register a new hotel account
- User can log in and receive JWT tokens
- Token refresh works automatically
- Logout invalidates tokens
- Multi-tenant isolation verified (user A cannot see user B's data)
- Role-based access control working
- Sidebar navigation renders correctly
- All pages protected by auth guard

### Risks
- JWT refresh token rotation edge cases
- Multi-tenant query scoping bugs (critical security risk)
- Prisma migration conflicts in team environment

### Testing Needs
- Unit tests: auth service, JWT strategy, permission guard
- Integration tests: login flow, token refresh, tenant isolation
- Manual: full auth flow end-to-end

---

## PHASE 2: Property & Room Setup
**Duration:** 2 weeks  
**Goal:** Complete property, room type, and room management

### Deliverables

#### Backend
- [ ] Property CRUD (create, read, update, soft-delete)
- [ ] Floor management
- [ ] Room type CRUD with amenities
- [ ] Room CRUD with floor assignment
- [ ] Bed management (hostel mode)
- [ ] Room status management
- [ ] Rate plan CRUD
- [ ] Seasonal rate management
- [ ] Tax configuration
- [ ] Currency management
- [ ] Reservation source management
- [ ] Settings service (key-value store)
- [ ] Property-scoped user access

#### Frontend
- [ ] Properties list page
- [ ] Property detail/edit page
- [ ] Room types management page
- [ ] Rooms management page (grid + list view)
- [ ] Room detail page
- [ ] Floor management
- [ ] Rate plans page
- [ ] Seasonal rates configuration
- [ ] Taxes settings page
- [ ] Currencies settings page
- [ ] Settings hub page

### Acceptance Criteria
- Admin can create a property with all details
- Admin can create room types with rates
- Admin can create individual rooms assigned to types and floors
- Room status can be manually updated
- Rate plans created and linked to room types
- Seasonal rate overrides work correctly
- Tax rates configured and applied to calculations

### Risks
- Complex rate calculation logic (seasonal + base + extra person)
- Room type / rate plan relationship complexity

### Testing Needs
- Unit tests: rate calculator service
- Integration tests: property CRUD, room availability
- Manual: full property setup flow

---

## PHASE 3: Reservation Engine
**Duration:** 2 weeks  
**Goal:** Complete reservation lifecycle management

### Deliverables

#### Backend
- [ ] Room availability algorithm (date-range overlap query)
- [ ] Advisory lock for double-booking prevention
- [ ] Reservation creation (with transaction)
- [ ] Reservation number generation (sequential, tenant-scoped)
- [ ] Reservation status state machine
- [ ] Reservation update (dates, guests, rooms)
- [ ] Reservation cancellation (with fee calculation)
- [ ] No-show marking
- [ ] Group reservation support
- [ ] Walk-in reservation creation
- [ ] Reservation search (full-text)
- [ ] Reservation list with filters and pagination
- [ ] Reservation log/timeline
- [ ] Guest CRUD (create, search, update, merge)
- [ ] Guest search (full-text across name/email/phone/ID)
- [ ] Folio creation on reservation (auto)
- [ ] Room charge posting on reservation creation

#### Frontend
- [ ] Reservation list page (with all filters)
- [ ] Create reservation wizard (4 steps)
- [ ] Guest search autocomplete component
- [ ] Room type selector with availability
- [ ] Rate calculator display
- [ ] Reservation detail page
- [ ] Edit reservation form
- [ ] Cancel reservation dialog (with fee)
- [ ] Guest list page
- [ ] Guest profile page
- [ ] Guest create/edit form
- [ ] Room rack calendar (basic version)

### Acceptance Criteria
- Reservation created with correct room charges in folio
- Double-booking prevented (concurrent requests tested)
- Reservation number is unique and sequential
- Status transitions enforced (can't check out without checking in)
- Guest search returns results within 300ms
- Room availability correctly excludes booked rooms
- Cancellation calculates fee based on rate plan policy
- Walk-in creates reservation + immediate check-in

### Risks
- Race condition in double-booking prevention (must test concurrent requests)
- Complex date-range overlap query performance
- Guest duplicate detection accuracy

### Testing Needs
- Unit tests: availability algorithm, reservation number generator
- Integration tests: concurrent reservation creation (race condition test)
- Load tests: availability query with 1000+ reservations
- Manual: full reservation creation flow

---

## PHASE 4: Check-in / Check-out
**Duration:** 2 weeks  
**Goal:** Complete operational check-in and check-out workflows

### Deliverables

#### Backend
- [ ] Check-in service (status transition + room status update)
- [ ] Check-out service (status transition + folio close + room dirty)
- [ ] Pre-check-in validation (room ready, deposit paid)
- [ ] Room change service (with folio adjustment)
- [ ] Extend stay service
- [ ] Early check-in / late check-out handling
- [ ] Registration card data generation
- [ ] Front desk dashboard data aggregation
- [ ] Today's arrivals query (sorted, VIP first)
- [ ] Today's departures query (overdue highlighted)
- [ ] In-house guests query
- [ ] Overdue check-out detection
- [ ] WebSocket gateway setup
- [ ] Real-time room status events
- [ ] Real-time reservation status events

#### Frontend
- [ ] Front desk dashboard page
- [ ] Check-in flow page (step-by-step)
- [ ] Check-out flow page (folio review + payment)
- [ ] Room change modal
- [ ] Extend stay modal
- [ ] Registration card print view
- [ ] WebSocket connection hook
- [ ] Real-time updates integration
- [ ] Overdue check-out alerts
- [ ] VIP arrival indicators

### Acceptance Criteria
- Check-in updates reservation status to CHECKED_IN
- Check-in updates room status to OCCUPIED
- Check-out updates reservation status to CHECKED_OUT
- Check-out updates room status to DIRTY
- Room change correctly handles folio rate adjustment
- Front desk dashboard shows real-time data
- WebSocket pushes room status changes to all connected clients
- Overdue check-outs highlighted in red

### Risks
- WebSocket connection stability
- Race condition if two receptionists check in same guest simultaneously
- Folio calculation errors during room change

### Testing Needs
- Unit tests: check-in service, check-out service
- Integration tests: full check-in/check-out flow
- WebSocket tests: real-time event delivery
- Manual: concurrent check-in attempt

---

## PHASE 5: Billing & Payments
**Duration:** 2 weeks  
**Goal:** Complete folio management, payment processing, and invoice generation

### Deliverables

#### Backend
- [ ] Folio service (create, read, update totals)
- [ ] Folio item service (add, void charges)
- [ ] Folio calculator (subtotal, tax, discount, balance)
- [ ] Discount application service
- [ ] Payment recording service
- [ ] Refund processing service
- [ ] Split folio service
- [ ] Invoice generation service
- [ ] Invoice PDF generation (using Puppeteer or @react-pdf)
- [ ] Invoice email sending (BullMQ queue)
- [ ] Night audit service (room charge posting)
- [ ] End-of-day closing workflow
- [ ] Payment report queries
- [ ] Outstanding balance queries

#### Frontend
- [ ] Folio detail page (itemized charges)
- [ ] Add charge modal
- [ ] Void charge confirmation
- [ ] Apply discount modal
- [ ] Payment modal (method, amount, reference)
- [ ] Refund modal
- [ ] Split folio UI
- [ ] Invoice preview page
- [ ] Invoice PDF download
- [ ] Night audit page
- [ ] Billing overview page
- [ ] Outstanding payments list

### Acceptance Criteria
- Folio balance always equals total minus paid amount
- Voided items excluded from totals
- Tax calculated correctly (inclusive vs exclusive)
- Discount applied correctly (percentage vs fixed)
- Payment recorded and folio balance updated
- Invoice PDF generated with hotel branding
- Invoice email sent via queue (not blocking request)
- Night audit posts room charges for all in-house guests
- Night audit is idempotent (safe to re-run)

### Risks
- Floating point precision in financial calculations (use Decimal type)
- PDF generation performance
- Night audit failure recovery

### Testing Needs
- Unit tests: folio calculator, tax engine, discount logic
- Integration tests: payment flow, invoice generation
- Edge cases: zero balance, overpayment, refund > payment
- Manual: full checkout with split payment

---

## PHASE 6: Housekeeping & Maintenance
**Duration:** 2 weeks  
**Goal:** Complete housekeeping workflow and maintenance ticket system

### Deliverables

#### Backend
- [ ] Housekeeping task CRUD
- [ ] Auto-assign algorithm (priority-based)
- [ ] Task status transitions (pending → in progress → completed → inspected)
- [ ] Room status sync with housekeeping tasks
- [ ] Housekeeping board data aggregation
- [ ] Lost and found CRUD
- [ ] Maintenance ticket CRUD
- [ ] Room out-of-order blocking
- [ ] Maintenance ticket assignment
- [ ] Maintenance status transitions
- [ ] Notification events for housekeeping/maintenance
- [ ] Housekeeping report queries

#### Frontend
- [ ] Housekeeping board page (kanban + list views)
- [ ] Task card component
- [ ] Checklist modal
- [ ] Auto-assign button
- [ ] Housekeeper task view (mobile-friendly)
- [ ] Maintenance tickets list page
- [ ] Maintenance ticket detail page
- [ ] Create ticket form
- [ ] Room out-of-order toggle
- [ ] Maintenance assignment UI
- [ ] Lost and found page

### Acceptance Criteria
- Checkout triggers automatic housekeeping task creation
- Auto-assign prioritizes rooms with same-day arrivals
- VIP rooms get highest priority
- Task completion updates room status to CLEAN
- Inspection updates room status to CLEAN_INSPECTED
- Maintenance out-of-order blocks room from reservations
- Resolving maintenance ticket restores room availability
- Notifications sent to relevant staff

### Risks
- Auto-assign algorithm fairness (equal workload distribution)
- Room status sync between housekeeping and reservations

### Testing Needs
- Unit tests: auto-assign algorithm, priority calculation
- Integration tests: checkout → housekeeping task creation
- Manual: full housekeeping workflow

---

## PHASE 7: Reports & Analytics
**Duration:** 2 weeks  
**Goal:** Complete reporting suite with charts and exports

### Deliverables

#### Backend
- [ ] Occupancy report service
- [ ] Revenue report service (by date, room type, source)
- [ ] ADR and RevPAR calculation
- [ ] Daily manager report aggregation
- [ ] Arrivals/departures report
- [ ] Housekeeping performance report
- [ ] Financial summary report
- [ ] Cancellation analysis report
- [ ] No-show report
- [ ] Source analysis report
- [ ] Forecast report (based on confirmed reservations)
- [ ] CSV export service
- [ ] PDF report generation
- [ ] Report caching (Redis, 5-minute TTL)

#### Frontend
- [ ] Reports dashboard page
- [ ] Occupancy report page with chart
- [ ] Revenue report page with charts
- [ ] Daily manager report page
- [ ] Report chart components (Recharts)
- [ ] Date range picker for reports
- [ ] Export CSV button
- [ ] Export PDF button
- [ ] Report filter components
- [ ] KPI comparison (vs previous period)

### Acceptance Criteria
- Occupancy rate calculated correctly
- ADR = Total Room Revenue / Occupied Rooms
- RevPAR = ADR × Occupancy Rate
- Reports load within 2 seconds (with caching)
- CSV export contains all data
- PDF export matches screen view
- Charts render correctly with real data

### Risks
- Complex SQL aggregation queries performance
- Large date range reports timing out
- Chart rendering with large datasets

### Testing Needs
- Unit tests: occupancy calculator, ADR/RevPAR formulas
- Performance tests: report queries with 1 year of data
- Manual: verify report numbers against manual calculation

---

## PHASE 8: AI & Automation Features
**Duration:** 4 weeks  
**Goal:** AI command bar, smart alerts, dynamic pricing suggestions, automated reports

### Deliverables

#### Backend
- [ ] OpenAI API integration
- [ ] Natural language command parser
- [ ] AI command → system action mapping
- [ ] Smart room assignment algorithm
- [ ] Overbooking risk prediction
- [ ] Dynamic pricing suggestion engine
- [ ] AI daily summary generation (scheduled job)
- [ ] Revenue anomaly detection
- [ ] Smart alert rule engine
- [ ] Alert notification dispatch
- [ ] Automatic housekeeping prioritization
- [ ] Staff workload prediction
- [ ] AI guest communication draft generation

#### Frontend
- [ ] Command bar component (Cmd+K)
- [ ] AI command input with suggestions
- [ ] Smart alert panel on dashboard
- [ ] AI daily summary card
- [ ] Dynamic pricing suggestion UI
- [ ] Pricing approval workflow
- [ ] AI communication draft in email composer
- [ ] Overbooking risk indicator

### Acceptance Criteria
- Natural language commands navigate to correct pages
- Smart room assignment considers guest preferences
- Overbooking risk shown when occupancy > 90%
- Pricing suggestions generated for next 30 days
- Daily summary generated at 7:00 AM hotel timezone
- Revenue anomaly detected when deviation > 25%
- AI drafts are editable before sending

### Risks
- OpenAI API costs at scale
- AI command misinterpretation (must never auto-execute destructive actions)
- Pricing suggestion accuracy
- Daily summary generation failures

### Testing Needs
- Unit tests: command parser, alert rule engine
- Integration tests: AI API calls with mocked responses
- Manual: test 20+ natural language commands
- A/B test: pricing suggestions vs manual rates

---

## PHASE 9: SaaS Scaling
**Duration:** 4 weeks  
**Goal:** Production-ready SaaS infrastructure, subscription management, super admin

### Deliverables

#### Backend
- [ ] Subscription plan enforcement (feature flags by plan)
- [ ] Usage tracking (rooms, users, reservations per tenant)
- [ ] Super admin panel API
- [ ] Tenant management (suspend, activate, upgrade)
- [ ] Billing integration placeholder (Stripe)
- [ ] Multi-region database support
- [ ] Connection pooling (PgBouncer)
- [ ] Redis cluster setup
- [ ] Horizontal scaling configuration
- [ ] Health check endpoints
- [ ] Metrics collection (Prometheus)
- [ ] Structured logging (Winston)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

#### Frontend
- [ ] Super admin panel (separate app or route)
- [ ] Tenant list and management
- [ ] Subscription status display
- [ ] Usage metrics display
- [ ] Billing page (Stripe integration)
- [ ] Plan upgrade flow

#### Infrastructure
- [ ] Production Docker configuration
- [ ] Nginx reverse proxy with SSL
- [ ] GitHub Actions deployment pipeline
- [ ] Database backup automation
- [ ] Monitoring dashboards (Grafana)
- [ ] Alert rules (PagerDuty/email)
- [ ] CDN for static assets
- [ ] Load balancer configuration

### Acceptance Criteria
- System handles 100 concurrent users without degradation
- Database queries < 100ms for common operations
- API response time < 200ms (p95)
- 99.9% uptime SLA achievable
- Tenant data completely isolated
- Backup and restore tested
- Zero-downtime deployment working

### Risks
- Database connection pool exhaustion under load
- Redis memory limits
- Multi-tenant query performance at scale

### Testing Needs
- Load tests: 100 concurrent users, 1000 reservations/hour
- Stress tests: find breaking points
- Chaos engineering: database failover, Redis restart
- Security audit: penetration testing

---

## PHASE 10: Integrations
**Duration:** 4 weeks  
**Goal:** Channel manager, payment gateway, and third-party integrations

### Deliverables

- [ ] Channel manager integration (SiteMinder / Cloudbeds API)
- [ ] OTA rate sync (Booking.com, Expedia)
- [ ] Stripe payment gateway integration
- [ ] SMS gateway (Twilio)
- [ ] WhatsApp Business API
- [ ] Google Calendar sync (for events)
- [ ] Accounting software export (QuickBooks/Xero format)
- [ ] Key card system integration placeholder (ASSA ABLOY, Dormakaba)
- [ ] POS system integration placeholder
- [ ] Webhook system (outbound events for integrations)
- [ ] API key management for third-party access
- [ ] Integration marketplace UI

### Acceptance Criteria
- Reservations from Booking.com appear in Noblesse automatically
- Rate changes in Noblesse sync to OTAs within 5 minutes
- Stripe payments processed securely
- SMS sent on booking confirmation
- Webhook events delivered reliably with retry

### Risks
- OTA API rate limits and downtime
- Channel manager mapping complexity
- Payment gateway compliance (PCI DSS)

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Double-booking race condition | Medium | Critical | Advisory locks + integration tests |
| Multi-tenant data leak | Low | Critical | Tenant interceptor + security audit |
| Night audit failure | Medium | High | Transaction + idempotent design |
| Performance degradation at scale | Medium | High | Load testing + caching strategy |
| AI API costs | High | Medium | Usage limits + caching AI responses |
| Payment calculation errors | Low | Critical | Decimal types + comprehensive tests |
| WebSocket connection drops | Medium | Medium | Reconnection logic + fallback polling |
| Email delivery failures | Medium | Medium | Queue with retry + delivery tracking |
| Data migration from legacy PMS | High | Medium | Import tools + validation + rollback |
| Scope creep | High | High | Strict MVP definition + phased roadmap |

---

## Technology Upgrade Path

### Year 1 (MVP → Operational)
- Next.js 14 → stay current with minor updates
- NestJS 10 → stay current
- PostgreSQL 16 → no upgrade needed
- Prisma 5 → stay current

### Year 2 (Scale)
- Consider read replicas for PostgreSQL
- Consider Redis Cluster for high availability
- Consider CDN for global performance
- Consider microservices for specific modules (if needed)

### Year 3 (Enterprise)
- Multi-region deployment
- Data residency compliance (EU, US, APAC)
- Enterprise SSO (SAML, OIDC)
- Advanced analytics (ClickHouse for time-series)

---

## Definition of Done (Per Phase)

A phase is complete when:
1. All deliverables implemented and code reviewed
2. Unit tests written and passing (>80% coverage for critical modules)
3. Integration tests passing
4. Manual QA completed with no critical bugs
5. Documentation updated
6. Deployed to staging environment
7. Performance benchmarks met
8. Security review completed (for auth/billing phases)