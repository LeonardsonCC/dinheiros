package repository

import (
	"time"

	"github.com/leccarvalho/dinheiros/internal/models"
	"gorm.io/gorm"
)

type TransactionRepository interface {
	// Basic CRUD operations
	Create(transaction *models.Transaction) error
	FindByID(id uint, userID uint) (*models.Transaction, error)
	FindByAccountID(accountID uint, userID uint) ([]models.Transaction, error)
	Update(transaction *models.Transaction) error
	Delete(id uint, userID uint) error
	GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error)
	
	// Transaction management
	Begin() *gorm.DB
	Commit(tx *gorm.DB) error
	Rollback(tx *gorm.DB) error
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (r *transactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *transactionRepository) FindByID(id uint, userID uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.Preload("Categories").
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("transactions.id = ? AND accounts.user_id = ?", id, userID).
		First(&transaction).Error

	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (r *transactionRepository) FindByAccountID(accountID uint, userID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction

	err := r.db.Preload("Categories").
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("transactions.account_id = ? AND accounts.user_id = ?", accountID, userID).
		Order("date DESC").
		Find(&transactions).Error

	if err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *transactionRepository) Update(transaction *models.Transaction) error {
	return r.db.Save(transaction).Error
}

func (r *transactionRepository) Delete(id uint, userID uint) error {
	// First verify the transaction belongs to the user
	_, err := r.FindByID(id, userID)
	if err != nil {
		return err
	}

	// Delete the transaction
	return r.db.Delete(&models.Transaction{}, id).Error
}

// Begin starts a new transaction
func (r *transactionRepository) Begin() *gorm.DB {
	return r.db.Begin()
}

// Commit commits a transaction
func (r *transactionRepository) Commit(tx *gorm.DB) error {
	return tx.Commit().Error
}

// Rollback rolls back a transaction
func (r *transactionRepository) Rollback(tx *gorm.DB) error {
	return tx.Rollback().Error
}

func (r *transactionRepository) GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error) {
	// Get total balance from all accounts
	var totalBalance struct{ Sum float64 }
	err := r.db.Model(&models.Account{}).
		Select("COALESCE(SUM(balance), 0) as sum").
		Where("user_id = ?", userID).
		Scan(&totalBalance).Error

	if err != nil {
		return 0, 0, 0, nil, err
	}

	// Get total income for current month
	now := time.Now()
	firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var totalIncome struct{ Sum float64 }
	err = r.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ? AND transactions.type = ? AND transactions.date >= ?", 
			userID, models.TransactionTypeIncome, firstOfMonth).
		Select("COALESCE(SUM(amount), 0) as sum").
		Scan(&totalIncome).Error

	if err != nil {
		return 0, 0, 0, nil, err
	}

	// Get total expenses for current month
	var totalExpenses struct{ Sum float64 }
	err = r.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ? AND transactions.type = ? AND transactions.date >= ?", 
			userID, models.TransactionTypeExpense, firstOfMonth).
		Select("COALESCE(SUM(amount), 0) as sum").
		Scan(&totalExpenses).Error

	if err != nil {
		return 0, 0, 0, nil, err
	}

	// Get recent transactions (last 5)
	var recentTransactions []models.Transaction
	err = r.db.Preload("Categories").
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ?", userID).
		Order("date DESC").
		Limit(5).
		Find(&recentTransactions).Error

	if err != nil {
		return 0, 0, 0, nil, err
	}

	return totalBalance.Sum, totalIncome.Sum, totalExpenses.Sum, recentTransactions, nil
}
