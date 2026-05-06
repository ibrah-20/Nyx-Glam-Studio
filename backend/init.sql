-- Create Services Table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'barbering', 'hair', 'nails', 'products'
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT 'Narok County',
    service_id INTEGER REFERENCES services(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash', -- 'cash', 'mpesa', 'crypto'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_service ON bookings(service_id);

-- Insert Sample Data
INSERT INTO services (name, category, duration_minutes, price) VALUES
('Classic Fade', 'barbering', 30, 25.00),
('Beard Trim', 'barbering', 15, 15.00),
('Hair Cut & Color', 'hair', 120, 150.00),
('Luxury Manicure', 'nails', 45, 40.00),
('Pedicure', 'nails', 45, 45.00);
