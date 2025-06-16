# Dinheiros - Personal Finance Manager

A simple personal finance management API built with Go, Gin, and SQLite.

## Features

- User authentication (register/login)
- Account management (create, list, delete accounts)
- Transaction management (income, expense, transfer)
- Balance tracking

## Prerequisites

- Go 1.16 or higher
- SQLite3

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dinheiros
   ```

2. Install dependencies:
   ```bash
   go mod tidy
   ```

3. Run the application:
   ```bash
   go run cmd/dinheiros/main.go
   ```

   The server will start on `http://localhost:8080` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get an authentication token

### Accounts (Requires Authentication)

- `GET /api/accounts` - List all user accounts
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/:id` - Get account details
- `DELETE /api/accounts/:id` - Delete an account

### Transactions (Requires Authentication)

- `GET /api/accounts/:accountId/transactions` - List all transactions for an account
- `POST /api/accounts/:accountId/transactions` - Create a new transaction
- `GET /api/accounts/:accountId/transactions/:id` - Get transaction details
- `DELETE /api/accounts/:accountId/transactions/:id` - Delete a transaction

## Example Requests

### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Create an account
```http
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Checking Account",
  "type": "checking"
}
```

### Create a transaction
```http
POST /api/accounts/1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2023-01-01T00:00:00Z",
  "amount": 100.50,
  "type": "expense",
  "description": "Grocery shopping",
  "category": "Groceries"
}
```

## License

MIT
