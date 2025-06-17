package service

import (
	"time"

	"github.com/leccarvalho/dinheiros/internal/errors"
	"github.com/leccarvalho/dinheiros/internal/models"
	repo "github.com/leccarvalho/dinheiros/internal/repository"
)

type TransactionService interface {
	CreateTransaction(userID uint, accountID uint, amount float64, transactionType models.TransactionType, 
		description string, toAccountID *uint, categoryIDs []uint, date time.Time) (*models.Transaction, error)
	GetTransactionByID(userID uint, transactionID uint) (*models.Transaction, error)
	GetTransactionsByAccountID(userID uint, accountID uint) ([]models.Transaction, error)
	UpdateTransaction(userID uint, transaction *models.Transaction) error
	DeleteTransaction(userID uint, transactionID uint) error
	GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error)
}

type transactionService struct {
	transactionRepo repo.TransactionRepository
	accountRepo    repo.AccountRepository
}

func NewTransactionService(
	transactionRepo repo.TransactionRepository,
	accountRepo repo.AccountRepository,
) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		accountRepo:    accountRepo,
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

	return s.transactionRepo.FindByAccountID(accountID, userID)
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
