-- Reset database for clean startup
-- This file will be executed by Spring Boot during startup

-- Insert default roles
INSERT IGNORE INTO roles (role_id, role_name, created_at, updated_at) VALUES 
(1, 'ADMIN', NOW(), NOW()),
(2, 'KARYAWAN', NOW(), NOW());

-- Insert default admin user
INSERT IGNORE INTO users (id, username, email, full_name, password, phone_number, status, role_id, created_at, updated_at) VALUES 
(1, 'admin', 'admin@koperasi.com', 'Administrator', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', '08123456789', 'ACTIVE', 1, NOW(), NOW());

-- Insert sample categories
INSERT IGNORE INTO kategori (id, nama, deskripsi, created_at, updated_at) VALUES 
(1, 'Makanan', 'Produk makanan dan minuman', NOW(), NOW()),
(2, 'Elektronik', 'Peralatan elektronik', NOW(), NOW()),
(3, 'Pakaian', 'Pakaian dan aksesoris', NOW(), NOW());

-- Insert sample products
INSERT IGNORE INTO barang (id, nama, berat, kategori_id, stock, harga, poin, gambar, created_at, updated_at) VALUES 
(1, 'Beras Premium 5kg', 5.00, 1, 100, 75000.00, 75, 'beras-premium.jpg', NOW(), NOW()),
(2, 'Rice Cooker Digital', 2.50, 2, 25, 450000.00, 450, 'rice-cooker.jpg', NOW(), NOW()),
(3, 'Kaos Polo Pria', 0.25, 3, 50, 85000.00, 85, 'kaos-polo.jpg', NOW(), NOW());