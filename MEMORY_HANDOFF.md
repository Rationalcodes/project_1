# MEMORY HANDOFF – KUMBHAKARAN (SLOON) PLATFORM

> **Purpose**: This document provides complete context, architectural breakdown, current state of all features, and engineering invariants so that any new LLM session can immediately pick up work on the project with zero context loss.

---

## 1. Project Snapshot & Meta

* **Product Name**: KUMBHAKARAN (Branded as **SLOON**)
* **Tagline**: *"Too lazy to call. Too smart to wait."*
* **Core Philosophy**: An on-demand multi-salon discovery and authentic walk-in transparency network. Kumbhakaran **does not** do rigid scheduled appointments that salons fail to keep. Instead, it provides real-time queue visibility (number of people waiting right now, estimated wait minutes, barber status), live digital tokens (`#01`, `#02`), and in-app road navigation.
* **Production URLs**: `https://www.kumbhkaransalons.in` • `https://sloon.in`
* **Repository**: `https://github.com/Rationalcodes/project_1.git`
* **Active Git Branch**: `main`
* **Target Environment**: Windows 11 (PowerShell environment), Node.js v20+, pnpm workspaces.

---

## 2. Monorepo Structure

```
KSalon/
├── apps/
│   ├── customer-web/       # Customer discovery, in-app map, live queue tokens, studio details
│   ├── partner-web/        # Salon owner & barber management portal
│   └── admin-web/          # Platform operator verification & moderation console
├── backend/
│   ├── prisma/             # Prisma schema (PostGIS PostgreSQL on Supabase)
│   └── src/
│       ├── modules/
│       │   ├── admin/      # Admin audit logs, approvals
│       │   ├── auth/       # Google OAuth, JWT, sessions
│       │   ├── discovery/  # PostGIS spatial salon discovery queries
│       │   ├── health/     # Database and system health checks
│       │   └── salons/     # Salon CRUD, queue state machine, WebSockets
│       ├── app.module.ts
│       └── main.ts         # Fastify bootstrap & CORS
├── packages/
│   ├── api-client/         # Standardized typed HTTP client
│   ├── shared-types/       # Canonical TypeScript domain types (Salon, Staff, Service, etc.)
│   └── ui/                 # SalonMapboxView (Leaflet/Mapbox hybrid), routing.ts, toasts
└── public/                 # Brand assets
```

---

## 3. Recent Features & Exact Codebase State

### A. Salon Detail Layout Wireframe Match (`apps/customer-web`)
* **File**: `apps/customer-web/src/components/customer/SalonDetailScreen.tsx`
* **Implemented Layout** (matches user's hand-drawn wireframe):
  1. **Top Navigation Bar**: Retained Back button, Compare, Share, and Favorite buttons.
  2. **Top Navigation Tabs (Above Salon Card)**:
     - `[ Live Queue | Services | Showcase ]`
     - Tapping any tab opens its section above the salon card (`activeTab === 'queue' | 'services' | 'gallery'`).
     - Tapping the active tab collapses it cleanly so the card stays prominently in view.
  3. **Salon Card (In The Middle)**:
     - Hero carousel / continuous loop video with audio toggle.
     - Verified Salon badge, Open/Closed badge, queue status badge.
     - Salon name, tagline, rating, and active ticket token (`#01`).
     - **Location Section on Card**: Clickable location card with address, locality, distance, and a prominent **"Pinned Map"** button.
     - Clicking the location card opens `showInAppMap`, displaying the interactive in-app pinned map directly on the website.
  4. **Bottom Navigation Tabs (Below Salon Card)**:
     - `[ Stylists | Reviews ]`
     - Tapping either tab renders stylist profiles or 5-criteria ratings and reviews below the card.

### B. Hybrid Road Navigation & Off-Road Connectors
* **Files**: `packages/ui/src/routing.ts`, `packages/ui/src/SalonMapboxView.tsx`, `apps/customer-web/src/components/customer/MapScreen.tsx`
* **Routing Logic**:
  - Pure road routing snaps to streets. If a user is 50–200m away inside a complex, or if a salon is set back in a plaza, it creates a visual and functional disconnect.
  - **The 3-Part Hybrid Engine**:
    1. **User Off-Road Connector**: Dashed line (`5, 7`) from User GPS to nearest road access point (if displacement `> 8m`).
    2. **Road Path**: Solid driving route along actual streets with white outline casing (`weight: 7`) + primary brand color (`weight: 4.5`).
    3. **Shop Off-Road Connector**: Dashed line (`5, 7`) from road exit point to the salon's exact pinpoint.
    4. **Off-Grid Fallback**: If routing services (OSRM/Google) return no route or user is completely off-grid, falls back to direct displacement line with `isRoadRoute: false`.
  - Implemented across both **Mapbox GL JS** and **Leaflet / OpenStreetMap** with instant resize invalidation and loading skeleton.

### C. Google Translate Integration & Partner OS Renaming (`apps/partner-web`)
* **Files**: 
  - `apps/partner-web/index.html`
  - `apps/partner-web/src/i18n/googleTranslate.ts`
  - `apps/partner-web/src/i18n/LanguageContext.tsx`
  - `apps/partner-web/src/index.css`
  - `apps/partner-web/src/App.tsx`
* **Key Updates**:
  1. **Direct Google Translate Engine**: Added Google Translate script (`translate_a/element.js`) in `index.html`. Dynamically translates all UI text, reviews, and custom service descriptions on the fly without requiring manual JSON dictionaries.
  2. **Default Language**: Set **English (`'en'`)** as the default portal language. English is placed at the top (index 0) of the language list, followed by Hindi, Marathi, Gujarati, etc.
  3. **Floating Logo Suppression**: Google's floating circular logo widget (`.VIpgJd-ZVi9od-aZ2wEe-wOHMyf`, `[class*="VIpgJd"]`, `.goog-te-spinner-pos`, `.goog-te-banner-frame`) has been completely hidden using inline `<style>` and a client-side `MutationObserver`.
  4. **Branding**: Renamed all instances of `"Partner OS"` to simply `"Partner"`.
  5. **Brand Protection**: Wrapped logo in `notranslate` so "SLOON" is never awkwardly transliterated.

### D. Real-Time Dynamic Stats (No Hardcoding) (`apps/partner-web`)
* **File**: `apps/partner-web/src/components/owner/OwnerApp.tsx`
* **Key Updates**:
  - **Customers Today**: Dynamically counted from actual completed queue entries (`queueEntries.filter(e => e.status === 'completed')`). Starts realistically at `0` for new salons.
  - **Today's & Monthly Revenue**: Dynamically calculated by summing prices of completed walk-in services.
  - **Peak Rush Hours**: Grouped into 2-hour slots (`9 AM`, `11 AM`, `1 PM`, `3 PM`, `5 PM`, `7 PM`, `9 PM`) based on actual `joinedAt`/`servedAt` timestamps of today's queue entries. Starts at `0` with *"Awaiting walk-in rush data"*, dynamically highlighting peak hours as customers arrive.
  - **Analytics Tab**: Replaced fake `"194 Customers / +14% growth"` with actual completed counts and top in-demand service ranking.

---

## 4. Key Data Models & User Roles

| Role | Scope | Storage Location | Key Permissions |
| :--- | :--- | :--- | :--- |
| **`CUSTOMER`** | Global | `User.role` | Explore salons, check queues, join live walk-in queue, get digital tokens, in-app map navigation, submit 5-criteria reviews. |
| **`PARTNER_OWNER`** | Salon-scoped | `SalonMember.role` | Manage walk-in counter (`+1`, `-1`), call next ticket, mark in-service, complete checkout, manage staff roster, services menu, media showcase, precise map pin. |
| **`PARTNER_STAFF`** | Salon-scoped | `SalonMember.role` & `SalonStaff` | Toggle chair availability (`AVAILABLE`, `IN_SERVICE`, `BREAK`), view assigned tickets, log service session completion. |
| **`ADMIN`** | Global | `User.role` | Verify salons (`isVerified`), suspend/activate listings, moderate reviews, review `AdminAuditLog`, track city-level analytics. |

---

## 5. Critical Invariants for Any LLM Working on this Codebase

1. **No Rigid Booking Systems**:
   - Do NOT introduce fixed-time booking slots, calendar reservation pickers, or upfront online payment gates for time slots. The platform's core identity is walk-in queue transparency.
2. **PostGIS Conventions**:
   - Coordinates are stored as `Unsupported("geography(Point, 4326)")`.
   - All spatial SQL queries must follow PostGIS **longitude first, latitude second** convention: `ST_MakePoint(lng, lat)` or `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.
3. **PowerShell Execution Rules**:
   - In PowerShell, do NOT use `&&` to chain commands (e.g. `git add . && git commit`).
   - Use `;` (e.g. `git add -A; git commit -m '...'`) or run commands individually.
4. **Verification Builds**:
   - Always verify customer web with `pnpm --filter @kumbhakaran/customer-web build` and partner web with `pnpm --filter @kumbhakaran/partner-web build` before concluding changes.
5. **Git Protocol**:
   - Always check `git status` before committing.
   - Target branch is `main`.

---

## 6. Current Git Log (Top Commits)

* `c9ba91e` - `feat(partner): set English as the default language for partner portal`
* `aebaf98` - `feat(partner): replace hardcoded stats with real-time dynamic queue and revenue telemetry`
* `b9cc781` - `fix(partner): rename Partner OS branding to Partner across header and title`
* `5baf721` - `fix(partner): hide Google Translate spinning logo, floating bubble and banner widgets`
* `117e076` - `feat(partner): integrate browser Google Translate widget for automatic multilingual translation`
* `010a883` - `docs: add comprehensive engineering architecture and roles documentation`
* `ddbafe2` - `feat(customer): layout wireframe match (top tabs, salon card with pinned map, bottom tabs) & hybrid road routing`

---
*Generated for seamless LLM context transfer • November 2026*
