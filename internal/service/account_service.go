package service

import (
	"errors"
	"log"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/repository"
)

type AccountService interface {
	CreateAccount(account *models.Account) error
	GetAccountByID(id uint, userID uint) (*models.Account, error)
	GetAccountsByUserID(userID uint) ([]models.Account, error)
	GetAccountsByUserIDIncludingDeleted(userID uint) ([]models.Account, error)
	GetAccountsByUserIDIncludingShared(userID uint) ([]models.Account, error)
	GetAccountsByUserIDIncludingSharedAndDeleted(userID uint) ([]models.Account, error)
	GetAccountsWithOwnershipInfo(userID uint, includeDeleted bool, includeShared bool) ([]dto.AccountResponse, error)
	UpdateAccount(id uint, userID uint, req *dto.UpdateAccountRequest) (*models.Account, error)
	DeleteAccount(id uint, userID uint) error
	ReactivateAccount(id uint, userID uint) error
}

type accountService struct {
	repo            repository.AccountRepository
	transactionRepo repository.TransactionRepository
}

func NewAccountService(repo repository.AccountRepository, transactionRepo repository.TransactionRepository) AccountService {
	return &accountService{repo: repo, transactionRepo: transactionRepo}
}

func (s *accountService) CreateAccount(account *models.Account) error {
	log.Printf("[AccountService] CreateAccount: Starting account creation for user %d", account.UserID)
	log.Printf("[AccountService] CreateAccount: Account data: %+v", account)

	tx := s.repo.Begin()
	if tx.Error != nil {
		log.Printf("[AccountService] CreateAccount: Failed to begin transaction: %v", tx.Error)
		return tx.Error
	}
	log.Printf("[AccountService] CreateAccount: Transaction started successfully")

	// a defer function to handle panic and rollback the transaction
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[AccountService] CreateAccount: Panic occurred, rolling back: %v", r)
			tx.Rollback()
		}
	}()

	accountRepoTx := s.repo.WithTx(tx)
	log.Printf("[AccountService] CreateAccount: Created transaction-aware repository")

	initialBalance := account.InitialBalance
	account.Balance = 0
	log.Printf("[AccountService] CreateAccount: Initial balance: %f, setting account balance to 0", initialBalance)

	err := accountRepoTx.Create(account)
	if err != nil {
		log.Printf("[AccountService] CreateAccount: Failed to create account: %v", err)
		tx.Rollback()
		return err
	}
	log.Printf("[AccountService] CreateAccount: Account created successfully with ID: %d", account.ID)

	if initialBalance != 0 {
		log.Printf("[AccountService] CreateAccount: Creating initial balance transaction")
		transactionRepoTx := s.transactionRepo.WithTx(tx)
		t := &models.Transaction{
			Date:        time.Now(),
			Amount:      initialBalance,
			Type:        models.TransactionTypeInitial,
			Description: "Initial Balance",
			AccountID:   account.ID,
		}
		log.Printf("[AccountService] CreateAccount: Initial transaction data: %+v", t)

		err = transactionRepoTx.Create(t)
		if err != nil {
			log.Printf("[AccountService] CreateAccount: Failed to create initial transaction: %v", err)
			tx.Rollback()
			return err
		}
		log.Printf("[AccountService] CreateAccount: Initial transaction created successfully")

		err = accountRepoTx.UpdateBalance(account.ID, initialBalance)
		if err != nil {
			log.Printf("[AccountService] CreateAccount: Failed to update account balance: %v", err)
			tx.Rollback()
			return err
		}
		log.Printf("[AccountService] CreateAccount: Account balance updated successfully")
		account.Balance = initialBalance
	}

	commitErr := tx.Commit().Error
	if commitErr != nil {
		log.Printf("[AccountService] CreateAccount: Failed to commit transaction: %v", commitErr)
		return commitErr
	}

	log.Printf("[AccountService] CreateAccount: Transaction committed successfully")
	return nil
}

func (s *accountService) GetAccountByID(id uint, userID uint) (*models.Account, error) {
	return s.repo.FindByID(id, userID)
}

func (s *accountService) GetAccountsByUserID(userID uint) ([]models.Account, error) {
	return s.repo.FindByUserID(userID)
}

func (s *accountService) GetAccountsByUserIDIncludingDeleted(userID uint) ([]models.Account, error) {
	return s.repo.FindByUserIDIncludingDeleted(userID)
}

func (s *accountService) GetAccountsByUserIDIncludingShared(userID uint) ([]models.Account, error) {
	return s.repo.FindByUserIDIncludingShared(userID)
}

func (s *accountService) GetAccountsByUserIDIncludingSharedAndDeleted(userID uint) ([]models.Account, error) {
	return s.repo.FindByUserIDIncludingSharedAndDeleted(userID)
}

func (s *accountService) UpdateAccount(id uint, userID uint, req *dto.UpdateAccountRequest) (*models.Account, error) {
	// First verify the account belongs to the user (only owners can update accounts)
	isOwner, err := s.repo.IsOwner(id, userID)
	if err != nil {
		return nil, err
	}
	if !isOwner {
		return nil, errors.New("only account owners can update accounts")
	}

	existing, err := s.repo.FindByID(id, userID)
	if err != nil {
		return nil, err
	}

	// Update only allowed fields
	existing.Name = req.Name
	existing.Type = req.Type
	existing.Color = req.Color
	if existing.Color == "" {
		existing.Color = "#cccccc"
	}

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *accountService) DeleteAccount(id uint, userID uint) error {
	// Only account owners can delete accounts
	isOwner, err := s.repo.IsOwner(id, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only account owners can delete accounts")
	}

	// Start a transaction to ensure data consistency
	tx := s.repo.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// First verify the account belongs to the user
	account, err := s.repo.FindByID(id, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Soft delete all transactions associated with this account
	transactionRepoTx := s.transactionRepo.WithTx(tx)
	err = transactionRepoTx.SoftDeleteByAccountID(account.ID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Soft delete the account
	accountRepoTx := s.repo.WithTx(tx)
	err = accountRepoTx.SoftDelete(id, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *accountService) ReactivateAccount(id uint, userID uint) error {
	// Only account owners can reactivate accounts
	isOwner, err := s.repo.IsOwner(id, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only account owners can reactivate accounts")
	}

	// Start a transaction to ensure data consistency
	tx := s.repo.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Reactivate the account
	accountRepoTx := s.repo.WithTx(tx)
	err = accountRepoTx.Reactivate(id, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Reactivate all transactions associated with this account
	transactionRepoTx := s.transactionRepo.WithTx(tx)
	err = transactionRepoTx.ReactivateByAccountID(id)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *accountService) GetAccountsWithOwnershipInfo(userID uint, includeDeleted bool, includeShared bool) ([]dto.AccountResponse, error) {
	var accounts []models.Account
	var err error

	if includeDeleted && includeShared {
		accounts, err = s.repo.FindByUserIDIncludingSharedAndDeleted(userID)
	} else if includeDeleted {
		accounts, err = s.repo.FindByUserIDIncludingDeleted(userID)
	} else if includeShared {
		accounts, err = s.repo.FindByUserIDIncludingShared(userID)
	} else {
		accounts, err = s.repo.FindByUserID(userID)
	}

	if err != nil {
		return nil, err
	}

	responses := make([]dto.AccountResponse, len(accounts))
	for i, account := range accounts {
		// Check if user owns this account
		isOwner := account.UserID == userID
		ownerName := ""
		if !isOwner {
			// Get owner name for shared accounts
			ownerName = account.User.Name
		}

		responses[i] = dto.ToAccountResponseWithOwnership(&account, isOwner, ownerName)
	}

	return responses, nil
}
