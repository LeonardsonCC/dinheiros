package repository

import (
	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type AccountRepository interface {
	Create(account *models.Account) error
	FindByID(id uint, userID uint) (*models.Account, error)
	FindByUserID(userID uint) ([]models.Account, error)
	Update(account *models.Account) error
	Delete(id uint, userID uint) error
	UpdateBalance(accountID uint, amount float64) error
}

type accountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) AccountRepository {
	return &accountRepository{db: db}
}

func (r *accountRepository) Create(account *models.Account) error {
	return r.db.Create(account).Error
}

func (r *accountRepository) FindByID(id uint, userID uint) (*models.Account, error) {
	var account models.Account
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) FindByUserID(userID uint) ([]models.Account, error) {
	var accounts []models.Account
	err := r.db.Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *accountRepository) Update(account *models.Account) error {
	return r.db.Save(account).Error
}

func (r *accountRepository) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Account{}).Error
}

// UpdateBalance updates the balance of an account by adding the specified amount
func (r *accountRepository) UpdateBalance(accountID uint, amount float64) error {
	return r.db.Model(&models.Account{}).
		Where("id = ?", accountID).
		Update("balance", gorm.Expr("balance + ?", amount)).Error
}
