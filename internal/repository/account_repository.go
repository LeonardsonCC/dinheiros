package repository

import (
	"log"

	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type AccountRepository interface {
	Create(account *models.Account) error
	FindByID(id uint, userID uint) (*models.Account, error)
	FindByIDWithoutUserCheck(id uint) (*models.Account, error)
	FindByUserID(userID uint) ([]models.Account, error)
	Update(account *models.Account) error
	Delete(id uint, userID uint) error
	UpdateBalance(accountID uint, amount float64) error

	// Transaction management
	Begin() *gorm.DB
	Commit(tx *gorm.DB) error
	Rollback(tx *gorm.DB) error
	WithTx(tx *gorm.DB) AccountRepository
}

type accountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) AccountRepository {
	return &accountRepository{db: db}
}

func (r *accountRepository) Create(account *models.Account) error {
	log.Printf("[AccountRepository] Create: Creating account: %+v", account)
	err := r.db.Debug().Create(account).Error
	if err != nil {
		log.Printf("[AccountRepository] Create: Error creating account: %v", err)
	} else {
		log.Printf("[AccountRepository] Create: Account created successfully with ID: %d", account.ID)
	}
	return err
}

func (r *accountRepository) FindByID(id uint, userID uint) (*models.Account, error) {
	var account models.Account
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) FindByIDWithoutUserCheck(id uint) (*models.Account, error) {
	var account models.Account
	err := r.db.First(&account, id).Error
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

// Begin starts a new transaction
func (r *accountRepository) Begin() *gorm.DB {
	return r.db.Begin()
}

// Commit commits a transaction
func (r *accountRepository) Commit(tx *gorm.DB) error {
	return tx.Commit().Error
}

// Rollback rolls back a transaction
func (r *accountRepository) Rollback(tx *gorm.DB) error {
	return tx.Rollback().Error
}

func (r *accountRepository) WithTx(tx *gorm.DB) AccountRepository {
	return &accountRepository{db: tx}
}
