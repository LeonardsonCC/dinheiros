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

// CreateAccount handles account creation
// @Summary Create a new account
// @Description Create a new financial account for the authenticated user
// @Tags accounts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateAccountRequest true "Account creation data"
// @Success 201 {object} dto.AccountResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts [post]
func (h *AccountHandler) CreateAccount(c *gin.Context) {
	log.Printf("[AccountHandler] CreateAccount: Starting account creation")

	user := c.GetUint("user")
	if user == 0 {
		log.Printf("[AccountHandler] CreateAccount: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[AccountHandler] CreateAccount: User ID: %d", user)

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
		UserID:         user,
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

// GetAccounts handles fetching all accounts for the user
// @Summary Get all accounts
// @Description Get all accounts owned by or shared with the authenticated user
// @Tags accounts
// @Produce json
// @Security BearerAuth
// @Param include_inactive query boolean false "Include inactive/deleted accounts"
// @Param include_shared query boolean false "Include accounts shared with user"
// @Success 200 {array} dto.AccountResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts [get]
func (h *AccountHandler) GetAccounts(c *gin.Context) {
	user := c.GetUint("user")
	if user == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if we should include deleted accounts and shared accounts
	includeDeleted := c.Query("include_deleted") == "true"
	includeShared := c.Query("include_shared") != "false" // Default to true

	accounts, err := h.accountService.GetAccountsWithOwnershipInfo(user, includeDeleted, includeShared)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

// GetAccount handles fetching a specific account
// @Summary Get account by ID
// @Description Get details of a specific account by its ID
// @Tags accounts
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Success 200 {object} dto.AccountResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id} [get]
func (h *AccountHandler) GetAccount(c *gin.Context) {
	user := c.GetUint("user")
	if user == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	account, err := h.accountService.GetAccountByID(uint(accountID), user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToAccountResponse(account))
}

// UpdateAccount handles updating an existing account
// @Summary Update account
// @Description Update details of an existing account
// @Tags accounts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Param request body dto.UpdateAccountRequest true "Account update data"
// @Success 200 {object} dto.AccountResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id} [put]
func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	user := c.GetUint("user")
	if user == 0 {
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

	updatedAccount, err := h.accountService.UpdateAccount(uint(accountID), user, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account updated successfully",
		"account": dto.ToAccountResponse(updatedAccount),
	})
}

// DeleteAccount handles soft deleting an account
// @Summary Delete account
// @Description Soft delete an account (mark as inactive)
// @Tags accounts
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id} [delete]
func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	user := c.GetUint("user")
	if user == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	if err := h.accountService.DeleteAccount(uint(accountID), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account deleted successfully",
	})
}

// ReactivateAccount handles reactivating a deleted account
// @Summary Reactivate account
// @Description Reactivate a previously deleted account
// @Tags accounts
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Success 200 {object} dto.AccountResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id}/reactivate [post]
func (h *AccountHandler) ReactivateAccount(c *gin.Context) {
	user := c.GetUint("user")
	if user == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	if err := h.accountService.ReactivateAccount(uint(accountID), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reactivating account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account reactivated successfully",
	})
}
