package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/database"
	"github.com/leccarvalho/dinheiros/internal/models"
	"gorm.io/gorm"
)

type AccountHandler struct {
	db *gorm.DB
}

func NewAccountHandler() *AccountHandler {
	return &AccountHandler{db: database.DB}
}

type CreateAccountRequest struct {
	Name           string             `json:"name" binding:"required"`
	Type           models.AccountType `json:"type" binding:"required,oneof=checking savings credit cash"`
	Currency       string             `json:"currency" binding:"required,oneof=BRL USD EUR"`
	InitialBalance float64            `json:"initial_balance" binding:"required"`
}

func (h *AccountHandler) CreateAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account := models.Account{
		Name:           req.Name,
		Type:           req.Type,
		Currency:       req.Currency,
		InitialBalance: req.InitialBalance,
		Balance:        req.InitialBalance,
		UserID:         user.(*models.User).ID,
	}

	if err := h.db.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Account created successfully",
		"account": account,
	})
}

func (h *AccountHandler) GetAccounts(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var accounts []models.Account
	if err := h.db.Where("user_id = ?", user.(*models.User).ID).Find(&accounts).Error; err != nil {
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

	accountID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	var account models.Account
	if err := h.db.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching account"})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
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

	// Start a transaction to ensure data consistency
	err = h.db.Transaction(func(tx *gorm.DB) error {
		// Check if account exists and belongs to user
		var account models.Account
		if err := tx.Where("id = ? AND user_id = ?", accountID, user.(*models.User).ID).First(&account).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("account not found")
			}
			return fmt.Errorf("error fetching account: %v", err)
		}

		// Delete all transactions related to this account (both as source and destination)
		if err := tx.Where("account_id = ? OR to_account_id = ?", accountID, accountID).Delete(&models.Transaction{}).Error; err != nil {
			return fmt.Errorf("error deleting related transactions: %v", err)
		}

		// Delete the account
		if err := tx.Delete(&account).Error; err != nil {
			return fmt.Errorf("error deleting account: %v", err)
		}

		return nil
	})

	if err != nil {
		if err.Error() == "account not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account and all related transactions deleted successfully",
	})
}
