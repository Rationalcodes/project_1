# KUMBHAKARAN – Multi-Salon Discovery & Management Platform

> **"Too lazy to call. Too smart to wait."**

KUMBHAKARAN is an enterprise SaaS multi-salon discovery and walk-in transparency ecosystem. It connects customers with local salons through live waiting visibility, eliminating phone calls, manual price comparisons, and blind visits to crowded salons.

---

## 🚫 Crucial Business Rule
**Kumbhakaran DOES NOT provide virtual queues, online queue joining, appointment booking, reservation systems, or digital tokens.**

Customers simply view the live number of people currently waiting at each salon, compare service prices and ratings, and independently decide when and where to walk in.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend** | Node.js, TypeScript, **NestJS v11**, **Fastify**, Fastify CORS, Swagger OpenAPI |
| **Database** | **Supabase PostgreSQL** with **PostGIS Spatial Extension** (`SRID 4326`) |
| **ORM & Spatial** | **Prisma ORM** + Parameterized PostGIS Raw SQL (`ST_DWithin`, `ST_Distance`) |
| **Telemetry & Real-Time** | Physical Walk-In Queue Sync, Socket.IO Gateway, Redis & BullMQ |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v20+ or v22+ (`node -v`)
- **npm** v10+ (`npm -v`)
- **Supabase Account** with PostgreSQL & PostGIS enabled

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:
```env
# Port & Environment
PORT=3001
NODE_ENV=development

# Supabase PostgreSQL Connection String (PostGIS Enabled)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST].supabase.co:5432/postgres

# Google Maps API Key (Optional for live interactive map vector rendering)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

> 🔒 **Security Notice**: Never commit `.env.local` to version control. Credentials should remain exclusively in your local `.env.local` file.

### 3. Install Dependencies
```bash
# Install frontend & root dependencies
npm install

# Install backend dependencies
npm install --prefix backend
```

### 4. Generate Prisma Client
```bash
npm run --prefix backend prisma:generate
```

### 5. Verify Database & PostGIS Setup
Run the built-in diagnostic test suite to verify connectivity and schema health:
```bash
npm run backend:test:db
```
This inspects:
1. PostgreSQL engine connectivity & version
2. PostGIS extension availability (`PostGIS_Full_Version()`)
3. Platform tables (`salons`, `salon_services`, `salon_staff`, `salon_reviews`)
4. PostGIS geography column (`salons.location`)
5. GiST spatial index (`idx_salons_location_gist`)

---

## 💻 Running the Platform

### Start the NestJS Fastify Backend
```bash
npm run start:dev
```
Or directly from the backend folder:
```bash
cd backend
npm run start:dev
```

- **API Base**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Interactive Swagger Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **System & PostGIS Health Diagnostic**: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

### Start the React Frontend
```bash
npm run dev
```
- **Customer & Partner Portal**: [http://localhost:5173](http://localhost:5173)

---

## 🗄️ Database Schema & PostGIS Strategy

The database uses Supabase PostgreSQL with the PostGIS extension for spatial queries:

```sql
-- 1. PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Salons Table with Geography Point
CREATE TABLE IF NOT EXISTS salons (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    current_queue INTEGER DEFAULT 0 CHECK (current_queue >= 0),
    avg_service_time_minutes INTEGER DEFAULT 20,
    active_barbers INTEGER DEFAULT 2,
    is_open BOOLEAN DEFAULT TRUE,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    ...
);

-- 3. Lightning-Fast GiST Spatial Index
CREATE INDEX IF NOT EXISTS idx_salons_location_gist 
ON salons USING GIST (location);
```

### Prisma Integration
Prisma models geography columns as `Unsupported("geography(Point, 4326)")`. Standard relational CRUD operations are handled via Prisma Client, while spatial operations (`ST_DWithin`, `ST_Distance`) use parameterized raw SQL queries adhering strictly to the PostGIS **longitude first, latitude second** convention (`ST_MakePoint(lng, lat)`).

---

## 🩺 System Health Endpoint

`GET /api/v1/health` provides real-time system and database diagnostics:

```json
{
  "status": "operational",
  "service": "Kumbhakaran API (NestJS + Fastify)",
  "version": "1.0.0",
  "timestamp": "2026-11-03T12:00:00.000Z",
  "uptimeSeconds": 45,
  "environment": "development",
  "database": {
    "connected": true,
    "postgresVersion": "PostgreSQL 15.1...",
    "postgis": {
      "available": true,
      "version": "3.3.2"
    },
    "tables": {
      "salons": true,
      "salon_services": true,
      "salon_staff": true,
      "salon_reviews": true,
      "allPresent": true
    },
    "spatialColumn": {
      "available": true,
      "tableName": "salons",
      "columnName": "location"
    },
    "spatialIndex": {
      "available": true,
      "indexName": "idx_salons_location_gist"
    }
  }
}
```

---

## 📱 Three Integrated Portals

1. **Customer Portal**: Frictionless salon discovery (customer name only, no phone/OTP requirements), live queue transparency, estimated wait times, and Lazy Mode filtering.
2. **Partner / Salon Owner Portal**: Live walk-in counter adjustments (`+1`, `-1`, manual override), barber rosters, service catalog management, and interactive Google Maps pin placement.
3. **Platform Admin Console**: Verification badges, platform-wide analytics, and content moderation.
