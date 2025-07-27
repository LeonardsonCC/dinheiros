package service

import (
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
	UpdateAccount(id uint, userID uint, req *dto.UpdateAccountRequest) (*models.Account, error)
	DeleteAccount(id uint, userID uint) error
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

func (s *accountService) UpdateAccount(id uint, userID uint, req *dto.UpdateAccountRequest) (*models.Account, error) {
	// First verify the account belongs to the user
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
	return s.repo.Delete(id, userID)
}
