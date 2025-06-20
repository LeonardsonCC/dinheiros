package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"mime/multipart"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/errors"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UpdateTransactionRequest struct {
	Date        string  `json:"date"`
	Amount      float64 `json:"amount"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	CategoryIDs []uint  `json:"category_ids"`
	ToAccountID *uint   `json:"to_account_id,omitempty"`
}

type TransactionHandler struct {
	transactionService service.TransactionService
	pdfService         service.PDFService
}

type ImportTransactionsRequest struct {
	AccountID uint                  `form:"accountId" binding:"required"`
	File      *multipart.FileHeader `form:"file" binding:"required"`
}

func NewTransactionHandler(transactionService service.TransactionService, pdfService service.PDFService) *TransactionHandler {
	return &TransactionHandler{
		transactionService: transactionService,
		pdfService:         pdfService,
	}
}

// maxUploadSize is the maximum allowed file size (10MB)
const maxUploadSize = 10 << 20 // 10MB

// isPDF checks if the file is a valid PDF by checking the magic number
func isPDF(fileHeader *multipart.FileHeader) (bool, error) {
	// Open the file
	src, err := fileHeader.Open()
	if err != nil {
		return false, err
	}
	defer src.Close()

	// Read the first 4 bytes to check the PDF magic number
	buf := make([]byte, 4)
	if _, err := src.Read(buf); err != nil {
		return false, err
	}

	// Check if the file starts with the PDF magic number "%PDF"
	return string(buf) == "%PDF", nil
}

// ImportTransactions handles the import of transactions from a file
func (h *TransactionHandler) ImportTransactions(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get account ID from URL
	accountIDStr := c.Param("id")
	if accountIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account ID is required"})
		return
	}

	accountID, err := strconv.ParseUint(accountIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Get the uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Validate file size
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is too large. Maximum size is 10MB"})
		return
	}

	// Check file type
	if file.Header.Get("Content-Type") != "application/pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only PDF files are allowed"})
		return
	}

	// Verify it's a valid PDF by checking the magic number
	isValidPDF, err := isPDF(file)
	if err != nil || !isValidPDF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PDF file"})
		return
	}

	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll("uploads", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
		return
	}

	// Save the uploaded file with a unique name to prevent collisions
	dst := filepath.Join("uploads", fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename))
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer os.Remove(dst) // Clean up after processing

	// Extract transaction lines from PDF
	lines, err := h.pdfService.ExtractTransactions(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process PDF: " + err.Error()})
		return
	}

	// Parse transactions from lines
	transactions, err := parseTransactionsFromLines(lines, uint(accountID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse transactions: " + err.Error()})
		return
	}

	// Create transactions
	createdCount := 0
	for _, tx := range transactions {
		_, err := h.transactionService.CreateTransaction(
			user.(uint),
			tx.AccountID,
			tx.Amount,
			tx.Type,
			tx.Description,
			tx.ToAccountID,
			nil, // No categories for now
			tx.Date,
		)
		if err != nil {
			// Log the error but continue with other transactions
			fmt.Printf("Failed to create transaction: %v\n", err)
			continue
		}
		createdCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":               "File processed successfully",
		"transactions_imported": createdCount,
	})
}

// parseTransactionsFromLines parses transactions from the extracted lines
func parseTransactionsFromLines(lines []string, accountID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	for _, line := range lines {
		fields := strings.Split(line, " | ")
		if len(fields) < 5 {
			continue // skip incomplete rows
		}
		dateStr := strings.TrimSpace(fields[0])
		description := strings.TrimSpace(fields[2])
		valor := strings.TrimSpace(fields[3])
		valorParts := strings.Fields(valor)
		if len(valorParts) < 2 {
			continue
		}
		amountStr := strings.ReplaceAll(valorParts[0], ".", "")
		amountStr = strings.ReplaceAll(amountStr, ",", ".")
		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			continue
		}
		if amount == 0 {
			continue // skip zero-amount transactions
		}
		var txType models.TransactionType = models.TransactionTypeExpense
		if strings.ToUpper(valorParts[1]) == "C" {
			txType = models.TransactionTypeIncome
		}
		date, err := time.Parse("02/01/2006", dateStr)
		if err != nil {
			date, err = time.Parse("02-01-2006", dateStr)
			if err != nil {
				continue
			}
		}
		transaction := models.Transaction{
			AccountID:   accountID,
			Amount:      amount,
			Type:        txType,
			Description: description,
			Date:        date,
		}
		transactions = append(transactions, transaction)
	}
	return transactions, nil
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

	var req dto.CreateTransactionRequest
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

	// Create the transaction using the service
	transaction, err := h.transactionService.CreateTransaction(
		user.(uint),
		uint(accountID),
		req.Amount,
		req.Type,
		req.Description,
		req.ToAccountID,
		req.CategoryIDs,
		parsedDate,
	)

	if err != nil {
		switch e := err.(type) {
		case *errors.ValidationError:
			c.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		case *errors.NotFoundError:
			c.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating transaction"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Transaction created successfully",
		"transaction": dto.ToTransactionResponse(transaction),
	})
}

func (h *TransactionHandler) ListTransactions(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	var req dto.ListTransactionsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID := user.(uint)

	// Call service to get transactions
	transactions, total, err := h.transactionService.ListTransactions(
		userID,
		req.Types,
		req.AccountIDs,
		req.CategoryIDs,
		req.Description,
		req.MinAmount,
		req.MaxAmount,
		req.StartDate,
		req.EndDate,
		req.Page,
		req.PageSize,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	// Convert transactions to response DTOs
	transactionResponses := make([]dto.TransactionResponse, len(transactions))
	for i, t := range transactions {
		transactionResponses[i] = dto.ToTransactionResponse(&t)
	}

	// Calculate pagination metadata
	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))
	if req.PageSize == 0 {
		totalPages = 1
	}

	// Return response
	c.JSON(http.StatusOK, dto.ListTransactionsResponse{
		Data: transactionResponses,
		Pagination: dto.PaginationMeta{
			CurrentPage: req.Page,
			PageSize:    req.PageSize,
			TotalItems:  total,
			TotalPages:  totalPages,
		},
	})
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

	transactions, err := h.transactionService.GetTransactionsByAccountID(user.(uint), uint(accountID))
	if err != nil {
		// Only treat as error if it's not NotFoundError
		if _, ok := err.(*errors.NotFoundError); ok {
			// If NotFoundError, treat as empty list
			c.JSON(http.StatusOK, dto.ToTransactionResponseList([]models.Transaction{}))
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transactions"})
		return
	}

	// If transactions is nil, treat as empty list
	if len(transactions) == 0 {
		c.JSON(http.StatusOK, dto.ToTransactionResponseList([]models.Transaction{}))
		return
	}

	c.JSON(http.StatusOK, dto.ToTransactionResponseList(transactions))
}

func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := strconv.Atoi(c.Param("transactionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	transaction, err := h.transactionService.GetTransactionByID(user.(uint), uint(transactionID))
	if err != nil {
		switch e := err.(type) {
		case *errors.NotFoundError:
			c.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transaction"})
		}
		return
	}

	c.JSON(http.StatusOK, dto.ToTransactionResponse(transaction))
}

type DashboardSummaryResponse struct {
	TotalBalance       float64 `json:"totalBalance"`
	TotalIncome        float64 `json:"totalIncome"`
	TotalExpenses      float64 `json:"totalExpenses"`
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

	totalBalance, totalIncome, totalExpenses, recentTransactions, err := h.transactionService.GetDashboardSummary(user.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching dashboard summary"})
		return
	}

	// Convert transactions to response DTOs
	recentTransactionsResponse := make([]dto.TransactionResponse, len(recentTransactions))
	for i, t := range recentTransactions {
		transaction := t // Create a new variable to avoid implicit memory aliasing
		recentTransactionsResponse[i] = dto.ToTransactionResponse(&transaction)
	}

	// For now, we'll keep the categories and monthly trends empty in the response
	// as they're not part of the service layer yet
	transactionsByCategory := make(map[string]float64)
	monthlyTrends := make(map[string]map[string]float64)

	c.JSON(http.StatusOK, gin.H{
		"totalBalance":           totalBalance,
		"totalIncome":            totalIncome,
		"totalExpenses":          totalExpenses,
		"recentTransactions":     recentTransactionsResponse,
		"transactionsByCategory": transactionsByCategory,
		"monthlyTrends":          monthlyTrends,
	})
}

func (h *TransactionHandler) UpdateTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := strconv.Atoi(c.Param("transactionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Get the existing transaction to verify ownership
	existingTx, err := h.transactionService.GetTransactionByID(user.(uint), uint(transactionID))
	if err != nil {
		switch e := err.(type) {
		case *errors.NotFoundError:
			c.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transaction"})
		}
		return
	}

	var req UpdateTransactionRequest
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

	// Update the transaction fields
	// Ensure amount is always positive
	amount := req.Amount
	if amount < 0 {
		amount = -amount // Convert to positive if negative
	}
	existingTx.Amount = amount
	existingTx.Type = models.TransactionType(req.Type)
	existingTx.Description = req.Description
	existingTx.Date = parsedDate
	existingTx.ToAccountID = req.ToAccountID

	// Update categories if provided
	if req.CategoryIDs != nil {
		existingTx.Categories = make([]*models.Category, len(req.CategoryIDs))
		for i, catID := range req.CategoryIDs {
			existingTx.Categories[i] = &models.Category{Model: gorm.Model{ID: catID}}
		}
	}

	// Save the updated transaction
	err = h.transactionService.UpdateTransaction(user.(uint), existingTx)
	if err != nil {
		switch e := err.(type) {
		case *errors.ValidationError:
			c.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		case *errors.NotFoundError:
			c.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating transaction"})
		}
		return
	}

	// Fetch the updated transaction with all its relations
	updatedTx, err := h.transactionService.GetTransactionByID(user.(uint), existingTx.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching updated transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Transaction updated successfully",
		"transaction": dto.ToTransactionResponse(updatedTx),
	})
}

func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := strconv.Atoi(c.Param("transactionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	err = h.transactionService.DeleteTransaction(user.(uint), uint(transactionID))
	if err != nil {
		switch e := err.(type) {
		case *errors.NotFoundError:
			c.JSON(http.StatusNotFound, gin.H{"error": e.Error()})
		case *errors.ValidationError:
			c.JSON(http.StatusBadRequest, gin.H{"error": e.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting transaction"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted successfully",
	})
}
