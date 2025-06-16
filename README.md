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

## Development

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality. The hooks will:

- Format Go files with `goimports-reviser`
- Run `golangci-lint` for code quality checks

#### Setup (Windows)

```powershell
# Run the PowerShell setup script
.\scripts\setup-precommit.ps1
```

#### Setup (Linux/macOS)

```bash
# Run the bash setup script
./scripts/setup-precommit.sh
```

#### Manual Setup

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
```

#### Manual Commands

You can also run the tools manually:

```bash
# Format Go files
make format

# Run linter
make lint
```

### Available Make Commands

- `make run` - Start both frontend and backend in development mode
- `make backend` - Start only the backend server
- `make frontend` - Start only the frontend development server
- `make setup-frontend` - Install frontend dependencies
- `make build` - Build production binary with embedded frontend
- `make deps` - Install Go dependencies
- `make clean` - Remove generated files
- `make format` - Format Go files with goimports-reviser
- `make lint` - Run golangci-lint

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
