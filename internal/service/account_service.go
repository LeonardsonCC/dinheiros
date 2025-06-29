package service

import (
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
	repo repository.AccountRepository
}

func NewAccountService(repo repository.AccountRepository) AccountService {
	return &accountService{repo: repo}
}

func (s *accountService) CreateAccount(account *models.Account) error {
	// Set initial balance
	account.Balance = account.InitialBalance
	return s.repo.Create(account)
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
