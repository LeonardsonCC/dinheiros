package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/database"
	"github.com/leccarvalho/dinheiros/internal/models"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	db *gorm.DB
}

func NewTransactionHandler() *TransactionHandler {
	return &TransactionHandler{db: database.DB}
}

type CreateTransactionRequest struct {
	Date        string                 `json:"date" binding:"required"`
	Amount      float64                `json:"amount" binding:"required,gt=0"`
	Type        models.TransactionType `json:"type" binding:"required,oneof=income expense transfer"`
	Description string                 `json:"description"`
	CategoryIDs []uint                 `json:"category_ids"`
	ToAccountID *uint                  `json:"to_account_id,omitempty"`
}

func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account exists and belongs to user
	var account models.Account
	if err := h.db.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse the date
	parsedDate, err := time.Parse(time.RFC3339, req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use ISO 8601 (e.g., 2023-01-01T12:00:00Z)"})
		return
	}

	// For transfers, verify the destination account exists and belongs to the user
	var toAccount *models.Account
	if req.Type == models.TransactionTypeTransfer {
		if req.ToAccountID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to_account_id is required for transfers"})
			return
		}

		// Check if the destination account exists and belongs to the user
		var destAccount models.Account
		if err := h.db.Where("id = ? AND user_id = ?", req.ToAccountID, user.(*models.User).ID).First(&destAccount).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Destination account not found"})
			return
		}
		toAccount = &destAccount
	}

	// Create the transaction
	transaction := models.Transaction{
		Date:        parsedDate,
		Amount:      req.Amount,
		Type:        req.Type,
		Description: req.Description,
		AccountID:   uint(accountID),
		ToAccountID: req.ToAccountID,
	}

	// Handle categories
	if len(req.CategoryIDs) > 0 {
		var categories []*models.Category
		for _, catID := range req.CategoryIDs {
			var category models.Category
			// Verify category belongs to user
			if err := h.db.Where("id = ? AND user_id = ?", catID, user.(*models.User).ID).First(&category).Error; err == nil {
				categories = append(categories, &category)
			}
		}
		transaction.Categories = categories
	}

	// Start a database transaction
	tx := h.db.Begin()

	// Save the transaction
	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating transaction"})
		return
	}

	// Update account balances
	switch req.Type {
	case models.TransactionTypeIncome:
		if err := tx.Model(&account).Update("balance", gorm.Expr("balance + ?", req.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating account balance"})
			return
		}
	case models.TransactionTypeExpense:
		if account.Balance < req.Amount {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient funds"})
			return
		}
		if err := tx.Model(&account).Update("balance", gorm.Expr("balance - ?", req.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating account balance"})
			return
		}
	case models.TransactionTypeTransfer:
		if account.Balance < req.Amount {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient funds for transfer"})
			return
		}
		// Deduct from source account
		if err := tx.Model(&account).Update("balance", gorm.Expr("balance - ?", req.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating source account balance"})
			return
		}
		// Add to destination account
		if err := tx.Model(toAccount).Update("balance", gorm.Expr("balance + ?", req.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating destination account balance"})
			return
		}
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Transaction created successfully",
		"transaction": transaction,
	})
}

type TransactionResponse struct {
	ID          uint      `json:"id"`
	Date        time.Time `json:"date"`
	Amount      float64   `json:"amount"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Categories  []struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
	} `json:"categories"`
	ToAccountID *uint `json:"to_account_id,omitempty"`
}

func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account exists and belongs to user
	var account models.Account
	if err := h.db.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	var transactions []models.Transaction
	if err := h.db.Preload("Categories").Where("account_id = ?", accountID).Order("date DESC").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transactions"})
		return
	}

	// Map transactions to response format
	response := make([]TransactionResponse, len(transactions))
	for i, t := range transactions {
		categories := make([]struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
		}, len(t.Categories))

		for j, cat := range t.Categories {
			categories[j] = struct {
				ID   uint   `json:"id"`
				Name string `json:"name"`
			}{ID: cat.ID, Name: cat.Name}
		}

		response[i] = TransactionResponse{
			ID:          t.ID,
			Date:        t.Date,
			Amount:      t.Amount,
			Type:        string(t.Type),
			Description: t.Description,
			Categories:  categories,
			ToAccountID: t.ToAccountID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": response,
	})
}

func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	transactionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Verify account exists and belongs to user
	var account models.Account
	if err := h.db.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	var transaction models.Transaction
	if err := h.db.Where("id = ? AND account_id = ?", transactionID, accountID).First(&transaction).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transaction"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

type DashboardSummaryResponse struct {
	TotalBalance float64 `json:"totalBalance"`
	TotalIncome  float64 `json:"totalIncome"`
	TotalExpenses float64 `json:"totalExpenses"`
	RecentTransactions []struct {
		ID          uint      `json:"id"`
		Amount      float64   `json:"amount"`
		Type        string    `json:"type"`
		Description string    `json:"description"`
		Date        time.Time `json:"date"`
	} `json:"recentTransactions"`
}

func (h *TransactionHandler) GetDashboardSummary(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user's total balance from accounts
	var totalBalance float64
	var accounts []models.Account
	if err := h.db.Where("user_id = ?", user.(*models.User).ID).Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching accounts"})
		return
	}

	for _, acc := range accounts {
		totalBalance += acc.Balance
	}

	// Get total income and expenses
	var incomeResult struct{ Total float64 }
	var expenseResult struct{ Total float64 }

	// Calculate total income
	if err := h.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ? AND transactions.type = ?", user.(*models.User).ID, models.TransactionTypeIncome).
		Select("COALESCE(SUM(transactions.amount), 0) as total").
		Scan(&incomeResult).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error calculating income"})
		return
	}

	// Calculate total expenses
	if err := h.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ? AND transactions.type = ?", user.(*models.User).ID, models.TransactionTypeExpense).
		Select("COALESCE(SUM(transactions.amount), 0) as total").
		Scan(&expenseResult).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error calculating expenses"})
		return
	}

	// Get recent transactions
	recentTransactions := []struct {
		ID          uint      `json:"id"`
		Amount      float64   `json:"amount"`
		Type        string    `json:"type"`
		Description string    `json:"description"`
		Date        time.Time `json:"date"`
	}{}


	if err := h.db.Model(&models.Transaction{}).
		Joins("JOIN accounts ON accounts.id = transactions.account_id").
		Where("accounts.user_id = ?", user.(*models.User).ID).
		Order("transactions.created_at DESC").
		Limit(5).
		Select("transactions.id, transactions.amount, transactions.type, transactions.description, transactions.date").
		Find(&recentTransactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching recent transactions"})
		return
	}

	// Prepare response
	response := DashboardSummaryResponse{
		TotalBalance:      totalBalance,
		TotalIncome:       incomeResult.Total,
		TotalExpenses:     expenseResult.Total,
		RecentTransactions: recentTransactions,
	}

	c.JSON(http.StatusOK, response)
}

func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	transactionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Start a database transaction
	tx := h.db.Begin()

	// Get the transaction with related data
	var transaction models.Transaction
	if err := tx.Preload("Categories").Where("id = ? AND account_id = ?", transactionID, accountID).First(&transaction).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transaction"})
		return
	}

	// Get the account
	var account models.Account
	if err := tx.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// For transfers, we need to update both accounts
	if transaction.Type == models.TransactionTypeTransfer && transaction.ToAccountID != nil {
		var toAccount models.Account
		if err := tx.Where("id = ? AND user_id = ?", transaction.ToAccountID, user.(*models.User).ID).First(&toAccount).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Destination account not found"})
			return
		}

		// Reverse the transfer
		// Add amount back to source account
		if err := tx.Model(&account).Update("balance", gorm.Expr("balance + ?", transaction.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating source account balance"})
			return
		}

		// Deduct from destination account
		if toAccount.Balance < transaction.Amount {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot reverse transfer: insufficient funds in destination account"})
			return
		}
		if err := tx.Model(&toAccount).Update("balance", gorm.Expr("balance - ?", transaction.Amount)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating destination account balance"})
			return
		}
	} else {
		// For income/expense, just update the account balance
		var balanceUpdate float64
		if transaction.Type == models.TransactionTypeIncome {
			// For income, deduct the amount (reverse the income)
			if account.Balance < transaction.Amount {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete transaction: insufficient funds"})
				return
			}
			balanceUpdate = -transaction.Amount
		} else {
			// For expense, add the amount back (reverse the expense)
			balanceUpdate = transaction.Amount
		}

		if err := tx.Model(&account).Update("balance", gorm.Expr("balance + ?", balanceUpdate)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating account balance"})
			return
		}
	}

	// Delete the transaction
	if err := tx.Delete(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting transaction"})
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted successfully",
	})
}
