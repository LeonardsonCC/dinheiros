package service

import (
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/errors"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
	repo "github.com/LeonardsonCC/dinheiros/internal/repository"
)

type TransactionService interface {
	CreateTransaction(userID uint, accountID uint, amount float64, transactionType models.TransactionType,
		description string, toAccountID *uint, categoryIDs []uint, date time.Time) (*models.Transaction, error)
	GetTransactionByID(userID uint, transactionID uint) (*models.Transaction, error)
	GetTransactionsByAccountID(userID uint, accountID uint) ([]models.Transaction, error)
	ListTransactions(
		userID uint,
		transactionTypes []models.TransactionType,
		accountIDs []uint,
		categoryIDs []uint,
		description string,
		minAmount *float64,
		maxAmount *float64,
		startDate *time.Time,
		endDate *time.Time,
		page int,
		pageSize int,
	) ([]models.Transaction, int64, error)
	UpdateTransaction(userID uint, transaction *models.Transaction) error
	DeleteTransaction(userID uint, transactionID uint) error
	GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error)
	ExtractTransactionsFromPDF(filePath string, accountID uint) ([]models.Transaction, error)
	AssociateCategories(transactionID uint, categoryIDs []uint) error
}

type transactionService struct {
	transactionRepo repo.TransactionRepository
	accountRepo     repo.AccountRepository
}

func NewTransactionService(
	transactionRepo repo.TransactionRepository,
	accountRepo repo.AccountRepository,
) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		accountRepo:     accountRepo,
	}
}

func (s *transactionService) CreateTransaction(
	userID uint,
	accountID uint,
	amount float64,
	transactionType models.TransactionType,
	description string,
	toAccountID *uint,
	categoryIDs []uint,
	date time.Time,
) (*models.Transaction, error) {
	// Verify account exists and belongs to user
	account, err := s.accountRepo.FindByID(accountID, userID)
	if err != nil {
		return nil, err
	}

	// For transfers, verify the destination account exists and belongs to the user
	if transactionType == models.TransactionTypeTransfer {
		if toAccountID == nil {
			return nil, errors.ErrInvalidRequest
		}

		// Check if the destination account exists and belongs to the user
		if _, err := s.accountRepo.FindByID(*toAccountID, userID); err != nil {
			return nil, errors.ErrNotFound
		}
	}

	// Create the transaction
	transaction := &models.Transaction{
		Date:        date,
		Amount:      amount,
		Type:        transactionType,
		Description: description,
		AccountID:   accountID,
		ToAccountID: toAccountID,
	}

	// Save the transaction
	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	// Associate categories if provided
	if len(categoryIDs) > 0 {
		if err := s.transactionRepo.AssociateCategories(transaction.ID, categoryIDs); err != nil {
			return nil, err
		}
	}

	// Update account balances
	switch transactionType {
	case models.TransactionTypeIncome:
		if err := s.accountRepo.UpdateBalance(accountID, amount); err != nil {
			return nil, err
		}

	case models.TransactionTypeExpense:
		if account.Balance < amount {
			return nil, errors.ErrInsufficientFunds
		}
		if err := s.accountRepo.UpdateBalance(accountID, -amount); err != nil {
			return nil, err
		}

	case models.TransactionTypeTransfer:
		if account.Balance < amount {
			return nil, errors.ErrInsufficientFunds
		}
		// Deduct from source account
		if err := s.accountRepo.UpdateBalance(accountID, -amount); err != nil {
			return nil, err
		}
		// Add to destination account
		if err := s.accountRepo.UpdateBalance(*toAccountID, amount); err != nil {
			// Compensate the source account
			s.accountRepo.UpdateBalance(accountID, amount)
			return nil, err
		}
	}

	return transaction, nil
}

func (s *transactionService) GetTransactionByID(userID uint, transactionID uint) (*models.Transaction, error) {
	return s.transactionRepo.FindByID(transactionID, userID)
}

func (s *transactionService) GetTransactionsByAccountID(userID uint, accountID uint) ([]models.Transaction, error) {
	// Verify account exists and belongs to user
	if _, err := s.accountRepo.FindByID(accountID, userID); err != nil {
		return nil, err
	}

	transactions, _, err := s.transactionRepo.FindByUserID(
		userID,
		nil,               // transactionTypes
		[]uint{accountID}, // accountIDs
		nil,               // categoryIDs
		"",                // description
		nil,               // minAmount
		nil,               // maxAmount
		nil,               // startDate
		nil,               // endDate
		0,                 // page (0 means no pagination)
		0,                 // pageSize (0 means no pagination)
	)
	return transactions, err
}

func (s *transactionService) ListTransactions(
	userID uint,
	transactionTypes []models.TransactionType,
	accountIDs []uint,
	categoryIDs []uint,
	description string,
	minAmount *float64,
	maxAmount *float64,
	startDate *time.Time,
	endDate *time.Time,
	page int,
	pageSize int,
) ([]models.Transaction, int64, error) {
	// Verify accounts belong to user if accountIDs are provided
	if len(accountIDs) > 0 {
		userAccounts, err := s.accountRepo.FindByUserID(userID)
		if err != nil {
			return nil, 0, err
		}

		// Create a map of valid account IDs for this user
		validAccountIDs := make(map[uint]bool)
		for _, account := range userAccounts {
			validAccountIDs[account.ID] = true
		}

		// Verify all requested account IDs are valid
		for _, id := range accountIDs {
			if !validAccountIDs[id] {
				return nil, 0, errors.ErrNotFound
			}
		}
	}

	// Call the repository method with all filters
	return s.transactionRepo.FindByUserID(
		userID,
		transactionTypes,
		accountIDs,
		categoryIDs,
		description,
		minAmount,
		maxAmount,
		startDate,
		endDate,
		page,
		pageSize,
	)
}

func (s *transactionService) UpdateTransaction(userID uint, transaction *models.Transaction) error {
	// Verify transaction exists and belongs to user
	existingTx, err := s.transactionRepo.FindByID(transaction.ID, userID)
	if err != nil {
		return err
	}

	// Update the categories
	tx := s.transactionRepo.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update transaction fields
	err = tx.Model(&existingTx).Updates(transaction).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// Update categories association
	if len(transaction.Categories) > 0 {
		err = tx.Model(&existingTx).Association("Categories").Replace(transaction.Categories)
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// If no categories provided, clear existing ones
		err = tx.Model(&existingTx).Association("Categories").Clear()
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (s *transactionService) DeleteTransaction(userID uint, transactionID uint) error {
	// Verify transaction exists and belongs to user
	transaction, err := s.transactionRepo.FindByID(transactionID, userID)
	if err != nil {
		return err
	}

	// Update account balance based on transaction type
	switch transaction.Type {
	case models.TransactionTypeIncome:
		// Deduct the amount from the account
		if err := s.accountRepo.UpdateBalance(transaction.AccountID, -transaction.Amount); err != nil {
			return err
		}

	case models.TransactionTypeExpense:
		// Add the amount back to the account
		if err := s.accountRepo.UpdateBalance(transaction.AccountID, transaction.Amount); err != nil {
			return err
		}

	case models.TransactionTypeTransfer:
		// Add amount back to source account
		if err := s.accountRepo.UpdateBalance(transaction.AccountID, transaction.Amount); err != nil {
			return err
		}
		// Deduct amount from destination account
		if transaction.ToAccountID != nil {
			if err := s.accountRepo.UpdateBalance(*transaction.ToAccountID, -transaction.Amount); err != nil {
				// Compensate the source account
				s.accountRepo.UpdateBalance(transaction.AccountID, -transaction.Amount)
				return err
			}
		}
	}

	// Delete the transaction
	return s.transactionRepo.Delete(transactionID, userID)
}

func (s *transactionService) GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error) {
	return s.transactionRepo.GetDashboardSummary(userID)
}

func (s *transactionService) ExtractTransactionsFromPDF(filePath string, accountID uint) ([]models.Transaction, error) {
	extractor := pdfextractors.GetExtractorByName("caixa")

	transactions, err := extractor.ExtractTransactions(filePath, accountID)
	if err != nil {
		return nil, err
	}

	return transactions, nil
}

// Implement AssociateCategories method in transactionService
func (s *transactionService) AssociateCategories(transactionID uint, categoryIDs []uint) error {
	return s.transactionRepo.AssociateCategories(transactionID, categoryIDs)
}
