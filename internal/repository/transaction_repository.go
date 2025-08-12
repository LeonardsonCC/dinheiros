package repository

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type TransactionRepository interface {
	// Basic CRUD operations
	Create(transaction *models.Transaction) error
	CreateInBatch(transactions []*models.Transaction) error
	FindByID(id uint, userID uint) (*models.Transaction, error)
	FindByAccountID(accountID uint, userID uint) ([]models.Transaction, error)
	FindByUserID(
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
	Update(transaction *models.Transaction) error
	Delete(id uint, userID uint) error
	SoftDeleteByAccountID(accountID uint) error
	ReactivateByAccountID(accountID uint) error
	GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error)
	AssociateCategories(transactionID uint, categoryIDs []uint) error

	// Transaction management
	Begin() *gorm.DB
	Commit(tx *gorm.DB) error
	Rollback(tx *gorm.DB) error
	WithTx(tx *gorm.DB) TransactionRepository
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (r *transactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Debug().Create(transaction).Error
}

func (r *transactionRepository) CreateInBatch(transactions []*models.Transaction) error {
	return r.db.Create(transactions).Error
}

func (r *transactionRepository) FindByID(id uint, userID uint) (*models.Transaction, error) {
	var transaction models.Transaction
	// First try to find by direct account ownership
	err := r.db.Preload("Categories").
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("transactions.id = ? AND accounts.user_id = ?", id, userID).
		First(&transaction).Error
	
	if err == nil {
		return &transaction, nil
	}
	
	// If not found by ownership, check if user has shared access
	// This will only work if account_shares table exists
	var count int64
	shareCheckErr := r.db.Table("account_shares").Where("shared_user_id = ?", userID).Count(&count).Error
	if shareCheckErr == nil {
		// Try to find transaction where user has shared access to the account
		err = r.db.Preload("Categories").
			Joins("JOIN accounts ON accounts.id = transactions.account_id").
			Joins("JOIN account_shares ON account_shares.account_id = accounts.id").
			Where("transactions.id = ? AND account_shares.shared_user_id = ?", id, userID).
			First(&transaction).Error
		if err == nil {
			return &transaction, nil
		}
	}

	// Return the original error (not found)
	return nil, err
}

func (r *transactionRepository) FindByAccountID(accountID uint, userID uint) ([]models.Transaction, error) {
	transactions, _, err := r.FindByUserID(
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

func (r *transactionRepository) FindByUserID(
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
	var transactions []models.Transaction
	var total int64

	// Start building the query - include transactions from owned accounts and shared accounts
	tx := r.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ?", userID)
	
	// Try to include shared accounts if account_shares table exists
	var sharedAccountIDs []uint
	shareCheckErr := r.db.Table("account_shares").Where("shared_user_id = ?", userID).Pluck("account_id", &sharedAccountIDs)
	if shareCheckErr == nil && len(sharedAccountIDs) > 0 {
		tx = tx.Or("accounts.id IN ?", sharedAccountIDs)
	}

	// Apply filters
	if len(transactionTypes) > 0 {
		tx = tx.Where("transactions.type IN ?", transactionTypes)
	}

	if len(accountIDs) > 0 {
		tx = tx.Where("transactions.account_id IN ?", accountIDs)
	}

	if description != "" {
		tx = tx.Where("transactions.description LIKE ?", "%"+description+"%")
	}

	if minAmount != nil {
		tx = tx.Where("transactions.amount >= ?", *minAmount)
	}

	if maxAmount != nil {
		tx = tx.Where("transactions.amount <= ?", *maxAmount)
	}

	if startDate != nil {
		tx = tx.Where("transactions.date >= ?", *startDate)
	}

	if endDate != nil {
		// Include the entire end date
		endOfDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())
		tx = tx.Where("transactions.date <= ?", endOfDay)
	}

	// Get total count for pagination
	if page > 0 && pageSize > 0 {
		if err := tx.Count(&total).Error; err != nil {
			return nil, 0, err
		}
	}

	// Apply category filter if needed
	if len(categoryIDs) > 0 {
		tx = tx.Joins("JOIN transaction_categories ON transaction_categories.transaction_id = transactions.id").
			Where("transaction_categories.category_id IN ?", categoryIDs)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if page > 0 && pageSize > 0 {
		tx = tx.Offset(offset).Limit(pageSize)
	}

	// Execute the query with preloading categories
	err := tx.Preload("Account").Preload("Categories").
		Order("transactions.date DESC, transactions.id DESC").
		Find(&transactions).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.Transaction{}, 0, nil
		}
		return nil, 0, err
	}

	// If no pagination was used, set total to the number of results
	if page <= 0 || pageSize <= 0 {
		total = int64(len(transactions))
	}

	return transactions, total, nil
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

func (r *transactionRepository) SoftDeleteByAccountID(accountID uint) error {
	// Soft delete all transactions for the given account ID
	// GORM will automatically set the deleted_at timestamp when using Delete()
	return r.db.Where("account_id = ?", accountID).Delete(&models.Transaction{}).Error
}

func (r *transactionRepository) ReactivateByAccountID(accountID uint) error {
	// Reactivate all soft-deleted transactions for the given account ID
	// by setting deleted_at to NULL
	return r.db.Unscoped().Model(&models.Transaction{}).Where("account_id = ? AND deleted_at IS NOT NULL", accountID).Update("deleted_at", nil).Error
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

func (r *transactionRepository) WithTx(tx *gorm.DB) TransactionRepository {
	return &transactionRepository{db: tx}
}

func (r *transactionRepository) AssociateCategories(transactionID uint, categoryIDs []uint) error {
	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// First, clear existing categories
	if err := tx.Exec("DELETE FROM transaction_categories WHERE transaction_id = ?", transactionID).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Add new category associations
	for _, catID := range categoryIDs {
		if err := tx.Exec(
			"INSERT INTO transaction_categories (transaction_id, category_id) VALUES (?, ?)",
			transactionID, catID,
		).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
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
