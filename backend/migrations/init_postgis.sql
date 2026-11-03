-- ==============================================================================
-- KUMBHAKARAN PLATFORM - POSTGIS GEOGRAPHICAL SALON SCHEMA
-- ==============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Salons Table with Geographical Point (WGS 84 / SRID 4326)
CREATE TABLE IF NOT EXISTS salons (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    locality VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(20) NOT NULL,
    
    -- Spatial coordinates
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    cover_image TEXT,
    opening_hours_open VARCHAR(20) DEFAULT '09:00 AM',
    opening_hours_close VARCHAR(20) DEFAULT '09:30 PM',
    opening_hours_formatted VARCHAR(100) DEFAULT '09:00 AM – 09:30 PM (All Days)',
    
    -- Live walk-in queue telemetry
    current_queue INTEGER DEFAULT 0 CHECK (current_queue >= 0),
    avg_service_time_minutes INTEGER DEFAULT 20,
    active_barbers INTEGER DEFAULT 2 CHECK (active_barbers >= 1),
    is_open BOOLEAN DEFAULT TRUE,
    last_queue_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Platform governance
    rating NUMERIC(2, 1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    starting_price NUMERIC(10, 2) DEFAULT 150.0,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, pending
    
    today_customers_served INTEGER DEFAULT 0,
    today_revenue NUMERIC(12, 2) DEFAULT 0.0,
    monthly_revenue NUMERIC(12, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Spatial GiST Index for Lightning-Fast PostGIS ST_DWithin Searches
CREATE INDEX IF NOT EXISTS idx_salons_location_gist 
ON salons USING GIST (location);

-- 4. B-Tree Indexes for Filtering
CREATE INDEX IF NOT EXISTS idx_salons_status_open 
ON salons (status, is_open);

CREATE INDEX IF NOT EXISTS idx_salons_rating 
ON salons (rating DESC);

CREATE INDEX IF NOT EXISTS idx_salons_current_queue 
ON salons (current_queue ASC);

-- 5. Services Table
CREATE TABLE IF NOT EXISTS salon_services (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Hair, Beard, Combos, Spa, Facial, Color
    price NUMERIC(10, 2) NOT NULL,
    duration_minutes INTEGER DEFAULT 20,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_salon_category 
ON salon_services (salon_id, category);

-- 6. Stylists / Staff Table
CREATE TABLE IF NOT EXISTS salon_staff (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Master Barber',
    experience VARCHAR(50),
    specialties TEXT[],
    photo TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, break, off
    rating NUMERIC(2, 1) DEFAULT 4.9,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Customer Reviews Table (Zero unnecessary personal data: Customer Name only!)
CREATE TABLE IF NOT EXISTS salon_reviews (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) REFERENCES salons(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL, -- Only name required!
    customer_avatar TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified_visit BOOLEAN DEFAULT TRUE,
    
    -- 5 Criteria breakdown
    haircut_quality INTEGER DEFAULT 5,
    staff_behaviour INTEGER DEFAULT 5,
    cleanliness INTEGER DEFAULT 5,
    pricing INTEGER DEFAULT 5,
    overall_experience INTEGER DEFAULT 5,
    
    owner_reply TEXT,
    owner_reply_date TIMESTAMP WITH TIME ZONE,
    flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
