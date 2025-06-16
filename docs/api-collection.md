# API Collection

This document provides a collection of all backend requests for the Dinheiros API.

## Authentication

### Register a new user

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response Body:**

```json
{
  "message": "User registered successfully",
  "token": "your-jwt-token",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

---

### Login

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response Body:**

```json
{
  "message": "Login successful",
  "token": "your-jwt-token",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

---

### Google Login

- **Method:** `POST`
- **Path:** `/api/auth/google`
- **Description:** Authenticates a user with a Google account.

**Request Body:**

```json
{
  "token": "google-id-token"
}
```

**Response Body:**

```json
{
  "message": "Login successful",
  "token": "your-jwt-token",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

---

## Dashboard

### Get Dashboard Summary

- **Method:** `GET`
- **Path:** `/api/summary`
- **Description:** Retrieves a summary of financial data for the dashboard.
- **Authentication:** Required

**Response Body:**
*The specific structure of the dashboard summary response is not defined in the DTOs and would need to be inferred from the handler implementation (`container.TransactionHandler.GetDashboardSummary`).*

---

## Accounts

### Get all accounts

- **Method:** `GET`
- **Path:** `/api/accounts`
- **Description:** Retrieves a list of all accounts for the authenticated user.
- **Authentication:** Required

**Response Body:**

```json
[
  {
    "id": 1,
    "name": "Checking Account",
    "type": "checking",
    "initial_balance": 1000.50,
    "balance": 1250.75,
    "color": "#FF0000"
  }
]
```

---

### Create a new account

- **Method:** `POST`
- **Path:** `/api/accounts`
- **Description:** Creates a new account.
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "Savings Account",
  "type": "savings",
  "initial_balance": 5000,
  "color": "#00FF00"
}
```

**Response Body:**

```json
{
  "id": 2,
  "name": "Savings Account",
  "type": "savings",
  "initial_balance": 5000,
  "balance": 5000,
  "color": "#00FF00"
}
```

---

### Get a single account

- **Method:** `GET`
- **Path:** `/api/accounts/:id`
- **Description:** Retrieves a single account by its ID.
- **Authentication:** Required

**Response Body:**

```json
{
  "id": 1,
  "name": "Checking Account",
  "type": "checking",
  "initial_balance": 1000.50,
  "balance": 1250.75,
  "color": "#FF0000"
}
```

---

### Update an account

- **Method:** `PUT`
- **Path:** `/api/accounts/:id`
- **Description:** Updates an existing account.
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "Updated Checking Account",
  "type": "checking",
  "color": "#0000FF"
}
```

**Response Body:**

```json
{
  "id": 1,
  "name": "Updated Checking Account",
  "type": "checking",
  "initial_balance": 1000.50,
  "balance": 1250.75,
  "color": "#0000FF"
}
```

---

### Delete an account

- **Method:** `DELETE`
- **Path:** `/api/accounts/:id`
- **Description:** Deletes an account by its ID.
- **Authentication:** Required

**Response:** `204 No Content`

---

## Transactions

### List available extractors

- **Method:** `GET`
- **Path:** `/api/accounts/transactions/extractors`
- **Description:** Lists the available PDF statement extractors.
- **Authentication:** Required

**Response Body:**

```json
[
    "caixa_extrato",
    "caixa_cc_fatura",
    "nubank_extrato",
    "nubank_cc_fatura"
]
```
---

### Get transactions for an account

- **Method:** `GET`
- **Path:** `/api/accounts/:id/transactions`
- **Description:** Retrieves a list of transactions for a specific account. Supports filtering and pagination via query parameters.
- **Authentication:** Required

**Query Parameters:** See `ListTransactionsRequest` in `internal/dto/transaction_dto.go` for all available filters.

**Response Body:**

```json
{
  "data": [
    {
      "id": 1,
      "date": "2023-10-27T10:00:00Z",
      "amount": 150.00,
      "type": "expense",
      "description": "Groceries",
      "categories": [
        {
          "id": 1,
          "name": "Food"
        }
      ],
      "account": {
        "id": 1,
        "name": "Checking Account",
        "type": "checking",
        "initial_balance": 1000.50,
        "balance": 1100.75,
        "color": "#FF0000"
      },
      "to_account_id": null
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

---

### Create a transaction

- **Method:** `POST`
- **Path:** `/api/accounts/:id/transactions`
- **Description:** Creates a new transaction for an account.
- **Authentication:** Required

**Request Body:**

```json
{
  "date": "2023-10-28",
  "amount": 75.50,
  "type": "expense",
  "description": "Dinner",
  "category_ids": [1],
  "to_account_id": null
}
```

**Response Body:** (Structure is `TransactionResponse`)

---

### Get a single transaction

- **Method:** `GET`
- **Path:** `/api/accounts/:id/transactions/:transactionId`
- **Description:** Retrieves a single transaction by its ID.
- **Authentication:** Required

**Response Body:** (Structure is `TransactionResponse`)

---

### Update a transaction

- **Method:** `PUT`
- **Path:** `/api/accounts/:id/transactions/:transactionId`
- **Description:** Updates an existing transaction. The request body is the same as creating a transaction.
- **Authentication:** Required

**Request Body:** (Structure is `CreateTransactionRequest`)

**Response Body:** (Structure is `TransactionResponse`)

---

### Delete a transaction

- **Method:** `DELETE`
- **Path:** `/api/accounts/:id/transactions/:transactionId`
- **Description:** Deletes a transaction by its ID.
- **Authentication:** Required

**Response:** `204 No Content`

---

### Import transactions from a file

- **Method:** `POST`
- **Path:** `/api/accounts/:id/transactions/import`
- **Description:** Imports transactions from a bank statement (e.g., PDF). This is a multipart/form-data request.
- **Authentication:** Required

**Form Data:**
- `file`: The statement file.
- `extractor`: The name of the extractor to use (e.g., "caixa_extrato").

---

### Bulk create transactions

- **Method:** `POST`
- **Path:** `/api/accounts/:id/transactions/bulk`
- **Description:** Creates multiple transactions in a single request.
- **Authentication:** Required

**Request Body:**

```json
[
  {
    "date": "2023-10-29",
    "amount": 100,
    "type": "income",
    "description": "Salary"
  },
  {
    "date": "2023-10-29",
    "amount": 25,
    "type": "expense",
    "description": "Coffee"
  }
]
```

---

### List all transactions (global)

- **Method:** `GET`
- **Path:** `/api/transactions`
- **Description:** Retrieves a list of all transactions for the user, across all accounts. Supports filtering and pagination.
- **Authentication:** Required

**Query Parameters:** See `ListTransactionsRequest` in `internal/dto/transaction_dto.go`.

**Response Body:** (Structure is `ListTransactionsResponse`)

---

## Categories

### List all categories

- **Method:** `GET`
- **Path:** `/api/categories`
- **Description:** Retrieves all categories for the user.
- **Authentication:** Required

**Response Body:**

```json
[
  {
    "id": 1,
    "name": "Food",
    "description": "Expenses related to food and groceries.",
    "type": "expense"
  }
]
```

---

### Create a category

- **Method:** `POST`
- **Path:** `/api/categories`
- **Description:** Creates a new category.
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "Salary",
  "description": "Monthly income",
  "type": "income"
}
```

**Response Body:** (Structure is `CategoryDTO`)

---

### Update a category

- **Method:** `PUT`
- **Path:** `/api/categories/:id`
- **Description:** Updates an existing category.
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "Groceries",
  "type": "expense"
}
```

**Response Body:** (Structure is `CategoryDTO`)

---

### Delete a category

- **Method:** `DELETE`
- **Path:** `/api/categories/:id`
- **Description:** Deletes a category by its ID.
- **Authentication:** Required

**Response:** `204 No Content`

---

## User Profile

### Get current user

- **Method:** `GET`
- **Path:** `/api/users/me`
- **Description:** Retrieves the profile of the currently authenticated user.
- **Authentication:** Required

**Response Body:** (Structure is `UserResponse`)

---

### Update user's name

- **Method:** `PATCH`
- **Path:** `/api/users/me`
- **Description:** Updates the name of the authenticated user.
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "Johnathan Doe"
}
```

---

### Update user's password

- **Method:** `PATCH`
- **Path:** `/api/users/me/password`
- **Description:** Updates the password of the authenticated user.
- **Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-strong-password"
}
```

---

## Statistics

- **Path prefix:** `/api/statistics`
- **Authentication:** Required

### Transactions per day
- **Path:** `/transactions-per-day`
- **Method:** `GET`

### Amount by month
- **Path:** `/amount-by-month`
- **Method:** `GET`

### Amount by account
- **Path:** `/amount-by-account`
- **Method:** `GET`

### Amount by category
- **Path:** `/amount-by-category`
- **Method:** `GET`

### Amount spent by day
- **Path:** `/amount-spent-by-day`
- **Method:** `GET`

### Amount spent and gained by day
- **Path:** `/amount-spent-and-gained-by-day`
- **Method:** `GET`

*Note: The specific response structure for statistics endpoints is not defined in the DTOs.*

---

## Categorization Rules

### List all rules

- **Method:** `GET`
- **Path:** `/api/categorization-rules`
- **Description:** Retrieves all categorization rules for the user.
- **Authentication:** Required

**Response Body:** (Array of `CategorizationRuleDTO`)

---

### Create a rule

- **Method:** `POST`
- **Path:** `/api/categorization-rules`
- **Description:** Creates a new categorization rule.
- **Authentication:** Required

**Request Body:** (Structure is `CreateCategorizationRuleDTO`)

---

### Get a single rule

- **Method:** `GET`
- **Path:** `/api/categorization-rules/:id`
- **Description:** Retrieves a single rule by its ID.
- **Authentication:** Required

**Response Body:** (Structure is `CategorizationRuleDTO`)

---

### Update a rule

- **Method:** `PUT`
- **Path:** `/api/categorization-rules/:id`
- **Description:** Updates an existing rule.
- **Authentication:** Required

**Request Body:** (Structure is `UpdateCategorizationRuleDTO`)

---

### Delete a rule

- **Method:** `DELETE`
- **Path:** `/api/categorization-rules/:id`
- **Description:** Deletes a rule by its ID.
- **Authentication:** Required

**Response:** `204 No Content` 