-- ==============================================================================
-- 20261019000007_seed_data.sql
-- PowerStar Platform v2 — Seed 42 Service Categories, Verified Providers & Settings
-- ==============================================================================

-- 1. SEED 42 SERVICE CATEGORIES & RATE CARDS
-- Drop legacy unique constraint on name and normalize legacy slugs to prevent 23505 duplicate key error
DO $$ BEGIN
  ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_name_key;
  DROP INDEX IF EXISTS service_categories_name_key;

  UPDATE public.service_categories SET slug = 'dl' 
  WHERE (name ILIKE '%driving%license%' OR slug = 'driving-license') AND slug != 'dl'
    AND NOT EXISTS (SELECT 1 FROM public.service_categories WHERE slug = 'dl');

  UPDATE public.service_categories SET slug = 'passing' 
  WHERE (name ILIKE '%vehicle%passing%' OR slug = 'vehicle-passing') AND slug != 'passing'
    AND NOT EXISTS (SELECT 1 FROM public.service_categories WHERE slug = 'passing');
EXCEPTION WHEN OTHERS THEN null;
END $$;

INSERT INTO public.service_categories (name, name_kn, slug, icon, type, base_price, price_unit, sort_order, description) VALUES
-- Manpower (20)
('Electrician', 'ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ', 'electrician', '⚡', 'manpower', 280, '/hr', 1, 'Wiring, fans, switches, MCB, inverter installation'),
('Mason / Gowndi', 'ಮೇಸ್ತ್ರಿ', 'mason', '🧱', 'manpower', 350, '/hr', 2, 'Brick laying, plastering, concrete, RCC work'),
('Plumber', 'ನಲ್ಲಿ ಕೆಲಸ', 'plumber', '🔧', 'manpower', 260, '/hr', 3, 'Pipe fitting, leakage, tank cleaning, bathroom fitting'),
('Centring Worker', 'ಸೆಂಟ್ರಿಂಗ್', 'centring', '🏗️', 'manpower', 300, '/hr', 4, 'Formwork, shuttering for RCC slabs and beams'),
('Tile Worker', 'ಟೈಲ್ ಕೆಲಸ', 'tile-worker', '🪣', 'manpower', 290, '/hr', 5, 'Floor & wall tile fixing, marble, granite work'),
('Construction Worker', 'ಕಟ್ಟಡ ಕಾರ್ಮಿಕ', 'construction', '👷', 'manpower', 250, '/hr', 6, 'Concrete mixing, material carrying, site support'),
('Home Cleaning', 'ಮನೆ ಸ್ವಚ್ಛತೆ', 'cleaning', '🧹', 'manpower', 200, '/hr', 7, 'Deep cleaning, bathroom, kitchen, sofa cleaning'),
('Home Shifting', 'ಮನೆ ಸ್ಥಳಾಂತರ', 'shifting', '📦', 'manpower', 1200, '/job', 8, 'Packing, loading, transport & unloading'),
('Ground Work Labor', 'ಮಣ್ಣಿನ ಕೆಲಸ', 'groundwork', '🌱', 'manpower', 240, '/hr', 9, 'Digging, levelling, trench, foundation work'),
('Driver', 'ಚಾಲಕ', 'driver', '🚗', 'manpower', 350, '/hr', 10, 'Licensed LMV/HMV driver for personal or commercial'),
('Helper', 'ಸಹಾಯಕ', 'helper', '🤝', 'manpower', 180, '/hr', 11, 'General helper for any work'),
('Loading / Unloading', 'ಲೋಡಿಂಗ್', 'loading', '💪', 'manpower', 200, '/hr', 12, 'Loading goods from trucks, containers, warehouses'),
('Hospital Helper', 'ಆಸ್ಪತ್ರೆ ಸಹಾಯ', 'hospital', '🏥', 'manpower', 220, '/hr', 13, 'Patient attendant, ward boy, stretcher bearer'),
('Garment Worker', 'ಉಡುಪು ಕೆಲಸ', 'garment', '🪡', 'manpower', 190, '/hr', 14, 'Stitching, fabric cutting, tailoring'),
('Hotel Staff', 'ಹೋಟೆಲ್ ಸಿಬ್ಬಂದಿ', 'hotel', '🏨', 'manpower', 200, '/hr', 15, 'Waiter, cook helper, housekeeping'),
('Office Worker', 'ಕಚೇರಿ ಕೆಲಸ', 'office', '🏢', 'manpower', 220, '/hr', 16, 'Office boy, peon, data entry support'),
('Financial Worker', 'ಹಣಕಾಸು', 'financial-worker', '🏦', 'manpower', 300, '/hr', 17, 'Loan recovery, field collection, banking support'),
('Agricultural Worker', 'ಕೃಷಿ ಕಾರ್ಮಿಕ', 'agriculture', '🌾', 'manpower', 220, '/hr', 18, 'Harvesting, planting, irrigation, farm work'),
('Delivery Worker', 'ಡೆಲಿವರಿ', 'delivery', '📬', 'manpower', 180, '/hr', 19, 'Local parcel, courier, document delivery'),
('Security Guard', 'ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ', 'security', '🛡️', 'manpower', 240, '/hr', 20, 'Site, building, event security'),
-- Vehicles (13)
('Tata Ace', 'ಟಾಟಾ ಏಸ್', 'tata-ace', '🚐', 'vehicle', 899, '/trip', 21, 'Mini truck for light goods (750 kg)'),
('Bolero Pickup', 'ಬೊಲೆರೊ', 'bolero', '🛻', 'vehicle', 1299, '/trip', 22, 'Medium pickup for construction material (1.2 ton)'),
('Tata Intra', 'ಟಾಟಾ ಇಂಟ್ರಾ', 'tata-intra', '🚐', 'vehicle', 1099, '/trip', 23, 'City logistics and last-mile delivery (1 ton)'),
('407 Truck', '407 ಟ್ರಕ್', 'truck-407', '🚛', 'vehicle', 2199, '/trip', 24, 'Inter-city goods & furniture transport (2.5 ton)'),
('Lorry', 'ಲಾರಿ', 'lorry', '🚚', 'vehicle', 3500, '/trip', 25, 'Heavy lorry for bulk goods (5–9 ton)'),
('Tempo', 'ಟೆಂಪೋ', 'tempo', '🚌', 'vehicle', 1499, '/trip', 26, 'Medium goods van for city transport (1.5 ton)'),
('Tractor', 'ಟ್ರ್ಯಾಕ್ಟರ್', 'tractor', '🚜', 'vehicle', 2800, '/day', 27, 'Farm tractor for agricultural & site work'),
('JCB Excavator', 'ಜೆಸಿಬಿ', 'jcb', '🏗️', 'vehicle', 4500, '/day', 28, 'Backhoe loader for digging & demolition'),
('Hitachi Excavator', 'ಹಿಟಾಚಿ', 'hitachi', '⛏️', 'vehicle', 4800, '/day', 29, 'Heavy excavator for deep digging & mining'),
('Crane', 'ಕ್ರೇನ್', 'crane', '🏗️', 'vehicle', 8000, '/day', 30, 'Mobile crane for heavy lifting (10–50 ton)'),
('Water Tanker', 'ನೀರಿನ ಟ್ಯಾಂಕರ್', 'tanker', '🚰', 'vehicle', 1800, '/trip', 31, 'Water supply for sites & farms (8,000 L)'),
('Auto Riksha', 'ಆಟೋ', 'auto', '🛺', 'vehicle', 349, '/trip', 32, 'Three-wheeler for small parcel delivery'),
('3-Wheeler Riksha', 'ರಿಕ್ಷಾ', 'riksha', '🛺', 'vehicle', 299, '/trip', 33, 'Electric/petrol 3-wheeler hyper-local delivery'),
-- RTO (5)
('Vehicle Insurance', 'ವಾಹನ ವಿಮೆ', 'insurance', '🛡️', 'rto', 500, '/svc', 34, 'New, renewal & comprehensive insurance'),
('PUC Certificate', 'ಪಿಯುಸಿ', 'puc', '📋', 'rto', 200, '/svc', 35, 'Pollution Under Control certificate'),
('Driving License', 'ಚಾಲನಾ ಪರವಾನಗಿ', 'dl', '🪪', 'rto', 800, '/svc', 36, 'New DL, renewal, duplicate, category addition'),
('Vehicle Passing', 'ವಾಹನ ಫಿಟ್ನೆಸ್', 'passing', '✅', 'rto', 600, '/svc', 37, 'Fitness certificate & registration renewal'),
('GPS Installation', 'ಜಿಪಿಎಸ್', 'gps', '📍', 'rto', 1200, '/svc', 38, 'AIS140 GPS for commercial vehicles'),
-- Financial (4)
('Vehicle Loan', 'ವಾಹನ ಸಾಲ', 'vehicle-loan', '🚗', 'financial', 0, '/svc', 39, 'New & used vehicle financing'),
('Insurance Loan', 'ವಿಮಾ ಸಾಲ', 'insurance-loan', '📄', 'financial', 0, '/svc', 40, 'Loan against LIC policy'),
('Tyre Loan', 'ಟೈರ್ ಸಾಲ', 'tyre-loan', '⭕', 'financial', 0, '/svc', 41, 'Easy EMI tyre purchase for commercial vehicles'),
('Personal Loan', 'ವೈಯಕ್ತಿಕ ಸಾಲ', 'personal-loan', '💰', 'financial', 0, '/svc', 42, 'Instant personal loans for all workers')
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  name_kn     = EXCLUDED.name_kn,
  icon        = EXCLUDED.icon,
  type        = EXCLUDED.type,
  base_price  = EXCLUDED.base_price,
  price_unit  = EXCLUDED.price_unit,
  description = EXCLUDED.description;

-- 2. SEED VERIFIED PROVIDERS & LIVE TRACKING
-- Provider 1: Basavaraj Patil (Electrician)
INSERT INTO public.profiles (id, role, full_name, phone, district, city, is_active)
VALUES ('00000000-0000-4000-a000-009845012345', 'provider', 'Basavaraj Patil (Master Electrician)', '+91 98450 12345', 'Bengaluru Urban', 'Koramangala', true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.providers (id, category_id, experience_years, hourly_rate, bio, skills_tags, service_radius, is_online, kyc_status, rating, total_reviews, total_jobs, total_earnings)
SELECT '00000000-0000-4000-a000-009845012345', id, 6, 280, 'Certified Master Electrician & Power Systems Specialist', ARRAY['Wiring', 'Inverters', 'MCB', 'Appliances'], 35, true, 'verified', 4.90, 142, 310, 86800
FROM public.service_categories WHERE slug = 'electrician'
ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, kyc_status = EXCLUDED.kyc_status, is_online = true;

INSERT INTO public.provider_locations (provider_id, latitude, longitude, heading, speed, accuracy)
VALUES ('00000000-0000-4000-a000-009845012345', 12.9352, 77.6245, 45, 18, 5)
ON CONFLICT (provider_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Provider 2: Manjunath Gowda (Plumber)
INSERT INTO public.profiles (id, role, full_name, phone, district, city, is_active)
VALUES ('00000000-0000-4000-a000-009448067890', 'provider', 'Manjunath Gowda (Master Plumber)', '+91 94480 67890', 'Bengaluru Urban', 'Jayanagar', true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.providers (id, category_id, experience_years, hourly_rate, bio, skills_tags, service_radius, is_online, kyc_status, rating, total_reviews, total_jobs, total_earnings)
SELECT '00000000-0000-4000-a000-009448067890', id, 8, 260, 'Expert Residential & Commercial Plumbing Contractor', ARRAY['Leakage', 'Pipes', 'Sanitary', 'Tanks'], 30, true, 'verified', 4.85, 98, 245, 63700
FROM public.service_categories WHERE slug = 'plumber'
ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, kyc_status = EXCLUDED.kyc_status, is_online = true;

INSERT INTO public.provider_locations (provider_id, latitude, longitude, heading, speed, accuracy)
VALUES ('00000000-0000-4000-a000-009448067890', 12.9250, 77.5938, 90, 15, 6)
ON CONFLICT (provider_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Provider 3: Ramesh Kumbar (Tata Ace)
INSERT INTO public.profiles (id, role, full_name, phone, district, city, is_active)
VALUES ('00000000-0000-4000-a000-009980054321', 'provider', 'Ramesh Kumbar (Tata Ace Logistics)', '+91 99800 54321', 'Bengaluru Urban', 'Yeshwanthpur', true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.providers (id, category_id, experience_years, hourly_rate, bio, skills_tags, service_radius, is_online, kyc_status, rating, total_reviews, total_jobs, total_earnings)
SELECT '00000000-0000-4000-a000-009980054321', id, 5, 899, 'Commercial Goods Transport & Tata Ace Fast Delivery', ARRAY['750kg Goods', 'Fast Transit', 'Careful Handling'], 50, true, 'verified', 4.92, 180, 412, 370388
FROM public.service_categories WHERE slug = 'tata-ace'
ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, kyc_status = EXCLUDED.kyc_status, is_online = true;

INSERT INTO public.provider_locations (provider_id, latitude, longitude, heading, speed, accuracy)
VALUES ('00000000-0000-4000-a000-009980054321', 13.0280, 77.5407, 180, 30, 8)
ON CONFLICT (provider_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Provider 4: Anand Kumar (Cleaning)
INSERT INTO public.profiles (id, role, full_name, phone, district, city, is_active)
VALUES ('00000000-0000-4000-a000-009741011223', 'provider', 'Anand Kumar (Cleaning Specialist)', '+91 97410 11223', 'Bengaluru Urban', 'Indiranagar', true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.providers (id, category_id, experience_years, hourly_rate, bio, skills_tags, service_radius, is_online, kyc_status, rating, total_reviews, total_jobs, total_earnings)
SELECT '00000000-0000-4000-a000-009741011223', id, 4, 200, 'Professional Home Deep Cleaning & Sanitization Team Leader', ARRAY['Deep Clean', 'Kitchen', 'Bathroom', 'Sofa'], 25, true, 'verified', 4.80, 76, 160, 32000
FROM public.service_categories WHERE slug = 'cleaning'
ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, kyc_status = EXCLUDED.kyc_status, is_online = true;

INSERT INTO public.provider_locations (provider_id, latitude, longitude, heading, speed, accuracy)
VALUES ('00000000-0000-4000-a000-009741011223', 12.9784, 77.6408, 270, 10, 4)
ON CONFLICT (provider_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- 3. SEED PLATFORM SETTINGS
INSERT INTO public.platform_settings (key, value) VALUES
  ('admin_upi_id', 'powerstar@upi'),
  ('admin_upi_name', 'Powerstar Services'),
  ('platform_fee_percent', '0'),
  ('gst_percent', '0'),
  ('nominal_token_rate', '11'),
  ('support_phone', '+91 80 4567 8900'),
  ('support_email', 'support@powerstar.in')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
