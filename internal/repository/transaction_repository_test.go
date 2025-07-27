package repository

import (
	"testing"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTransactionTestDB(t *testing.T) (*gorm.DB, *models.User, *models.Account, *models.Category) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{}, &models.Account{}, &models.Category{}, &models.Transaction{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	// Create a test user
	user := &models.User{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "hashedpassword",
	}
	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Create a test account
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err = db.Create(account).Error
	if err != nil {
		t.Fatalf("Failed to create test account: %v", err)
	}

	// Create a test category
	category := &models.Category{
		Name:   "Food",
		Type:   models.TransactionTypeExpense,
		UserID: user.ID,
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create test category: %v", err)
	}

	return db, user, account, category
}

func TestTransactionRepository_Create(t *testing.T) {
	db, _, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}

	err := repo.Create(transaction)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if transaction.ID == 0 {
		t.Error("Expected transaction ID to be set after creation")
	}
}

func TestTransactionRepository_FindByID(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create a transaction first
	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}
	err := repo.Create(transaction)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Find the transaction
	foundTransaction, err := repo.FindByID(transaction.ID, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if foundTransaction.ID != transaction.ID {
		t.Errorf("Expected transaction ID %d, got %d", transaction.ID, foundTransaction.ID)
	}

	if foundTransaction.Amount != transaction.Amount {
		t.Errorf("Expected amount %f, got %f", transaction.Amount, foundTransaction.Amount)
	}
}

func TestTransactionRepository_FindByID_WrongUser(t *testing.T) {
	db, _, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create another user
	user2 := &models.User{
		Name:     "Test User 2",
		Email:    "test2@example.com",
		Password: "hashedpassword",
	}
	err := db.Create(user2).Error
	if err != nil {
		t.Fatalf("Failed to create second user: %v", err)
	}

	// Create a transaction
	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}
	err = repo.Create(transaction)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Try to find the transaction with user2's ID
	_, err = repo.FindByID(transaction.ID, user2.ID)
	if err == nil {
		t.Error("Expected error when accessing transaction with wrong user ID")
	}
}

func TestTransactionRepository_FindByAccountID(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create multiple transactions
	transactions := []*models.Transaction{
		{
			Date:        time.Now(),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transaction 1",
			AccountID:   account.ID,
		},
		{
			Date:        time.Now().Add(-24 * time.Hour),
			Amount:      200.00,
			Type:        models.TransactionTypeIncome,
			Description: "Transaction 2",
			AccountID:   account.ID,
		},
	}

	for _, transaction := range transactions {
		err := repo.Create(transaction)
		if err != nil {
			t.Fatalf("Failed to create transaction: %v", err)
		}
	}

	// Find transactions by account ID
	foundTransactions, err := repo.FindByAccountID(account.ID, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 2 {
		t.Errorf("Expected 2 transactions, got %d", len(foundTransactions))
	}
}

func TestTransactionRepository_FindByUserID_Basic(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create multiple transactions
	transactions := []*models.Transaction{
		{
			Date:        time.Now(),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transaction 1",
			AccountID:   account.ID,
		},
		{
			Date:        time.Now().Add(-24 * time.Hour),
			Amount:      200.00,
			Type:        models.TransactionTypeIncome,
			Description: "Transaction 2",
			AccountID:   account.ID,
		},
	}

	for _, transaction := range transactions {
		err := repo.Create(transaction)
		if err != nil {
			t.Fatalf("Failed to create transaction: %v", err)
		}
	}

	// Find all transactions for user
	foundTransactions, total, err := repo.FindByUserID(user.ID, nil, nil, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 2 {
		t.Errorf("Expected 2 transactions, got %d", len(foundTransactions))
	}

	if total != 2 {
		t.Errorf("Expected total 2, got %d", total)
	}
}

func TestTransactionRepository_FindByUserID_WithFilters(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create transactions with different types and amounts
	transactions := []*models.Transaction{
		{
			Date:        time.Now(),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Food expense",
			AccountID:   account.ID,
		},
		{
			Date:        time.Now().Add(-24 * time.Hour),
			Amount:      200.00,
			Type:        models.TransactionTypeIncome,
			Description: "Salary income",
			AccountID:   account.ID,
		},
		{
			Date:        time.Now().Add(-48 * time.Hour),
			Amount:      50.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transport expense",
			AccountID:   account.ID,
		},
	}

	for _, transaction := range transactions {
		err := repo.Create(transaction)
		if err != nil {
			t.Fatalf("Failed to create transaction: %v", err)
		}
	}

	// Test filter by transaction type
	expenseTypes := []models.TransactionType{models.TransactionTypeExpense}
	foundTransactions, total, err := repo.FindByUserID(user.ID, expenseTypes, nil, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 2 {
		t.Errorf("Expected 2 expense transactions, got %d", len(foundTransactions))
	}

	if total != 2 {
		t.Errorf("Expected total 2, got %d", total)
	}

	// Test filter by amount range
	minAmount := 75.0
	maxAmount := 150.0
	foundTransactions, total, err = repo.FindByUserID(user.ID, nil, nil, nil, "", &minAmount, &maxAmount, nil, nil, 0, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 1 {
		t.Errorf("Expected 1 transaction in amount range, got %d", len(foundTransactions))
	}

	// Test filter by description
	foundTransactions, total, err = repo.FindByUserID(user.ID, nil, nil, nil, "Food", nil, nil, nil, nil, 0, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 1 {
		t.Errorf("Expected 1 transaction with 'Food' in description, got %d", len(foundTransactions))
	}

	// Test filter by account ID
	accountIDs := []uint{account.ID}
	foundTransactions, total, err = repo.FindByUserID(user.ID, nil, accountIDs, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 3 {
		t.Errorf("Expected 3 transactions for account, got %d", len(foundTransactions))
	}
}

func TestTransactionRepository_FindByUserID_WithPagination(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create 5 transactions
	for i := 0; i < 5; i++ {
		transaction := &models.Transaction{
			Date:        time.Now().Add(time.Duration(-i) * time.Hour),
			Amount:      float64(100 + i*10),
			Type:        models.TransactionTypeExpense,
			Description: "Transaction " + string(rune(i+'1')),
			AccountID:   account.ID,
		}
		err := repo.Create(transaction)
		if err != nil {
			t.Fatalf("Failed to create transaction %d: %v", i, err)
		}
	}

	// Test pagination - page 1, size 2
	foundTransactions, total, err := repo.FindByUserID(user.ID, nil, nil, nil, "", nil, nil, nil, nil, 1, 2)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 2 {
		t.Errorf("Expected 2 transactions on page 1, got %d", len(foundTransactions))
	}

	if total != 5 {
		t.Errorf("Expected total 5, got %d", total)
	}

	// Test pagination - page 2, size 2
	foundTransactions, total, err = repo.FindByUserID(user.ID, nil, nil, nil, "", nil, nil, nil, nil, 2, 2)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundTransactions) != 2 {
		t.Errorf("Expected 2 transactions on page 2, got %d", len(foundTransactions))
	}

	if total != 5 {
		t.Errorf("Expected total 5, got %d", total)
	}
}

func TestTransactionRepository_Update(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create a transaction first
	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}
	err := repo.Create(transaction)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Update the transaction
	transaction.Amount = 150.00
	transaction.Description = "Updated transaction"

	err = repo.Update(transaction)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the update
	updatedTransaction, err := repo.FindByID(transaction.ID, user.ID)
	if err != nil {
		t.Fatalf("Failed to find updated transaction: %v", err)
	}

	if updatedTransaction.Amount != 150.00 {
		t.Errorf("Expected amount 150.00, got %f", updatedTransaction.Amount)
	}

	if updatedTransaction.Description != "Updated transaction" {
		t.Errorf("Expected description 'Updated transaction', got %s", updatedTransaction.Description)
	}
}

func TestTransactionRepository_Delete(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create a transaction first
	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}
	err := repo.Create(transaction)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Delete the transaction
	err = repo.Delete(transaction.ID, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the transaction is deleted
	_, err = repo.FindByID(transaction.ID, user.ID)
	if err == nil {
		t.Error("Expected error after deletion")
	}
}

func TestTransactionRepository_TransactionManagement(t *testing.T) {
	db, _, _, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Test Begin
	tx := repo.Begin()
	if tx == nil {
		t.Error("Expected transaction to be created")
	}

	// Test Rollback
	err := repo.Rollback(tx)
	if err != nil {
		t.Errorf("Expected no error on rollback, got %v", err)
	}

	// Test Begin and Commit
	tx = repo.Begin()
	err = repo.Commit(tx)
	if err != nil {
		t.Errorf("Expected no error on commit, got %v", err)
	}
}

func TestTransactionRepository_AssociateCategories(t *testing.T) {
	db, _, account, category := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create another category
	category2 := &models.Category{
		Name:   "Transport",
		Type:   models.TransactionTypeExpense,
		UserID: category.UserID,
	}
	err := db.Create(category2).Error
	if err != nil {
		t.Fatalf("Failed to create second category: %v", err)
	}

	// Create a transaction
	transaction := &models.Transaction{
		Date:        time.Now(),
		Amount:      100.00,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   account.ID,
	}
	err = repo.Create(transaction)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Associate categories
	categoryIDs := []uint{category.ID, category2.ID}
	err = repo.AssociateCategories(transaction.ID, categoryIDs)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify associations
	var count int64
	err = db.Model(&models.TransactionCategory{}).Where("transaction_id = ?", transaction.ID).Count(&count).Error
	if err != nil {
		t.Fatalf("Failed to count associations: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 category associations, got %d", count)
	}

	// Test updating associations (should clear old ones)
	newCategoryIDs := []uint{category.ID}
	err = repo.AssociateCategories(transaction.ID, newCategoryIDs)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify only one association remains
	err = db.Model(&models.TransactionCategory{}).Where("transaction_id = ?", transaction.ID).Count(&count).Error
	if err != nil {
		t.Fatalf("Failed to count associations: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 category association after update, got %d", count)
	}
}

func TestTransactionRepository_GetDashboardSummary(t *testing.T) {
	db, user, account, _ := setupTransactionTestDB(t)
	repo := NewTransactionRepository(db)

	// Create transactions for current month
	now := time.Now()
	currentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	transactions := []*models.Transaction{
		{
			Date:        currentMonth.Add(24 * time.Hour),
			Amount:      1000.00,
			Type:        models.TransactionTypeIncome,
			Description: "Salary",
			AccountID:   account.ID,
		},
		{
			Date:        currentMonth.Add(48 * time.Hour),
			Amount:      200.00,
			Type:        models.TransactionTypeExpense,
			Description: "Groceries",
			AccountID:   account.ID,
		},
		{
			Date:        currentMonth.Add(72 * time.Hour),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Gas",
			AccountID:   account.ID,
		},
		// Transaction from previous month (should not be included in monthly totals)
		{
			Date:        currentMonth.Add(-24 * time.Hour),
			Amount:      500.00,
			Type:        models.TransactionTypeIncome,
			Description: "Previous month income",
			AccountID:   account.ID,
		},
	}

	for _, transaction := range transactions {
		err := repo.Create(transaction)
		if err != nil {
			t.Fatalf("Failed to create transaction: %v", err)
		}
	}

	// Get dashboard summary
	totalBalance, totalIncome, totalExpenses, recentTransactions, err := repo.GetDashboardSummary(user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check total balance (should be account balance)
	if totalBalance != 1000.00 {
		t.Errorf("Expected total balance 1000.00, got %f", totalBalance)
	}

	// Check total income for current month
	if totalIncome != 1000.00 {
		t.Errorf("Expected total income 1000.00, got %f", totalIncome)
	}

	// Check total expenses for current month
	if totalExpenses != 300.00 {
		t.Errorf("Expected total expenses 300.00, got %f", totalExpenses)
	}

	// Check recent transactions (should be limited to 5)
	if len(recentTransactions) > 5 {
		t.Errorf("Expected at most 5 recent transactions, got %d", len(recentTransactions))
	}

	// Recent transactions should be ordered by date DESC
	if len(recentTransactions) > 1 {
		for i := 0; i < len(recentTransactions)-1; i++ {
			if recentTransactions[i].Date.Before(recentTransactions[i+1].Date) {
				t.Error("Recent transactions should be ordered by date DESC")
				break
			}
		}
	}
}
