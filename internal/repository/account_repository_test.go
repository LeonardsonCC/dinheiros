package repository

import (
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAccountTestDB(t *testing.T) (*gorm.DB, *models.User) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{}, &models.Account{}, &models.Category{}, &models.Transaction{}, &models.AccountShare{}, &models.ShareInvitation{})
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

	return db, user
}

func TestAccountRepository_Create(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}

	err := repo.Create(account)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if account.ID == 0 {
		t.Error("Expected account ID to be set after creation")
	}
}

func TestAccountRepository_FindByID(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	// Create an account first
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err := repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Find the account
	foundAccount, err := repo.FindByID(account.ID, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if foundAccount.ID != account.ID {
		t.Errorf("Expected account ID %d, got %d", account.ID, foundAccount.ID)
	}

	if foundAccount.Name != account.Name {
		t.Errorf("Expected account name %s, got %s", account.Name, foundAccount.Name)
	}
}

func TestAccountRepository_FindByID_WrongUser(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

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

	// Create an account for user1
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err = repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Try to find the account with user2's ID
	_, err = repo.FindByID(account.ID, user2.ID)
	if err == nil {
		t.Error("Expected error when accessing account with wrong user ID")
	}
}

func TestAccountRepository_FindByUserID(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	// Create multiple accounts
	accounts := []*models.Account{
		{
			Name:           "Checking Account",
			Type:           models.AccountTypeChecking,
			InitialBalance: 1000.00,
			Balance:        1000.00,
			UserID:         user.ID,
		},
		{
			Name:           "Savings Account",
			Type:           models.AccountTypeSavings,
			InitialBalance: 5000.00,
			Balance:        5000.00,
			UserID:         user.ID,
		},
	}

	for _, account := range accounts {
		err := repo.Create(account)
		if err != nil {
			t.Fatalf("Failed to create account: %v", err)
		}
	}

	// Find accounts by user ID
	foundAccounts, err := repo.FindByUserID(user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundAccounts) != 2 {
		t.Errorf("Expected 2 accounts, got %d", len(foundAccounts))
	}
}

func TestAccountRepository_Update(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	// Create an account first
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err := repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Update the account
	account.Name = "Updated Account"
	account.Balance = 1500.00

	err = repo.Update(account)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the update
	updatedAccount, err := repo.FindByID(account.ID, user.ID)
	if err != nil {
		t.Fatalf("Failed to find updated account: %v", err)
	}

	if updatedAccount.Name != "Updated Account" {
		t.Errorf("Expected name 'Updated Account', got %s", updatedAccount.Name)
	}

	if updatedAccount.Balance != 1500.00 {
		t.Errorf("Expected balance 1500.00, got %f", updatedAccount.Balance)
	}
}

func TestAccountRepository_Delete(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	// Create an account first
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err := repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Delete the account
	err = repo.Delete(account.ID, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the account is deleted
	_, err = repo.FindByID(account.ID, user.ID)
	if err == nil {
		t.Error("Expected error after deletion")
	}
}

func TestAccountRepository_Delete_WrongUser(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

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

	// Create an account for user1
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err = repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Try to delete the account with user2's ID
	err = repo.Delete(account.ID, user2.ID)
	if err != nil {
		t.Errorf("Expected no error for delete with wrong user ID, got %v", err)
	}

	// Verify the account still exists
	_, err = repo.FindByID(account.ID, user.ID)
	if err != nil {
		t.Error("Account should still exist after failed delete")
	}
}

func TestAccountRepository_UpdateBalance(t *testing.T) {
	db, user := setupAccountTestDB(t)
	repo := NewAccountRepository(db)

	// Create an account first
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		InitialBalance: 1000.00,
		Balance:        1000.00,
		UserID:         user.ID,
	}
	err := repo.Create(account)
	if err != nil {
		t.Fatalf("Failed to create account: %v", err)
	}

	// Update balance by adding 500
	err = repo.UpdateBalance(account.ID, 500.00)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the balance update
	updatedAccount, err := repo.FindByID(account.ID, user.ID)
	if err != nil {
		t.Fatalf("Failed to find updated account: %v", err)
	}

	expectedBalance := 1500.00
	if updatedAccount.Balance != expectedBalance {
		t.Errorf("Expected balance %f, got %f", expectedBalance, updatedAccount.Balance)
	}

	// Update balance by subtracting 200
	err = repo.UpdateBalance(account.ID, -200.00)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the balance update
	updatedAccount, err = repo.FindByID(account.ID, user.ID)
	if err != nil {
		t.Fatalf("Failed to find updated account: %v", err)
	}

	expectedBalance = 1300.00
	if updatedAccount.Balance != expectedBalance {
		t.Errorf("Expected balance %f, got %f", expectedBalance, updatedAccount.Balance)
	}
}
