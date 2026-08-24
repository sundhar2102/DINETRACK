-- SmartTable AI Relational Database Schema
-- Compatible with MySQL 8.0+ and SQLite3 Relational Engine

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'OWNER', 'STAFF', 'ADMIN'
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100) NOT NULL,
    price_range VARCHAR(10) DEFAULT '$$', -- '$', '$$', '$$$', '$$$$'
    rating DECIMAL(3, 2) DEFAULT 4.5,
    rating_count INT DEFAULT 0,
    phone VARCHAR(20),
    email VARCHAR(150),
    image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    is_open BOOLEAN DEFAULT 1,
    verification_status VARCHAR(30) DEFAULT 'APPROVED', -- 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED'
    is_verified BOOLEAN DEFAULT 1,
    fssai_license VARCHAR(100),
    admin_notes TEXT,
    opening_time VARCHAR(10) DEFAULT '09:00',
    closing_time VARCHAR(10) DEFAULT '23:00',
    avg_dining_duration_mins INT DEFAULT 45,
    crowd_level VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'FULL'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Restaurant Locations Table
CREATE TABLE IF NOT EXISTS restaurant_locations (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) UNIQUE NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 4. Tables Table
CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    section VARCHAR(50) DEFAULT 'Main Dining', -- 'Main Dining', 'Outdoor Patio', 'VIP Lounge', 'Rooftop', 'Bar'
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'OCCUPIED', 'PREPARING', 'CLEANING', 'OUT_OF_SERVICE'
    current_reservation_id VARCHAR(36),
    occupied_since DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 5. Table Status History
CREATE TABLE IF NOT EXISTS table_status_history (
    id VARCHAR(36) PRIMARY KEY,
    table_id VARCHAR(36) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id VARCHAR(36),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- 6. Menu Categories Table
CREATE TABLE IF NOT EXISTS menu_categories (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 7. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    prep_time_minutes INT DEFAULT 15,
    is_vegetarian BOOLEAN DEFAULT 0,
    is_vegan BOOLEAN DEFAULT 0,
    is_gluten_free BOOLEAN DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    image_url VARCHAR(500),
    spiciness_level VARCHAR(20) DEFAULT 'MILD', -- 'NONE', 'MILD', 'MEDIUM', 'SPICY', 'EXTRA_HOT'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

-- 8. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    table_id VARCHAR(36),
    guest_count INT NOT NULL,
    reservation_date VARCHAR(20) NOT NULL,
    reservation_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'SEATED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'
    special_requests TEXT,
    estimated_arrival_minutes INT DEFAULT 15,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- 8b. Reservation Status History Table
CREATE TABLE IF NOT EXISTS reservation_status_history (
    id VARCHAR(36) PRIMARY KEY,
    reservation_id VARCHAR(36) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id VARCHAR(36),
    note TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 9. Orders (Food Pre-Orders & Dine-In) Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reservation_id VARCHAR(36),
    table_id VARCHAR(36),
    order_type VARCHAR(20) DEFAULT 'PRE_ORDER', -- 'PRE_ORDER', 'DINE_IN', 'TAKEAWAY'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    special_instructions TEXT,
    estimated_prep_time_minutes INT DEFAULT 20,
    prep_start_time DATETIME,
    ready_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- 10. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    menu_item_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    customization_notes VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'ONLINE_CARD', -- 'ONLINE_CARD', 'UPI', 'CASH_AT_COUNTER'
    payment_status VARCHAR(20) DEFAULT 'SUCCESS', -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    transaction_reference VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 12. Waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    party_size INT NOT NULL,
    estimated_wait_minutes INT DEFAULT 20,
    status VARCHAR(20) DEFAULT 'WAITING', -- 'WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED', 'NO_SHOW'
    queue_position INT DEFAULT 1,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notified_at DATETIME,
    seated_at DATETIME,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'RESERVATION_CONFIRMED', 'TABLE_READY', 'FOOD_PREPARING', 'FOOD_READY', 'WAITLIST_UPDATE', 'CROWD_ALERT'
    reference_id VARCHAR(36),
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Restaurant Staff Table
CREATE TABLE IF NOT EXISTS restaurant_staff (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    staff_role VARCHAR(50) NOT NULL, -- 'MANAGER', 'WAITER', 'KITCHEN', 'RECEPTION'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Offers & Discounts (Coupons) Table
CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENT', -- 'PERCENT', 'FLAT'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount DECIMAL(10, 2),
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT 1,
    usage_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 18. Inventory Items & Stock Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL DEFAULT 'kg', -- 'kg', 'ltr', 'units', 'packs', 'boxes'
    min_threshold DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    cost_per_unit DECIMAL(10, 2) DEFAULT 0.00,
    supplier_name VARCHAR(150),
    supplier_phone VARCHAR(50),
    last_restocked DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 19. Restaurant Events Table
CREATE TABLE IF NOT EXISTS restaurant_events (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date VARCHAR(20) NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    banner_url VARCHAR(500),
    ticket_price DECIMAL(10, 2) DEFAULT 0.00,
    total_seats INT DEFAULT 50,
    booked_seats INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 20. Review Replies Table
CREATE TABLE IF NOT EXISTS review_replies (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reply_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. Help & Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL', -- 'BILLING', 'TABLES', 'HARDWARE', 'ACCOUNT', 'GENERAL'
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    message TEXT NOT NULL,
    response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 22. Restaurant Operational Settings Table
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) UNIQUE NOT NULL,
    auto_accept_reservations BOOLEAN DEFAULT 1,
    max_advance_days INT DEFAULT 30,
    default_dining_duration_mins INT DEFAULT 45,
    walkin_grace_period_mins INT DEFAULT 15,
    wifi_ssid VARCHAR(100),
    wifi_password VARCHAR(100),
    tax_percentage DECIMAL(5, 2) DEFAULT 5.00,
    service_charge_percentage DECIMAL(5, 2) DEFAULT 0.00,
    allow_preorders BOOLEAN DEFAULT 1,
    cancellation_policy TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 23. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'ALL_CUSTOMERS', -- 'ALL_CUSTOMERS', 'VIP_DINERS', 'PAST_VISITORS'
    channel VARCHAR(30) DEFAULT 'IN_APP', -- 'IN_APP', 'EMAIL', 'SMS'
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT', -- 'DRAFT', 'SCHEDULED', 'SENT'
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

