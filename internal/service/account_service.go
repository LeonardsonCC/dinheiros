package service

import (
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
	tx := s.repo.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	// a defer function to handle panic and rollback the transaction
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	accountRepoTx := s.repo.WithTx(tx)

	initialBalance := account.InitialBalance
	account.Balance = 0

	err := accountRepoTx.Create(account)
	if err != nil {
		tx.Rollback()
		return err
	}

	if initialBalance != 0 {
		transactionRepoTx := s.transactionRepo.WithTx(tx)
		t := &models.Transaction{
			Date:        time.Now(),
			Amount:      initialBalance,
			Type:        models.TransactionTypeInitial,
			Description: "Initial Balance",
			AccountID:   account.ID,
		}

		err = transactionRepoTx.Create(t)
		if err != nil {
			tx.Rollback()
			return err
		}

		err = accountRepoTx.UpdateBalance(account.ID, initialBalance)
		if err != nil {
			tx.Rollback()
			return err
		}
		account.Balance = initialBalance
	}

	return tx.Commit().Error
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
