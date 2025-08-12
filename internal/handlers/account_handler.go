package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/service"
)

type AccountHandler struct {
	accountService service.AccountService
}

func NewAccountHandler(accountService service.AccountService) *AccountHandler {
	return &AccountHandler{accountService: accountService}
}

func (h *AccountHandler) CreateAccount(c *gin.Context) {
	log.Printf("[AccountHandler] CreateAccount: Starting account creation")

	user, exists := c.Get("user")
	if !exists {
		log.Printf("[AccountHandler] CreateAccount: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID := user.(uint)
	log.Printf("[AccountHandler] CreateAccount: User ID: %d", userID)

	var req dto.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[AccountHandler] CreateAccount: JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[AccountHandler] CreateAccount: Request data - Name: %s, Type: %s, InitialBalance: %f, Color: %s",
		req.Name, req.Type, req.InitialBalance, req.Color)

	account := models.Account{
		Name:           req.Name,
		Type:           req.Type,
		InitialBalance: req.InitialBalance,
		UserID:         userID,
		Color:          req.Color,
	}

	if account.Color == "" {
		account.Color = "#cccccc"
		log.Printf("[AccountHandler] CreateAccount: Set default color: %s", account.Color)
	}

	log.Printf("[AccountHandler] CreateAccount: Calling account service with account: %+v", account)

	if err := h.accountService.CreateAccount(&account); err != nil {
		log.Printf("[AccountHandler] CreateAccount: Service error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating account", "message": err.Error()})
		return
	}

	log.Printf("[AccountHandler] CreateAccount: Account created successfully with ID: %d", account.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Account created successfully",
		"account": dto.ToAccountResponse(&account),
	})
}

func (h *AccountHandler) GetAccounts(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if we should include deleted accounts and shared accounts
	includeDeleted := c.Query("include_deleted") == "true"
	includeShared := c.Query("include_shared") != "false" // Default to true

	accounts, err := h.accountService.GetAccountsWithOwnershipInfo(user.(uint), includeDeleted, includeShared)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

func (h *AccountHandler) GetAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	account, err := h.accountService.GetAccountByID(uint(accountID), user.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToAccountResponse(account))
}

func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	var req dto.UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedAccount, err := h.accountService.UpdateAccount(uint(accountID), user.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account updated successfully",
		"account": dto.ToAccountResponse(updatedAccount),
	})
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	if err := h.accountService.DeleteAccount(uint(accountID), user.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account deleted successfully",
	})
}

func (h *AccountHandler) ReactivateAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	if err := h.accountService.ReactivateAccount(uint(accountID), user.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reactivating account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account reactivated successfully",
	})
}
