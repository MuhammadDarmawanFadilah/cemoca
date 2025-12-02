-- ============================================
-- CAMOCA Database Setup Script
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS camoca_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE camoca_db;

-- Note: Tables will be automatically created by Spring Boot JPA
-- with spring.jpa.hibernate.ddl-auto=update

-- The following tables will be created automatically:
-- 1. users - User management
-- 2. roles - Role management
-- 3. user_roles - Many-to-many relationship between users and roles

-- Default admin user will be created by the application
-- Username: admin
-- Password: admin123

SELECT 'CAMOCA Database created successfully!' as Message;
