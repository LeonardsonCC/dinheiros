package service_test

import (
	"testing"
	"time"

	"github.com/leccarvalho/dinheiros/internal/errors"
	"github.com/leccarvalho/dinheiros/internal/models"
	srv "github.com/leccarvalho/dinheiros/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockTransactionRepository is a mock implementation of the TransactionRepository interface
type MockTransactionRepository struct {
	mock.Mock
}

func (m *MockTransactionRepository) Create(transaction *models.Transaction) error {
	args := m.Called(transaction)
	return args.Error(0)
}

func (m *MockTransactionRepository) FindByID(id uint, userID uint) (*models.Transaction, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) FindByAccountID(accountID uint, userID uint) ([]models.Transaction, error) {
	args := m.Called(accountID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) Update(transaction *models.Transaction) error {
	args := m.Called(transaction)
	return args.Error(0)
}

func (m *MockTransactionRepository) Delete(id uint, userID uint) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockTransactionRepository) Begin() *gorm.DB {
	args := m.Called()
	return args.Get(0).(*gorm.DB)
}

func (m *MockTransactionRepository) Commit(tx *gorm.DB) error {
	args := m.Called(tx)
	return args.Error(0)
}

func (m *MockTransactionRepository) Rollback(tx *gorm.DB) error {
	args := m.Called(tx)
	return args.Error(0)
}

func (m *MockTransactionRepository) GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error) {
	args := m.Called(userID)
	return args.Get(0).(float64), args.Get(1).(float64), args.Get(2).(float64), 
		args.Get(3).([]models.Transaction), args.Error(4)
}

// Test data
var (
	testUserID      = uint(1)
	testAccountID    = uint(1)
	testCategoryID   = uint(1)
	testDate, _      = time.Parse(time.RFC3339, "2023-01-01T12:00:00Z")
	testTransaction = &models.Transaction{
		Model:       gorm.Model{ID: 1},
		Date:        testDate,
		Amount:      100.0,
		Type:        models.TransactionTypeExpense,
		Description: "Test transaction",
		AccountID:   testAccountID,
	}
)

func TestTransactionService_CreateTransaction(t *testing.T) {
	tests := []struct {
		name        string
		setupMocks  func(*MockTransactionRepository, *MockAccountRepository)
		userID      uint
		accountID   uint
		amount      float64
		transType   models.TransactionType
		description string
		toAccountID *uint
		categoryIDs []uint
		date        time.Time
		wantErr     bool
		errType     error
	}{
		{
			name: "successful expense transaction",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				mar.On("FindByID", testAccountID, testUserID).Return(&models.Account{
					Model: gorm.Model{ID: testAccountID},
					UserID: testUserID,
					Balance: 200.0,
				}, nil)
				mtr.On("Create", mock.AnythingOfType("*models.Transaction")).Return(nil)
				mar.On("UpdateBalance", testAccountID, -100.0).Return(nil)
			},
			userID:      testUserID,
			accountID:   testAccountID,
			amount:      100.0,
			transType:   models.TransactionTypeExpense,
			description: "Test expense",
			date:        testDate,
			wantErr:     false,
		},
		{
			name: "insufficient funds",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				mar.On("FindByID", testAccountID, testUserID).Return(&models.Account{
					Model: gorm.Model{ID: testAccountID},
					UserID: testUserID,
					Balance: 50.0,
				}, nil)
			},
			userID:      testUserID,
			accountID:   testAccountID,
			amount:      100.0,
			transType:   models.TransactionTypeExpense,
			description: "Test insufficient funds",
			date:        testDate,
			wantErr:     true,
			errType:     errors.NewValidationError("insufficient funds"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mocks
			mockTransRepo := new(MockTransactionRepository)
			mockAccRepo := new(MockAccountRepository)
			tt.setupMocks(mockTransRepo, mockAccRepo)

			// Create service with mocks
			service := srv.NewTransactionService(mockTransRepo, mockAccRepo)

			// Call the method being tested
			_, err := service.CreateTransaction(
				tt.userID,
				tt.accountID,
				tt.amount,
				tt.transType,
				tt.description,
				tt.toAccountID,
				tt.categoryIDs,
				tt.date,
			)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errType != nil {
					switch tt.errType.(type) {
					case *errors.ValidationError:
						assert.IsType(t, &errors.ValidationError{}, err)
					case *errors.NotFoundError:
						assert.IsType(t, &errors.NotFoundError{}, err)
					}
				}
			} else {
				assert.NoError(t, err)
			}

			// Verify all expectations were met
			mockTransRepo.AssertExpectations(t)
			mockAccRepo.AssertExpectations(t)
		})
	}
}

func TestTransactionService_GetTransactionByID(t *testing.T) {
	tests := []struct {
		name          string
		setupMocks    func(*MockTransactionRepository, *MockAccountRepository)
		userID        uint
		transactionID uint
		wantErr       bool
		errType       error
	}{
		{
			name: "successful get",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				transaction := &models.Transaction{
					Model:       gorm.Model{ID: 1},
					AccountID:   testAccountID,
					Amount:      100.0,
					Type:        models.TransactionTypeExpense,
					Description: "Test transaction",
					Date:        testDate,
				}
				mtr.On("FindByID", uint(1), testUserID).Return(transaction, nil)
			},
			userID:        testUserID,
			transactionID: 1,
			wantErr:       false,
		},
		{
			name: "transaction not found",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				mtr.On("FindByID", uint(999), testUserID).Return(nil, gorm.ErrRecordNotFound)
			},
			userID:        testUserID,
			transactionID: 999,
			wantErr:       true,
			errType:       &errors.NotFoundError{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mocks
			mockTransRepo := new(MockTransactionRepository)
			mockAccRepo := new(MockAccountRepository)
			tt.setupMocks(mockTransRepo, mockAccRepo)

			// Create service with mocks
			service := srv.NewTransactionService(mockTransRepo, mockAccRepo)

			// Call the method being tested
			transaction, err := service.GetTransactionByID(tt.userID, tt.transactionID)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errType != nil {
					switch tt.errType.(type) {
					case *errors.ValidationError:
						assert.IsType(t, &errors.ValidationError{}, err)
					case *errors.NotFoundError:
						assert.IsType(t, &errors.NotFoundError{}, err)
					}
				}
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, transaction)
				assert.Equal(t, tt.transactionID, transaction.ID)
			}

			// Verify all expectations were met
			mockTransRepo.AssertExpectations(t)
		})
	}
}

func TestTransactionService_GetTransactionsByAccountID(t *testing.T) {
	tests := []struct {
		name      string
		setupMocks func(*MockTransactionRepository, *MockAccountRepository)
		userID    uint
		accountID uint
		wantLen   int
		wantErr   bool
		errType   error
	}{
		{
			name: "successful get transactions",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				transactions := []models.Transaction{
					{
						Model:       gorm.Model{ID: 1},
						AccountID:   testAccountID,
						Amount:      100.0,
						Type:        models.TransactionTypeExpense,
						Description: "Test transaction 1",
						Date:        testDate,
					},
					{
						Model:       gorm.Model{ID: 2},
						AccountID:   testAccountID,
						Amount:      50.0,
						Type:        models.TransactionTypeIncome,
						Description: "Test transaction 2",
						Date:        testDate,
					},
				}
				mar.On("FindByID", testAccountID, testUserID).Return(&models.Account{
					Model:  gorm.Model{ID: testAccountID},
					UserID: testUserID,
				}, nil)
				mtr.On("FindByAccountID", testAccountID, testUserID).Return(transactions, nil)
			},
			userID:    testUserID,
			accountID: testAccountID,
			wantLen:   2,
			wantErr:   false,
		},
		{
			name: "account not found",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				mar.On("FindByID", uint(999), testUserID).Return(nil, gorm.ErrRecordNotFound)
			},
			userID:    testUserID,
			accountID: 999,
			wantErr:   true,
			errType:   &errors.NotFoundError{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mocks
			mockTransRepo := new(MockTransactionRepository)
			mockAccRepo := new(MockAccountRepository)
			tt.setupMocks(mockTransRepo, mockAccRepo)

			// Create service with mocks
			service := srv.NewTransactionService(mockTransRepo, mockAccRepo)

			// Call the method being tested
			transactions, err := service.GetTransactionsByAccountID(tt.userID, tt.accountID)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errType != nil {
					switch tt.errType.(type) {
					case *errors.ValidationError:
						assert.IsType(t, &errors.ValidationError{}, err)
					case *errors.NotFoundError:
						assert.IsType(t, &errors.NotFoundError{}, err)
					}
				}
			} else {
				assert.NoError(t, err)
				assert.Len(t, transactions, tt.wantLen)
			}

			// Verify all expectations were met
			mockTransRepo.AssertExpectations(t)
			mockAccRepo.AssertExpectations(t)
		})
	}
}

func TestTransactionService_DeleteTransaction(t *testing.T) {
	tests := []struct {
		name           string
		setupMocks     func(*MockTransactionRepository, *MockAccountRepository)
		userID         uint
		transactionID  uint
		wantErr        bool
		errType        error
	}{
		{
			name: "successful delete",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				// Mock the transaction to be deleted
				transaction := &models.Transaction{
					Model:     gorm.Model{ID: 1},
					AccountID: testAccountID,
					Amount:    100.0,
					Type:      models.TransactionTypeExpense,
				}
				mtr.On("FindByID", uint(1), testUserID).Return(transaction, nil)
				// Mock the balance update (adding the amount back for an expense)
				mar.On("UpdateBalance", testAccountID, 100.0).Return(nil)
				// Mock the delete operation
				mtr.On("Delete", uint(1), testUserID).Return(nil)
			},
			userID:        testUserID,
			transactionID: 1,
			wantErr:       false,
		},
		{
			name: "transaction not found",
			setupMocks: func(mtr *MockTransactionRepository, mar *MockAccountRepository) {
				mtr.On("FindByID", uint(999), testUserID).Return(nil, gorm.ErrRecordNotFound)
			},
			userID:        testUserID,
			transactionID: 999,
			wantErr:       true,
			errType:       &errors.NotFoundError{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mocks
			mockTransRepo := new(MockTransactionRepository)
			mockAccRepo := new(MockAccountRepository)
			tt.setupMocks(mockTransRepo, mockAccRepo)

			// Create service with mocks
			service := srv.NewTransactionService(mockTransRepo, mockAccRepo)

			// Call the method being tested
			err := service.DeleteTransaction(tt.userID, tt.transactionID)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errType != nil {
					switch tt.errType.(type) {
					case *errors.ValidationError:
						assert.IsType(t, &errors.ValidationError{}, err)
					case *errors.NotFoundError:
						assert.IsType(t, &errors.NotFoundError{}, err)
					}
				}
			} else {
				assert.NoError(t, err)
			}

			// Verify all expectations were met
			mockTransRepo.AssertExpectations(t)
			mockAccRepo.AssertExpectations(t)
		})
	}
}
