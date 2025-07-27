package handlers

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"
	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/errors"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
	"github.com/LeonardsonCC/dinheiros/internal/service"
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
	transactionService        service.TransactionService
	categoryService           service.CategoryService
	categorizationRuleService service.CategorizationRuleService
}

type ImportTransactionsRequest struct {
	AccountID uint                  `form:"accountId" binding:"required"`
	File      *multipart.FileHeader `form:"file" binding:"required"`
}

func NewTransactionHandler(transactionService service.TransactionService, categoryService service.CategoryService, categorizationRuleService service.CategorizationRuleService) *TransactionHandler {
	return &TransactionHandler{
		transactionService:        transactionService,
		categoryService:           categoryService,
		categorizationRuleService: categorizationRuleService,
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
	defer func() {
		_ = src.Close()
	}()

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
	defer func() {
		_ = os.Remove(dst) // Clean up after processing
	}()

	// Get extractor from form (optional, fallback to default)
	extractor := c.PostForm("extractor")
	// Extract transaction lines from PDF using the selected extractor and apply categorization rules
	transactions, err := h.transactionService.ExtractTransactionsFromPDFWithExtractorAndRules(dst, uint(accountID), user.(uint), extractor, h.categorizationRuleService)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process PDF: " + err.Error()})
		return
	}

	// Return the parsed transactions for review/editing on the frontend
	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
	})
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

	if req.Type == models.TransactionTypeTransfer {
		if req.ToAccountID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Destination account ID is required for transfers"})
			return
		}

		expenseTx, incomeTx, err := h.transactionService.CreateTransferTransaction(user.(uint), uint(accountID), *req.ToAccountID, req.Amount, req.Description, parsedDate)
		if err != nil {
			if err == errors.ErrSameAccountTransfer || err == errors.ErrFromAccountNotFound || err == errors.ErrToAccountNotFound {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transfer transaction"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message":             "Transfer created successfully",
			"expense_transaction": dto.ToTransactionResponse(expenseTx),
			"income_transaction":  dto.ToTransactionResponse(incomeTx),
		})
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
	// Parse query parameters
	var req dto.ListTransactionsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Call service to get transactions
	transactions, totalItems, err := h.transactionService.ListTransactions(
		userID.(uint),
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
	response := dto.ListTransactionsResponse{
		Data: dto.ToTransactionResponseList(transactions),
		Pagination: dto.PaginationMeta{
			CurrentPage: req.Page,
			PageSize:    req.PageSize,
			TotalItems:  totalItems,
			TotalPages:  int((totalItems + int64(req.PageSize) - 1) / int64(req.PageSize)),
		},
	}

	// Return response
	c.JSON(http.StatusOK, response)
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

	// Get the existing transaction to check its type
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

	if existingTx.ToAccountID != nil && (existingTx.Type == models.TransactionTypeExpense || existingTx.Type == models.TransactionTypeIncome) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot update a transaction that is part of a transfer."})
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

	// Get the existing transaction to check its type
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

	if existingTx.ToAccountID != nil && (existingTx.Type == models.TransactionTypeExpense || existingTx.Type == models.TransactionTypeIncome) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete a transaction that is part of a transfer."})
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

// BulkCreateTransactionsRequest is the request body for bulk transaction creation
type BulkCreateTransactionsRequest struct {
	Transactions []struct {
		Date        string  `json:"date"`
		Amount      float64 `json:"amount"`
		Type        string  `json:"type"`
		Description string  `json:"description"`
		CategoryIDs []uint  `json:"categoryIds"`
	} `json:"transactions"`
}

// BulkCreateTransactions handles saving multiple transactions at once
func (h *TransactionHandler) BulkCreateTransactions(c *gin.Context) {
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
	var req BulkCreateTransactionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.Transactions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No transactions provided"})
		return
	}

	var createdMu = &sync.Mutex{}
	var created []models.Transaction

	g, _ := errgroup.WithContext(c.Request.Context())

	for _, t := range req.Transactions {
		t := t // capture loop variable
		g.Go(func() error {
			var parsedDate time.Time
			var err error
			if t.Date != "" {
				parsedDate, err = time.Parse("2006-01-02", t.Date)
				if err != nil {
					parsedDate, err = time.Parse(time.RFC3339, t.Date)
					if err != nil {
						parsedDate = time.Now()
					}
				}
			} else {
				parsedDate = time.Now()
			}
			txType := models.TransactionType(t.Type)

			transaction, err := h.transactionService.CreateTransaction(
				user.(uint),
				uint(accountID),
				t.Amount,
				txType,
				t.Description,
				nil, // ToAccountID
				t.CategoryIDs,
				parsedDate,
			)
			if err != nil {
				return err
			}
			createdMu.Lock()
			created = append(created, *transaction)
			createdMu.Unlock()
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Transactions created successfully",
		"count":        len(created),
		"transactions": created,
	})
}

func ensureChartJsFormat(labels []string, data []float64) map[string]interface{} {
	return map[string]interface{}{
		"labels": labels,
		"datasets": []map[string]interface{}{
			{
				"label":           "Amount",
				"data":            data,
				"backgroundColor": []string{"#3b82f6", "#6366f1", "#f59e42", "#ef4444", "#10b981", "#fbbf24", "#a78bfa", "#f472b6", "#34d399", "#f87171"},
			},
		},
	}
}

func ensureChartJsFormatInt(labels []string, data []int) map[string]interface{} {
	floatData := make([]float64, len(data))
	for i, v := range data {
		floatData[i] = float64(v)
	}
	return ensureChartJsFormat(labels, floatData)
}

func (h *TransactionHandler) GetStatisticsTransactionsPerDay(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	var startDate, endDate *time.Time
	if startDateStr != "" {
		t, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &t
		}
	}
	if endDateStr != "" {
		t, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &t
		}
	}
	data, err := h.transactionService.GetTransactionsPerDayWithRange(user.(uint), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching statistics"})
		return
	}
	c.JSON(http.StatusOK, ensureChartJsFormatInt(data.Labels, data.Data))
}

func (h *TransactionHandler) GetStatisticsAmountByMonth(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	var startDate, endDate *time.Time
	if startDateStr != "" {
		t, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &t
		}
	}
	if endDateStr != "" {
		t, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &t
		}
	}
	data, err := h.transactionService.GetAmountByMonth(user.(uint), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching statistics"})
		return
	}
	c.JSON(http.StatusOK, ensureChartJsFormat(data.Labels, data.Data))
}

func (h *TransactionHandler) GetStatisticsAmountByAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	var startDate, endDate *time.Time
	if startDateStr != "" {
		t, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &t
		}
	}
	if endDateStr != "" {
		t, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &t
		}
	}
	data, err := h.transactionService.GetAmountByAccount(user.(uint), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching statistics"})
		return
	}
	c.JSON(http.StatusOK, ensureChartJsFormat(data.Labels, data.Data))
}

func (h *TransactionHandler) GetStatisticsAmountByCategory(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	var startDate, endDate *time.Time
	if startDateStr != "" {
		t, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &t
		}
	}
	if endDateStr != "" {
		t, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &t
		}
	}
	data, err := h.transactionService.GetAmountByCategory(user.(uint), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching statistics"})
		return
	}
	c.JSON(http.StatusOK, ensureChartJsFormat(data.Labels, data.Data))
}

func (h *TransactionHandler) GetStatisticsAmountSpentByDay(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	data, err := h.transactionService.GetAmountSpentByDay(user.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching statistics"})
		return
	}
	c.JSON(http.StatusOK, ensureChartJsFormat(data.Labels, data.Data))
}

func (h *TransactionHandler) GetStatisticsAmountSpentAndGainedByDay(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	var startDate, endDate *time.Time
	if startDateStr != "" {
		t, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &t
		}
	}
	if endDateStr != "" {
		t, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &t
		}
	}
	data, labels := h.transactionService.GetAmountSpentAndGainedByDayWithRange(user.(uint), startDate, endDate)
	c.JSON(http.StatusOK, map[string]interface{}{
		"labels": labels,
		"datasets": []map[string]interface{}{
			{
				"label":           "Spent",
				"data":            data["spent"],
				"backgroundColor": "#ef4444",
			},
			{
				"label":           "Gained",
				"data":            data["gained"],
				"backgroundColor": "#10b981",
			},
		},
	})
}

// ListExtractors returns a list of available extractors for transactions import
func (h *TransactionHandler) ListExtractors(c *gin.Context) {
	extractors := pdfextractors.ListExtractors()
	c.JSON(http.StatusOK, gin.H{"extractors": extractors})
}

