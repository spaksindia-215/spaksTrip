# EVENTS MODULE — Full Implementation Prompt

## SpaksTrip Travel SaaS Platform | Production-Safe | Zero Regression

---

## DEVELOPER PROFILE EXPECTED

You are a **senior full-stack engineer (4–6 years)** with production experience in:

- Node.js + Express.js REST APIs
- Next.js App Router (client-side)
- MongoDB + Mongoose (schema design, indexes, middleware)
- PostgreSQL (transactions layer — already in codebase)
- Razorpay payment integration (webhooks, signature verification)
- Third-party API integrations (REST, OAuth, rate limiting)
- TypeScript throughout

---

## PLATFORM CONTEXT

```
Type         : Travel SaaS (TBO-integrated — flights, hotels, taxi, packages, cruise, tours)
Stack        : Node.js + Express.js (server/) + Next.js (client/)
               TypeScript throughout
               MongoDB Atlas + Mongoose (primary data)
               PostgreSQL (financial transactions only)
               Razorpay (payments — webhooks active)
Auth         : JWT (roles: customer, agent, b2b_agent, partner)
Domain       : spakstrip.com (main) + *.spakstrip.com (agent subdomains)
```

### What is already working and MUST remain working:

- TBO flight search, booking, ticketing, PNR flow
- TBO hotel search and booking
- Razorpay webhook receiving (existing endpoint)
- Partner resource CRUD (HotelListing, TaxiListing, TaxiPackage, TourListing, TourPackage, CruiseListing)
- Partner dashboard (listings management, recent activity)
- Agent dashboard (bookings, PNR tracker, wallet, markup engine)
- Agent subdomain system (agent.spakstrip.com with branding + markup)
- B2B agent API key system
- JWT auth for all 4 roles
- All existing MongoDB reads and writes
- All existing PostgreSQL transaction flows

---

## ═══════════════════════════════════════════
## ABSOLUTE CONSTRAINTS — NON-NEGOTIABLE
## ═══════════════════════════════════════════

### FROZEN — ZERO CHANGES PERMITTED:

```
- All existing partner resource models (HotelListing, TaxiListing, TaxiPackage,
  TourListing, TourPackage, CruiseListing) — do NOT modify these files
- Existing booking flows (flight, hotel) — do NOT touch
- Razorpay webhook handler — do NOT modify existing logic (you may ADD new
  event-specific handlers alongside)
- Agent markup engine — do NOT change
- Auth middleware — do NOT modify (you may ADD new role checks alongside)
- PostgreSQL transaction schema — do NOT alter existing tables
```

### PATTERN TO FOLLOW:

```
- Follow the EXACT same patterns used in existing partner resources
- Study how HotelListing or TourPackage is structured before creating EventListing
- Use the same Cloudinary upload patterns for event images
- Use the same validation patterns (Joi/Zod — match whatever the codebase uses)
- Use the same route structure: /api/v1/partner/events/...
- Use the same frontend patterns: study existing partner forms and listing pages
```

---

## THE GOAL

Build a complete **Events Module** with three layers:

1. **EventListing** — A new partner resource (like HotelListing) where local event organizers list events directly on SpaksTrip (weddings, corporate events, birthday parties, concerts, etc.)
2. **Third-Party Event Discovery** — Pull upcoming events from external APIs (Ticketmaster, Paytm Insider) and display them alongside partner-listed events
3. **Event Booking Flow** — For partner-listed events: full booking + payment through Razorpay. For third-party events: affiliate deep-links

---

## ═══════════════════════════════════════════
## PHASE 1: EventListing Partner Resource
## ═══════════════════════════════════════════

### Step 1.1 — Audit existing partner resource pattern

Before writing ANY code:

1. Read every file in the existing partner resource that is MOST complete (likely TourPackage or HotelListing)
2. Map the full pattern:
   - Model file location and structure
   - Controller file location and structure
   - Route file location and registration
   - Validation schema location
   - Frontend form component location
   - Frontend listing/card component location
   - Cloudinary upload integration
   - How the partner dashboard references these resources
3. Document this pattern in a comment block at the top of your first new file
4. Your EventListing MUST follow this pattern exactly — same folder structure, same naming conventions, same middleware chain

### Step 1.2 — EventListing Mongoose Model

Create the EventListing model following the exact partner resource pattern:

```typescript
// Required fields — adapt types to match existing model conventions:

partner           : ObjectId (ref: 'User', required) — the partner who created this listing
status            : enum ['draft', 'pending_review', 'published', 'rejected', 'archived', 'cancelled']

// Event identity
title             : String, required, trimmed, min 5, max 200
slug              : String, unique, auto-generated from title (use same slug logic as other models)
description       : String, required, min 50, max 5000
shortDescription  : String, max 300

// Event classification
category          : enum [
                      'wedding', 'corporate', 'birthday_party', 'engagement',
                      'cocktail_party', 'concert', 'music_festival', 'comedy_show',
                      'theatre', 'sports', 'exhibition', 'conference', 'workshop',
                      'cultural_festival', 'religious', 'charity', 'networking',
                      'food_festival', 'nightlife', 'other'
                    ]
tags              : [String] — free-form tags for search (max 10)
eventType         : enum ['in_person', 'virtual', 'hybrid']

// Date & time
startDate         : Date, required
endDate           : Date, required, must be >= startDate
startTime         : String (HH:mm format)
endTime           : String (HH:mm format)
isRecurring       : Boolean, default false
recurringPattern  : {
                      frequency: enum ['daily', 'weekly', 'monthly'],
                      endDate: Date,
                      daysOfWeek: [Number] // 0-6, Sunday=0
                    } — only if isRecurring is true

// Location (for in_person and hybrid)
venue             : {
                      name: String,
                      address: String,
                      city: String, required,
                      state: String,
                      pincode: String,
                      country: String, default 'India',
                      coordinates: {
                        lat: Number,
                        lng: Number
                      },
                      landmark: String,
                      venueType: enum ['indoor', 'outdoor', 'both']
                    }

// Virtual event details (for virtual and hybrid)
virtualDetails    : {
                      platform: enum ['zoom', 'google_meet', 'teams', 'custom'],
                      link: String, // populated after booking confirmation
                      instructions: String
                    }

// Media
images            : [{
                      url: String, required,
                      publicId: String, // Cloudinary public ID
                      alt: String,
                      isPrimary: Boolean, default false
                    }] — min 1, max 10
// Follow existing Cloudinary patterns exactly

// Ticketing & pricing
tickets           : [{
                      _id: true,
                      name: String, required, // e.g. 'General Admission', 'VIP', 'VVIP'
                      description: String,
                      price: Number, required, min 0, // 0 = free
                      currency: String, default 'INR',
                      totalQuantity: Number, required, min 1,
                      soldQuantity: Number, default 0,
                      maxPerOrder: Number, default 10,
                      saleStartDate: Date,
                      saleEndDate: Date,
                      isActive: Boolean, default true
                    }]

isFree            : Boolean, default false // derived: true if ALL ticket prices are 0
priceRange        : {
                      min: Number,
                      max: Number
                    } // auto-computed from tickets array via pre-save hook

// Capacity
totalCapacity     : Number, required
currentBookings   : Number, default 0
isSoldOut         : Boolean, default false // derived: currentBookings >= totalCapacity

// Organizer details (displayed publicly)
organizer         : {
                      name: String, required,
                      phone: String,
                      email: String,
                      website: String,
                      logo: String // Cloudinary URL
                    }

// Policies
cancellationPolicy: enum ['no_refund', 'full_refund', 'partial_refund', 'custom']
cancellationDetails: String // free-text if 'custom'
termsAndConditions: String
ageRestriction    : {
                      hasRestriction: Boolean, default false,
                      minimumAge: Number
                    }

// SEO & discovery
metaTitle         : String, max 70
metaDescription   : String, max 160

// Agent markup support (follows existing pattern)
// When displayed on agent.spakstrip.com, agent markup applies on top of ticket prices
// This uses the EXISTING markup engine — do NOT build a new one

// Timestamps — use same pattern as other models
```

**Indexes (add these):**

```
{ partner: 1, status: 1 }              — partner dashboard queries
{ status: 1, startDate: 1 }            — public listing queries
{ category: 1, status: 1 }             — category browsing
{ 'venue.city': 1, startDate: 1 }      — city + date search
{ slug: 1 }                            — unique, for URL lookups
{ startDate: 1, endDate: 1 }           — date range queries
text index on { title, description, tags, 'venue.city' } — full-text search
```

**Pre-save hooks:**

- Auto-generate slug from title (same logic as existing models)
- Auto-compute `priceRange` from `tickets` array
- Auto-compute `isFree` from tickets (all prices === 0)
- Auto-compute `isSoldOut` from `currentBookings >= totalCapacity`
- Validate `endDate >= startDate`
- Validate at least one ticket type exists
- Validate `soldQuantity <= totalQuantity` for each ticket

### Step 1.3 — EventBooking Model

This is separate from EventListing. It tracks individual bookings made by customers:

```typescript
// EventBooking model — stored in MongoDB (quick reads)
// Financial transaction records go to PostgreSQL (existing pattern)

user              : ObjectId (ref: 'User', required)
event             : ObjectId (ref: 'EventListing', required)
bookingReference  : String, unique, auto-generated (e.g. 'EVT-XXXXXX')

// What was booked
tickets           : [{
                      ticketTypeId: ObjectId, // references EventListing.tickets._id
                      ticketName: String,     // snapshot at time of booking
                      quantity: Number, required, min 1,
                      unitPrice: Number, required,
                      subtotal: Number, required
                    }]

// Attendee details
attendees         : [{
                      name: String, required,
                      email: String,
                      phone: String,
                      age: Number
                    }] // one per total ticket quantity

// Pricing (all server-computed — NEVER trust client)
subtotal          : Number, required // sum of all ticket subtotals
platformFee       : Number, default 0 // SpaksTrip service fee (percentage or flat)
gst               : Number, default 0 // 18% GST on service fee
totalAmount       : Number, required // subtotal + platformFee + gst
currency          : String, default 'INR'

// Agent context (if booked through agent subdomain)
agent             : ObjectId (ref: 'User') // null if direct booking
agentMarkup       : Number, default 0
customerPaid      : Number // totalAmount + agentMarkup (what end customer pays)

// Payment
paymentStatus     : enum ['pending', 'initiated', 'paid', 'failed', 'refunded', 'partially_refunded']
razorpayOrderId   : String
razorpayPaymentId : String
paidAt            : Date

// Booking status
status            : enum ['confirmed', 'cancelled', 'pending', 'checked_in', 'no_show']
cancelledAt       : Date
cancellationReason: String
refundAmount      : Number
refundStatus      : enum ['not_applicable', 'pending', 'processed', 'failed']

// QR / Check-in
qrCode            : String // generated on confirmation — unique per booking
checkedInAt       : Date

// Metadata
bookedAt          : Date, default Date.now
source            : enum ['web', 'agent_portal', 'api'] // how the booking was made
ipAddress         : String
userAgent         : String
```

**Indexes:**

```
{ user: 1, status: 1 }                 — user's bookings
{ event: 1, status: 1 }                — event's bookings
{ bookingReference: 1 }                — unique, for lookups
{ agent: 1, status: 1 }                — agent's bookings
{ razorpayOrderId: 1 }                 — payment webhook lookups
```

### Step 1.4 — Backend API Routes

Follow the exact same route structure as existing partner resources:

```
# Partner routes (authenticated, role: partner)
POST   /api/v1/partner/events                    — create event listing
GET    /api/v1/partner/events                    — list partner's own events
GET    /api/v1/partner/events/:id                — get single event
PUT    /api/v1/partner/events/:id                — update event
DELETE /api/v1/partner/events/:id                — soft delete (archive)
PATCH  /api/v1/partner/events/:id/status         — change status (publish/unpublish)
POST   /api/v1/partner/events/:id/images         — upload images (Cloudinary)
DELETE /api/v1/partner/events/:id/images/:imgId  — remove image
GET    /api/v1/partner/events/:id/bookings       — view bookings for this event
GET    /api/v1/partner/events/:id/analytics      — booking stats, revenue, etc.

# Public routes (no auth required)
GET    /api/v1/events                            — list published events (paginated, filterable)
GET    /api/v1/events/search                     — full-text search
GET    /api/v1/events/categories                 — list categories with counts
GET    /api/v1/events/cities                     — list cities with event counts
GET    /api/v1/events/:slug                      — get single event by slug
GET    /api/v1/events/upcoming                   — upcoming events (sorted by startDate)
GET    /api/v1/events/featured                   — featured/promoted events

# Booking routes (authenticated, role: customer)
POST   /api/v1/events/:slug/book                 — initiate booking (creates Razorpay order)
POST   /api/v1/events/booking/verify             — verify Razorpay payment (after frontend callback)
GET    /api/v1/bookings/events                   — user's event bookings
GET    /api/v1/bookings/events/:bookingRef       — single booking details
POST   /api/v1/bookings/events/:bookingRef/cancel — cancel booking (with refund logic)

# Admin routes (authenticated, role: admin)
GET    /api/v1/admin/events                      — all events (any status)
PATCH  /api/v1/admin/events/:id/review           — approve/reject listing
GET    /api/v1/admin/events/analytics             — platform-wide event analytics
```

**Controller implementation rules:**

- **Price integrity:** ticket prices come from the database, NOT from the client request. The client sends `{ ticketTypeId, quantity }` — the server looks up the price from EventListing.tickets
- **Inventory locking:** when a booking is initiated, place a 10-minute soft hold on the ticket quantity. Use MongoDB `findOneAndUpdate` with `$inc` to atomically decrement available quantity. If payment fails/expires, release the hold
- **Race condition prevention:** use MongoDB's atomic operators (`$inc` with conditions) to prevent overselling. Example: `{ 'tickets._id': ticketTypeId, 'tickets.soldQuantity': { $lte: totalQuantity - requestedQty } }`
- **Agent markup:** if the request comes from an agent subdomain (detected via existing middleware), apply the agent's event markup percentage on top of ticket prices. Use the EXISTING markup engine pattern — do NOT build a new one
- **Financial transaction:** after successful Razorpay payment verification, write the transaction record to PostgreSQL using the EXISTING transaction service pattern. Do NOT create new PostgreSQL tables — use the existing transaction schema with `type: 'event_booking'` in metadata
- **QR code generation:** on booking confirmation, generate a unique QR code (use `qrcode` npm package) containing the booking reference. Store as base64 or Cloudinary URL

### Step 1.5 — Razorpay Integration for Event Bookings

Follow the EXACT same payment flow as existing hotel/flight bookings:

```
1. Client sends booking request → server validates → creates Razorpay order
2. Server returns order ID to client
3. Client opens Razorpay checkout (existing Razorpay integration on frontend)
4. On success → client sends payment details to /verify endpoint
5. Server verifies Razorpay signature (existing utility)
6. Server confirms booking, updates inventory, writes PG transaction
7. Server sends confirmation email (use existing email service)
```

**Critical: study the existing Razorpay flow in the codebase before implementing. Match it exactly.**

### Step 1.6 — Frontend (Next.js)

**Partner-facing (dashboard):**

- Event creation form — follow the same form pattern as existing partner resource forms (HotelListing form, TourPackage form). Same layout, same component library, same validation UX
- Event management table — list partner's events with status badges, edit/delete actions
- Event bookings view — table of bookings for a specific event
- Event analytics card — bookings count, revenue, capacity utilization

**Customer-facing (public):**

- `/events` — main events listing page with filters (category, city, date range, price range, free/paid)
- `/events/[slug]` — event detail page with:
  - Image gallery (same carousel component as existing listings)
  - Event info (date, time, venue with map, organizer)
  - Ticket selection (choose type, quantity)
  - Book Now button → Razorpay checkout
  - Share buttons
  - Related events section
- Event cards component — reusable card for listing pages (image, title, date, venue, price range, category badge)

**Design rules:**

- Match the existing SpaksTrip design system EXACTLY — same colors, typography, spacing, card styles
- Do NOT introduce new UI libraries or design patterns
- Event cards should look and feel like existing hotel/tour cards
- Category icons should match the style shown in the uploaded screenshots (the 6-card grid with images)
- Mobile responsive — test at 375px width

---

## ═══════════════════════════════════════════
## PHASE 2: Third-Party Event Discovery
## ═══════════════════════════════════════════

### Step 2.1 — Event Aggregation Service

Create a service layer that fetches events from external APIs and normalizes them into a common format:

```typescript
// server/src/services/eventAggregator/

// Common normalized event format (used internally):
interface ExternalEvent {
  source: 'ticketmaster' | 'insider' | 'internal'  // 'internal' = EventListing
  sourceId: string           // external event ID
  title: string
  description: string
  category: string           // mapped to our categories
  startDate: Date
  endDate: Date
  venue: {
    name: string
    city: string
    state: string
    country: string
    coordinates?: { lat: number, lng: number }
  }
  images: string[]
  priceRange?: { min: number, max: number, currency: string }
  url: string               // deep link / affiliate link to external platform
  isExternal: true
  bookingType: 'affiliate'  // external events are always affiliate
  affiliateUrl: string      // the actual booking URL with tracking params
}
```

### Step 2.2 — Ticketmaster Discovery API Integration

```typescript
// server/src/services/eventAggregator/ticketmaster.ts

/*
 * Ticketmaster Discovery API v2
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 *
 * Free tier: 5,000 calls/day, 5 requests/second
 * Sign up: https://developer.ticketmaster.com/
 *
 * SETUP REQUIRED:
 * 1. Register at developer.ticketmaster.com
 * 2. Get API key (instant approval)
 * 3. Add to .env: TICKETMASTER_API_KEY=xxxxx
 *
 * USAGE:
 * - Search events by country (IN for India — limited coverage)
 * - Search events by keyword, city, date range, classification
 * - Returns event details with images, venue, pricing, ticket URLs
 *
 * API call examples:
 *   GET https://app.ticketmaster.com/discovery/v2/events.json?countryCode=IN&apikey={key}
 *   GET https://app.ticketmaster.com/discovery/v2/events.json?city=Mumbai&apikey={key}
 *   GET https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&apikey={key}
 *
 * IMPLEMENTATION NOTES:
 * - Cache results in Redis/in-memory for 5 minutes (respect rate limits)
 * - Map Ticketmaster classifications to our category enum
 * - Use the event URL as the affiliate link
 * - Handle pagination (max 1000 results per search)
 * - Implement exponential backoff on 429 responses
 * - India coverage is limited — this is primarily useful for
 *   users planning international trips (show events at their destination)
 */
```

### Step 2.3 — Paytm Insider API Integration

```typescript
// server/src/services/eventAggregator/insiderIn.ts

/*
 * Paytm Insider (insider.in) API
 *
 * This is the most relevant source for Indian events (concerts, comedy,
 * theatre, workshops, nightlife, food festivals).
 *
 * API ACCESS:
 * - Insider opened their API for third-party platforms to list and sell tickets
 * - Contact: email insider.in team for API access / partnership
 * - There is also an undocumented public API used by their frontend:
 *     GET https://api.insider.in/home?filterBy=go-out&city=mumbai
 *     GET https://api.insider.in/home?filterBy=go-out&city=delhi
 *     GET https://api.insider.in/event/{eventSlug}
 *
 * IMPORTANT: The undocumented API may change without notice.
 * For production, pursue the official partnership route.
 * For MVP/testing, the public endpoints work.
 *
 * IMPLEMENTATION APPROACH:
 *
 * Option A — Official API partner (recommended for production):
 *   1. Email insider.in business team requesting API partnership
 *   2. They provide API docs, auth keys, revenue share terms
 *   3. You list their events on SpaksTrip
 *   4. Users book on your site, Insider handles fulfillment
 *   5. Revenue is shared per agreement
 *
 * Option B — Affiliate deep-link (works immediately, no approval needed):
 *   1. Fetch event data from public API endpoints
 *   2. Display event info on SpaksTrip
 *   3. "Book Now" button opens insider.in event page in new tab
 *   4. No revenue share unless you join their affiliate program
 *
 * Option C — Hybrid scrape + affiliate (MVP approach):
 *   1. Build a scraper service that periodically fetches from insider.in
 *      public pages (respect robots.txt, rate limit to 1 req/5sec)
 *   2. Normalize and cache in MongoDB (ExternalEvent collection)
 *   3. Display on SpaksTrip with affiliate deep-links
 *   4. Transition to official API when partnership is approved
 *
 * START WITH Option B for immediate results.
 * Pursue Option A in parallel for long-term.
 *
 * SETUP REQUIRED:
 * 1. Add to .env: INSIDER_API_ENABLED=true (feature flag)
 * 2. Add to .env: INSIDER_API_KEY=xxxxx (when official API access is granted)
 * 3. For Option B, no API key needed
 *
 * CATEGORY MAPPING (Insider → SpaksTrip):
 *   'music'       → 'concert'
 *   'comedy'      → 'comedy_show'
 *   'workshops'   → 'workshop'
 *   'food'        → 'food_festival'
 *   'nightlife'   → 'nightlife'
 *   'theatre'     → 'theatre'
 *   'sports'      → 'sports'
 *   'exhibitions' → 'exhibition'
 *   'experiences' → 'other'
 */
```

### Step 2.4 — ExternalEvent Cache Model

```typescript
// MongoDB model to cache external events (avoids hitting APIs on every request)

source            : enum ['ticketmaster', 'insider']
sourceId          : String, required // external platform's event ID
sourceUrl         : String, required // original event URL
affiliateUrl      : String          // URL with tracking params

// Normalized event data (same shape as ExternalEvent interface)
title             : String
description       : String
category          : String // mapped to our enum
startDate         : Date
endDate           : Date
venue             : { name, city, state, country, coordinates }
images            : [String]
priceRange        : { min, max, currency }

// Cache management
fetchedAt         : Date, default Date.now
expiresAt         : Date // TTL — auto-delete after expiry
isActive          : Boolean, default true

// Compound unique index: { source, sourceId } — prevent duplicates
// TTL index on expiresAt — MongoDB auto-deletes expired docs
```

### Step 2.5 — Aggregation Cron Job

```typescript
// server/src/jobs/syncExternalEvents.ts

/*
 * Scheduled job (run every 6 hours via node-cron or similar):
 *
 * 1. Fetch events from each enabled source (Ticketmaster, Insider)
 * 2. Normalize to ExternalEvent format
 * 3. Upsert into ExternalEvent collection (update if exists, insert if new)
 * 4. Mark events past their endDate as inactive
 * 5. Log sync stats (fetched, inserted, updated, errors)
 *
 * RATE LIMITING:
 * - Ticketmaster: max 5 req/sec, 5000/day — batch carefully
 * - Insider: be respectful, 1 req/5sec if using public endpoints
 *
 * CITIES TO SYNC (start with top metros):
 * ['delhi', 'mumbai', 'bangalore', 'hyderabad', 'chennai',
 *  'kolkata', 'pune', 'ahmedabad', 'jaipur', 'goa']
 *
 * Feature flag: EXTERNAL_EVENTS_SYNC_ENABLED=true in .env
 */
```

### Step 2.6 — Unified Events API

The public `/api/v1/events` endpoint should return BOTH internal EventListings AND cached ExternalEvents, merged and sorted:

```typescript
// GET /api/v1/events?city=mumbai&category=concert&startDate=2026-07-01

/*
 * 1. Query EventListing (status: 'published', matching filters)
 * 2. Query ExternalEvent (isActive: true, matching filters)
 * 3. Merge results into a common response format
 * 4. Add a flag: { isExternal: boolean, bookingType: 'direct' | 'affiliate' }
 * 5. Sort by startDate ascending
 * 6. Paginate (use cursor-based pagination for merged results)
 *
 * Response shape for each event:
 * {
 *   id: string,
 *   title: string,
 *   slug: string,         // for internal events
 *   category: string,
 *   startDate: Date,
 *   endDate: Date,
 *   venue: { name, city },
 *   images: string[],
 *   priceRange: { min, max, currency },
 *   isFree: boolean,
 *   isExternal: boolean,
 *   bookingType: 'direct' | 'affiliate',
 *   affiliateUrl?: string, // only for external events
 *   source: 'internal' | 'ticketmaster' | 'insider'
 * }
 */
```

### Step 2.7 — Frontend for External Events

On the event detail page, handle both types:

```
IF event.isExternal === false (internal EventListing):
  → Show full event detail page with ticket selector + Razorpay "Book Now"
  → Same booking flow as Phase 1

IF event.isExternal === true (Ticketmaster/Insider):
  → Show event details (title, date, venue, description, images)
  → Instead of ticket selector, show:
      - Price range (if available)
      - "Book on {source}" button → opens affiliateUrl in new tab
      - Small disclaimer: "You will be redirected to {source} to complete your booking"
  → Track click-through for analytics
  → Do NOT show Razorpay checkout — this is an affiliate redirect
```

---

## ═══════════════════════════════════════════
## PHASE 3: BookMyShow Affiliate Integration
## ═══════════════════════════════════════════

### Step 3.1 — Affiliate Link Setup

```
/*
 * BookMyShow Affiliate Program:
 * - Available through Admitad, EarnKaro, CueLinks
 * - Earn ₹4.50–₹10 per successful ticket transaction
 * - Commission varies by city tier (Tier 2/3 cities preferred)
 *
 * SETUP:
 * 1. Register on Admitad (admitad.com) or CueLinks (cuelinks.com)
 * 2. Apply for BookMyShow affiliate program
 * 3. Get your affiliate tracking link template
 * 4. Add to .env: BOOKMYSHOW_AFFILIATE_BASE_URL=xxxxx
 *
 * HOW IT WORKS:
 * - When showing external events, construct deep-links like:
 *   https://in.bookmyshow.com/events/{eventSlug}?affiliate={yourId}
 * - Track which users click through (for your own analytics)
 * - Admitad/CueLinks dashboard shows your conversions and earnings
 *
 * IMPLEMENTATION:
 * - Add a "Popular on BookMyShow" section to the events page
 * - These are manually curated or scraped event cards
 * - Each card links out to BookMyShow with your affiliate params
 * - Simple, low-effort, immediate revenue potential
 */
```

---

## ═══════════════════════════════════════════
## PHASE 4: Supporting Infrastructure
## ═══════════════════════════════════════════

### Step 4.1 — Email Notifications

Using the EXISTING email service in the codebase:

- **Booking confirmation** — event name, date, venue, tickets, QR code, total paid
- **Booking cancellation** — refund amount, refund timeline
- **Event reminder** — 24 hours before event start (scheduled job)
- **Event update** — if organizer changes date/venue/time, notify all booked users
- **Partner notification** — new booking received, booking cancelled

### Step 4.2 — Environment Variables

```bash
# Add to .env (DO NOT commit actual values):

# Ticketmaster
TICKETMASTER_API_KEY=              # Get from developer.ticketmaster.com
TICKETMASTER_ENABLED=false         # Feature flag

# Paytm Insider
INSIDER_API_ENABLED=false          # Feature flag
INSIDER_API_KEY=                   # When official access is granted

# External events sync
EXTERNAL_EVENTS_SYNC_ENABLED=false # Master switch for cron sync
EXTERNAL_EVENTS_SYNC_CRON=0 */6 * * * # Every 6 hours
EXTERNAL_EVENTS_CACHE_TTL_HOURS=24 # Cache expiry

# BookMyShow Affiliate
BOOKMYSHOW_AFFILIATE_ID=          # From Admitad/CueLinks
BOOKMYSHOW_AFFILIATE_ENABLED=false

# Event booking
EVENT_BOOKING_HOLD_MINUTES=10     # Soft hold duration
EVENT_PLATFORM_FEE_PERCENT=5      # SpaksTrip service fee (%)
EVENT_GST_PERCENT=18              # GST on service fee
```

### Step 4.3 — Nav & Routing Updates

Update the existing Events nav item (it already exists in the header) to point to the new events pages:

```
Header nav "Events" → /events (public listing page)

New pages to create:
  /events                          — listing + search + filters
  /events/[slug]                   — event detail + booking
  /events/categories               — browse by category (optional, can be filters)

Partner dashboard:
  /partner/events                  — manage event listings
  /partner/events/create           — create new event
  /partner/events/[id]/edit        — edit event
  /partner/events/[id]/bookings    — view bookings

Customer dashboard:
  /dashboard/bookings/events       — my event bookings
  /dashboard/bookings/events/[ref] — booking details + QR code
```

---

## ═══════════════════════════════════════════
## EXECUTION ORDER
## ═══════════════════════════════════════════

```
STEP 1:  Audit existing partner resource pattern (read-only — no code yet)
STEP 2:  Create EventListing model + indexes + hooks
STEP 3:  Create EventBooking model + indexes
STEP 4:  Create partner CRUD routes + controllers (events)
STEP 5:  Create public event routes + controllers
STEP 6:  Create booking routes + Razorpay integration
STEP 7:  Test all API routes with sample data (seed script)
STEP 8:  Create partner dashboard pages (event CRUD forms)
STEP 9:  Create public events listing page + detail page
STEP 10: Create customer booking flow (frontend)
STEP 11: Create ExternalEvent model + cache
STEP 12: Build Ticketmaster integration service
STEP 13: Build Insider.in integration service (Option B — affiliate deep-link)
STEP 14: Build aggregation cron job
STEP 15: Merge external events into unified /events API
STEP 16: Update frontend to handle external vs internal events
STEP 17: Add email notifications
STEP 18: Add event reminder cron job
STEP 19: End-to-end testing of full flow
STEP 20: Environment variable documentation
```

**After each step:** confirm the step is complete, show what was created, and verify nothing existing is broken before proceeding to the next step.

---

## ═══════════════════════════════════════════
## TESTING CHECKLIST
## ═══════════════════════════════════════════

Before declaring any step complete:

- [ ] All existing tests still pass
- [ ] The new feature works with all 4 auth roles correctly
- [ ] Partner can only see/edit their own events
- [ ] Public API only returns published events
- [ ] Ticket prices are server-validated (client can't manipulate)
- [ ] Inventory can't go negative (race condition test)
- [ ] Razorpay payment flow works end-to-end
- [ ] Agent subdomain correctly applies markup to event ticket prices
- [ ] External events display correctly with affiliate links
- [ ] External event "Book Now" opens correct URL in new tab
- [ ] No existing features are broken (flights, hotels, partner resources, auth)
- [ ] Mobile responsive at 375px
- [ ] All new routes are behind correct auth middleware

---

## FINAL REMINDERS

1. **Read before writing.** Spend the first 15 minutes reading existing code patterns. Every file you create should feel like it was written by the same developer who wrote the existing partner resources.

2. **No new libraries unless essential.** The codebase already has Razorpay, Mongoose, Cloudinary, email utilities. Use what exists. The only new packages allowed: `qrcode` (for QR generation), `node-cron` (if not already present, for scheduled jobs).

3. **Feature flags everything.** External API integrations are behind environment flags so they can be disabled without code changes.

4. **Test with the agent subdomain.** After building the booking flow, verify it works on agent.spakstrip.com with markup applied. This is the flow your agents will use to sell event tickets to their clients.

5. **Zero regression tolerance.** If at any point an existing feature stops working, stop immediately and fix it before proceeding.