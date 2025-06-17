package repository_test

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/leccarvalho/dinheiros/internal/models"
	repo "github.com/leccarvalho/dinheiros/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	gormDB, err := gorm.Open(sqlite.New(sqlite.Config{
		Conn: db,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open gorm db: %v", err)
	}

	return gormDB, mock
}

func TestAccountRepository_Create(t *testing.T) {
	gormDB, _ := setupTestDB(t)
	err := gormDB.AutoMigrate(&models.Account{})
	assert.NoError(t, err)

	repo := repo.NewAccountRepository(gormDB)

	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}

	err = repo.Create(account)
	assert.NoError(t, err)
	assert.NotZero(t, account.ID)
}

func TestAccountRepository_FindByID(t *testing.T) {
	gormDB, _ := setupTestDB(t)
	err := gormDB.AutoMigrate(&models.Account{})
	assert.NoError(t, err)

	repo := repo.NewAccountRepository(gormDB)

	// Create test account
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}
	gormDB.Create(account)

	// Test finding existing account
	found, err := repo.FindByID(account.ID, 1)
	assert.NoError(t, err)
	assert.Equal(t, account.ID, found.ID)

	// Test non-existent account
	_, err = repo.FindByID(999, 1)
	assert.Error(t, err)
}

func TestAccountRepository_FindByUserID(t *testing.T) {
	gormDB, _ := setupTestDB(t)
	err := gormDB.AutoMigrate(&models.Account{})
	assert.NoError(t, err)

	repo := repo.NewAccountRepository(gormDB)

	// Create test accounts
	accounts := []models.Account{
		{Name: "Account 1", Type: models.AccountTypeChecking, Currency: "USD", InitialBalance: 1000.0, Balance: 1000.0, UserID: 1},
		{Name: "Account 2", Type: models.AccountTypeSavings, Currency: "USD", InitialBalance: 2000.0, Balance: 2000.0, UserID: 1},
		{Name: "Account 3", Type: models.AccountTypeChecking, Currency: "EUR", InitialBalance: 1500.0, Balance: 1500.0, UserID: 2},
	}

	for _, acc := range accounts {
		gormDB.Create(&acc)
	}

	// Test finding accounts for user 1
	user1Accounts, err := repo.FindByUserID(1)
	assert.NoError(t, err)
	assert.Len(t, user1Accounts, 2)

	// Test finding accounts for non-existent user
	user3Accounts, err := repo.FindByUserID(999)
	assert.NoError(t, err)
	assert.Empty(t, user3Accounts)
}

func TestAccountRepository_Update(t *testing.T) {
	gormDB, _ := setupTestDB(t)
	err := gormDB.AutoMigrate(&models.Account{})
	assert.NoError(t, err)

	repo := repo.NewAccountRepository(gormDB)

	// Create test account
	account := &models.Account{
		Name:           "Old Name",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}
	gormDB.Create(account)

	// Update account
	account.Name = "New Name"
	err = repo.Update(account)
	assert.NoError(t, err)

	// Verify update
	updated, err := repo.FindByID(account.ID, 1)
	assert.NoError(t, err)
	assert.Equal(t, "New Name", updated.Name)
}

func TestAccountRepository_Delete(t *testing.T) {
	gormDB, _ := setupTestDB(t)
	err := gormDB.AutoMigrate(&models.Account{})
	assert.NoError(t, err)

	repo := repo.NewAccountRepository(gormDB)

	// Create test account
	account := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}
	gormDB.Create(account)

	// Delete account
	err = repo.Delete(account.ID, 1)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.FindByID(account.ID, 1)
	assert.Error(t, err)
}
