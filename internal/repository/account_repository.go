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
	FindByUserIDIncludingDeleted(userID uint) ([]models.Account, error)
	FindByUserIDIncludingShared(userID uint) ([]models.Account, error)
	FindByUserIDIncludingSharedAndDeleted(userID uint) ([]models.Account, error)
	HasAccess(accountID uint, userID uint) (bool, error)
	IsOwner(accountID uint, userID uint) (bool, error)
	Update(account *models.Account) error
	Delete(id uint, userID uint) error
	SoftDelete(id uint, userID uint) error
	Reactivate(id uint, userID uint) error
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
	err := r.db.Create(account).Error
	if err != nil {
		log.Printf("[AccountRepository] Create: Error creating account: %v", err)
	} else {
		log.Printf("[AccountRepository] Create: Account created successfully with ID: %d", account.ID)
	}
	return err
}

func (r *accountRepository) FindByID(id uint, userID uint) (*models.Account, error) {
	var account models.Account
	// First try to find by direct ownership
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&account).Error
	if err == nil {
		return &account, nil
	}

	// If not found by ownership, check if user has shared access
	// This will only work if account_shares table exists
	var count int64
	shareCheckErr := r.db.Table("account_shares").Where("account_id = ? AND shared_user_id = ?", id, userID).Count(&count).Error
	if shareCheckErr == nil && count > 0 {
		// User has shared access, get the account without user restriction
		err = r.db.Where("id = ?", id).First(&account).Error
		if err != nil {
			return nil, err
		}
		return &account, nil
	}

	// Return the original error (not found)
	return nil, err
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

func (r *accountRepository) FindByUserIDIncludingDeleted(userID uint) ([]models.Account, error) {
	var accounts []models.Account
	err := r.db.Unscoped().Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *accountRepository) FindByUserIDIncludingShared(userID uint) ([]models.Account, error) {
	var accounts []models.Account
	// Get accounts owned by user
	err := r.db.Preload("User").Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		return nil, err
	}

	// Try to get shared accounts if account_shares table exists
	var sharedAccounts []models.Account
	shareCheckErr := r.db.Table("account_shares").Where("shared_user_id = ?", userID).Select("account_id").Error
	if shareCheckErr == nil {
		// Get the actual shared accounts
		var accountIDs []uint
		r.db.Table("account_shares").Where("shared_user_id = ?", userID).Pluck("account_id", &accountIDs)
		if len(accountIDs) > 0 {
			r.db.Preload("User").Where("id IN ?", accountIDs).Find(&sharedAccounts)
			accounts = append(accounts, sharedAccounts...)
		}
	}

	return accounts, nil
}

func (r *accountRepository) FindByUserIDIncludingSharedAndDeleted(userID uint) ([]models.Account, error) {
	var accounts []models.Account
	// Get accounts owned by user (including soft deleted)
	err := r.db.Unscoped().Preload("User").Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		return nil, err
	}

	// Try to get shared accounts if account_shares table exists
	var sharedAccounts []models.Account
	shareCheckErr := r.db.Table("account_shares").Where("shared_user_id = ?", userID).Select("account_id").Error
	if shareCheckErr == nil {
		// Get the actual shared accounts (including soft deleted)
		var accountIDs []uint
		r.db.Table("account_shares").Where("shared_user_id = ?", userID).Pluck("account_id", &accountIDs)
		if len(accountIDs) > 0 {
			r.db.Unscoped().Preload("User").Where("id IN ?", accountIDs).Find(&sharedAccounts)
			accounts = append(accounts, sharedAccounts...)
		}
	}

	return accounts, nil
}

func (r *accountRepository) HasAccess(accountID uint, userID uint) (bool, error) {
	// First check direct ownership
	var count int64
	err := r.db.Model(&models.Account{}).Where("id = ? AND user_id = ?", accountID, userID).Count(&count).Error
	if err != nil {
		return false, err
	}
	if count > 0 {
		return true, nil
	}

	// Check shared access if account_shares table exists
	shareCheckErr := r.db.Table("account_shares").Where("account_id = ? AND shared_user_id = ?", accountID, userID).Count(&count).Error
	if shareCheckErr == nil && count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *accountRepository) IsOwner(accountID uint, userID uint) (bool, error) {
	var count int64
	// Check if user owns the account (not just shared access)
	err := r.db.Model(&models.Account{}).Where("id = ? AND user_id = ?", accountID, userID).Count(&count).Error
	return count > 0, err
}

func (r *accountRepository) Update(account *models.Account) error {
	return r.db.Save(account).Error
}

func (r *accountRepository) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Unscoped().Delete(&models.Account{}).Error
}

func (r *accountRepository) SoftDelete(id uint, userID uint) error {
	// Only account owner can delete accounts
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Account{}).Error
}

func (r *accountRepository) Reactivate(id uint, userID uint) error {
	// Only account owner can reactivate accounts
	return r.db.Unscoped().Model(&models.Account{}).Where("id = ? AND user_id = ?", id, userID).Update("deleted_at", nil).Error
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
