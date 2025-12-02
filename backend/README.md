# Shadcn Backend API

Backend REST API untuk aplikasi Shadcn Dashboard menggunakan Spring Boot dan MySQL.

## Prerequisites

- Java 17 atau lebih tinggi
- Maven 3.6 atau lebih tinggi
- MySQL 8.0 atau lebih tinggi
- IDE (IntelliJ IDEA, Eclipse, atau VS Code dengan Java Extension Pack)

## Setup Database

1. Install dan jalankan MySQL Server
2. Buat database (opsional, aplikasi akan membuat otomatis):
```sql
CREATE DATABASE shadcn_db;
```

3. Update konfigurasi database di `src/main/resources/application.properties`:
```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

## Menjalankan Aplikasi

### Dengan Maven
```bash
# Clone atau extract project
cd shadcn-backend

# Install dependencies
mvn clean install

# Jalankan aplikasi
mvn spring-boot:run
```

### Dengan IDE
1. Import project sebagai Maven project
2. Jalankan `ShadcnBackendApplication.java`

## API Endpoints

Server akan berjalan di `http://localhost:8080`

### Users API
- `GET /api/users` - Get semua users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/username/{username}` - Get user by username
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users/status/{status}` - Get users by status
- `GET /api/users/search?name={name}` - Search users by name
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `GET /api/users/exists/username/{username}` - Check if username exists
- `GET /api/users/exists/email/{email}` - Check if email exists

### Payments API
- `GET /api/payments` - Get semua payments
- `GET /api/payments/{id}` - Get payment by ID
- `GET /api/payments/payment-id/{paymentId}` - Get payment by payment ID
- `GET /api/payments/user/{userId}` - Get payments by user ID
- `GET /api/payments/status/{status}` - Get payments by status
- `GET /api/payments/method/{method}` - Get payments by method
- `GET /api/payments/amount-range?minAmount={min}&maxAmount={max}` - Get payments by amount range
- `GET /api/payments/date-range?startDate={start}&endDate={end}` - Get payments by date range
- `POST /api/payments` - Create new payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment
- `GET /api/payments/statistics` - Get payment statistics
- `GET /api/payments/statistics/status/{status}` - Get statistics by status

## Models

### User
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "avatarUrl": "https://github.com/shadcn.png",
  "status": "ACTIVE",
  "createdAt": "2025-05-27T10:00:00",
  "updatedAt": "2025-05-27T10:00:00"
}
```

### Payment
```json
{
  "id": 1,
  "paymentId": "PAY-12345678",
  "amount": 299.99,
  "status": "SUCCESS",
  "method": "CREDIT_CARD",
  "description": "Subscription Fee",
  "transactionId": "TXN-001234",
  "createdAt": "2025-05-27T10:00:00",
  "updatedAt": "2025-05-27T10:00:00",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

## Enums

### User Status
- `ACTIVE`
- `INACTIVE`
- `SUSPENDED`

### Payment Status
- `PENDING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`
- `REFUNDED`

### Payment Method
- `CREDIT_CARD`
- `DEBIT_CARD`
- `BANK_TRANSFER`
- `PAYPAL`
- `STRIPE`
- `CASH`

## Sample Data

Aplikasi akan otomatis membuat sample data saat pertama kali dijalankan:
- 5 sample users
- 8 sample payments

## CORS

CORS sudah dikonfigurasi untuk frontend Next.js di `http://localhost:3000`

## Struktur Project

```
src/
├── main/
│   ├── java/com/shadcn/backend/
│   │   ├── ShadcnBackendApplication.java
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   └── DataSeeder.java
│   │   ├── controller/
│   │   │   ├── UserController.java
│   │   │   └── PaymentController.java
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   └── Payment.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   └── PaymentRepository.java
│   │   └── service/
│   │       ├── UserService.java
│   │       └── PaymentService.java
│   └── resources/
│       └── application.properties
└── test/
```

## Testing API

Gunakan tools seperti Postman, Insomnia, atau curl untuk testing API endpoints.

Example:
```bash
# Get all users
curl http://localhost:8080/api/users

# Get all payments
curl http://localhost:8080/api/payments

# Create new user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","fullName":"Test User"}'
```
