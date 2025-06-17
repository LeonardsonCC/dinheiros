package service_test

import (
	"testing"

	"github.com/leccarvalho/dinheiros/internal/models"
	srv "github.com/leccarvalho/dinheiros/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockAccountRepository is a mock implementation of the AccountRepository interface
type MockAccountRepository struct {
	mock.Mock
}

func (m *MockAccountRepository) Create(account *models.Account) error {
	args := m.Called(account)
	if args.Get(0) != nil {
		*account = *args.Get(0).(*models.Account)
	}
	return args.Error(1)
}

func (m *MockAccountRepository) FindByID(id uint, userID uint) (*models.Account, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Account), args.Error(1)
}

func (m *MockAccountRepository) FindByUserID(userID uint) ([]models.Account, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Account), args.Error(1)
}

func (m *MockAccountRepository) Update(account *models.Account) error {
	args := m.Called(account)
	return args.Error(0)
}

func (m *MockAccountRepository) Delete(id uint, userID uint) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockAccountRepository) UpdateBalance(accountID uint, amount float64) error {
	args := m.Called(accountID, amount)
	return args.Error(0)
}

func TestAccountService_CreateAccount(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := srv.NewAccountService(mockRepo)

	testAccount := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		UserID:         1,
	}
	expectedAccount := *testAccount
	expectedAccount.ID = 1
	expectedAccount.Balance = testAccount.InitialBalance

	mockRepo.On("Create", testAccount).Run(func(args mock.Arguments) {
		account := args.Get(0).(*models.Account)
		account.ID = 1
		account.Balance = account.InitialBalance
	}).Return(&expectedAccount, nil)

	err := service.CreateAccount(testAccount)

	assert.NoError(t, err)
	assert.Equal(t, uint(1), testAccount.ID)
	assert.Equal(t, 1000.0, testAccount.Balance)
	mockRepo.AssertExpectations(t)
}

func TestAccountService_GetAccountByID(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := srv.NewAccountService(mockRepo)

	existingAccount := &models.Account{
		Name:           "Test Account",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}

	mockRepo.On("FindByID", uint(1), uint(1)).Return(existingAccount, nil)

	// Test existing account
	account, err := service.GetAccountByID(1, 1)
	assert.NoError(t, err)
	assert.Equal(t, "Test Account", account.Name)

	// Test non-existent account
	mockRepo.On("FindByID", uint(999), uint(1)).Return((*models.Account)(nil), gorm.ErrRecordNotFound)
	_, err = service.GetAccountByID(999, 1)
	assert.Error(t, err)

	mockRepo.AssertExpectations(t)
}

func TestAccountService_GetAccountsByUserID(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := srv.NewAccountService(mockRepo)

	existingAccounts := []models.Account{
		{Name: "Account 1", UserID: 1},
		{Name: "Account 2", UserID: 1},
	}

	mockRepo.On("FindByUserID", uint(1)).Return(existingAccounts, nil)

	// Test existing user
	accounts, err := service.GetAccountsByUserID(1)
	assert.NoError(t, err)
	assert.Len(t, accounts, 2)

	// Test non-existent user
	mockRepo.On("FindByUserID", uint(999)).Return([]models.Account{}, nil)
	accounts, err = service.GetAccountsByUserID(999)
	assert.NoError(t, err)
	assert.Empty(t, accounts)

	mockRepo.AssertExpectations(t)
}

func TestAccountService_UpdateAccount(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := srv.NewAccountService(mockRepo)

	existingAccount := &models.Account{
		Name:           "Old Name",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
		Balance:        1000.0,
		UserID:         1,
	}

	updatedAccount := *existingAccount
	updatedAccount.Name = "New Name"

	// Test successful update
	mockRepo.On("FindByID", uint(1), uint(1)).Return(existingAccount, nil)
	mockRepo.On("Update", &updatedAccount).Return(nil)

	err := service.UpdateAccount(&updatedAccount, 1)
	assert.NoError(t, err)

	// Test account not found
	mockRepo.On("FindByID", uint(999), uint(1)).Return((*models.Account)(nil), gorm.ErrRecordNotFound)
	err = service.UpdateAccount(&models.Account{UserID: 1}, 1)
	assert.Error(t, err)

	mockRepo.AssertExpectations(t)
}

func TestAccountService_DeleteAccount(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := srv.NewAccountService(mockRepo)

	// Test successful delete
	mockRepo.On("Delete", uint(1), uint(1)).Return(nil)
	err := service.DeleteAccount(1, 1)
	assert.NoError(t, err)

	// Test error during delete
	mockRepo.On("Delete", uint(999), uint(1)).Return(gorm.ErrRecordNotFound)
	err = service.DeleteAccount(999, 1)
	assert.Error(t, err)

	mockRepo.AssertExpectations(t)
}
