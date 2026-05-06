const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CATALOG_DATA = [
    { id: 1, type: 'service', category: 'haircut', name: 'Basic Trim', duration: 15, price: 15 },
    { id: 2, type: 'service', category: 'haircut', name: 'Fade Cut', duration: 30, price: 25 },
    { id: 3, type: 'service', category: 'haircut', name: 'Taper Cut', duration: 30, price: 25 },
    { id: 4, type: 'service', category: 'haircut', name: 'Skin Fade (Bald Fade)', duration: 45, price: 30 },
    { id: 5, type: 'service', category: 'haircut', name: 'Crew Cut', duration: 20, price: 20 },
    { id: 6, type: 'service', category: 'haircut', name: 'Buzz Cut', duration: 15, price: 15 },
    { id: 7, type: 'service', category: 'haircut', name: 'Undercut', duration: 30, price: 25 },
    { id: 8, type: 'service', category: 'haircut', name: 'Mohawk Fade', duration: 45, price: 35 },
    { id: 9, type: 'service', category: 'haircut', name: 'Textured Crop', duration: 30, price: 28 },
    { id: 10, type: 'service', category: 'haircut', name: 'Line-Up / Edge Up', duration: 15, price: 10 },
    { id: 11, type: 'service', category: 'haircut', name: 'Design Haircut', duration: 45, price: 40 },
    { id: 12, type: 'service', category: 'hairdressing', name: 'Box Braids', duration: 180, price: 120 },
    { id: 13, type: 'service', category: 'hairdressing', name: 'Knotless Braids', duration: 240, price: 150 },
    { id: 14, type: 'service', category: 'hairdressing', name: 'Cornrows', duration: 90, price: 60 },
    { id: 15, type: 'service', category: 'hairdressing', name: 'Stitch Braids', duration: 120, price: 80 },
    { id: 16, type: 'service', category: 'hairdressing', name: 'Wash & Blow Dry', duration: 45, price: 35 },
    { id: 17, type: 'service', category: 'hairdressing', name: 'Silk Press', duration: 90, price: 65 },
    { id: 18, type: 'service', category: 'hairdressing', name: 'Deep Conditioning', duration: 30, price: 25 },
    { id: 19, type: 'service', category: 'hairdressing', name: 'Wig Installation', duration: 120, price: 100 },
    { id: 20, type: 'service', category: 'hairdressing', name: 'Hair Coloring', duration: 120, price: 150 },
    { id: 21, type: 'service', category: 'nails', name: 'Basic Manicure', duration: 30, price: 20 },
    { id: 22, type: 'service', category: 'nails', name: 'Gel Manicure', duration: 45, price: 35 },
    { id: 23, type: 'service', category: 'nails', name: 'Acrylic Nails', duration: 90, price: 55 },
    { id: 24, type: 'service', category: 'nails', name: 'Nail Art Design', duration: 30, price: 15 },
    { id: 25, type: 'service', category: 'nails', name: 'Basic Pedicure', duration: 45, price: 30 },
    { id: 26, type: 'service', category: 'nails', name: 'Spa Pedicure', duration: 60, price: 50 },
    { id: 27, type: 'service', category: 'nails', name: 'Callus Removal', duration: 15, price: 10 },
    { id: 28, type: 'product', category: 'skincare', name: 'Garnier Face Wash', duration: 0, price: 12 },
    { id: 29, type: 'product', category: 'skincare', name: 'Micellar Water', duration: 0, price: 10 },
    { id: 30, type: 'product', category: 'skincare', name: 'Hydrating Moisturizer', duration: 0, price: 18 },
    { id: 31, type: 'product', category: 'skincare', name: 'Vitamin C Serum', duration: 0, price: 25 },
    { id: 32, type: 'product', category: 'skincare', name: 'Sunscreen SPF 50', duration: 0, price: 22 },
    { id: 33, type: 'product', category: 'haircare', name: 'Moisturizing Shampoo', duration: 0, price: 15 },
    { id: 34, type: 'product', category: 'haircare', name: 'Deep Conditioner', duration: 0, price: 18 },
    { id: 35, type: 'product', category: 'haircare', name: 'Argan Oil', duration: 0, price: 20 },
    { id: 36, type: 'product', category: 'haircare', name: 'Hair Growth Serum', duration: 0, price: 30 },
    { id: 37, type: 'product', category: 'styling', name: 'Strong Hold Gel', duration: 0, price: 12 },
    { id: 38, type: 'product', category: 'styling', name: 'Edge Control', duration: 0, price: 10 },
    { id: 39, type: 'product', category: 'styling', name: 'Heat Protectant', duration: 0, price: 15 }
];

async function seed() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                duration_minutes INTEGER NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                service_id INTEGER REFERENCES services(id),
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                location VARCHAR(255) NOT NULL,
                payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
                payment_status VARCHAR(50) DEFAULT 'pending',
                transaction_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await pool.query('TRUNCATE TABLE services CASCADE');
        
        for (const item of CATALOG_DATA) {
            await pool.query(
                'INSERT INTO services (id, name, category, duration_minutes, price) VALUES ($1, $2, $3, $4, $5)',
                [item.id, item.name, item.category, item.duration || 0, item.price]
            );
        }
        
        // fix sequence
        await pool.query("SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));");
        console.log('Seeding complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seed();
