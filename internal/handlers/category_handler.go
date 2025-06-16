package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/leccarvalho/dinheiros/internal/database"
	"github.com/leccarvalho/dinheiros/internal/models"
)

type CategoryHandler struct {
	db *gorm.DB
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{db: database.DB}
}

// ListCategories returns all categories
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var categories []models.Category
	if err := h.db.Where("user_id = ?", user.(*models.User).ID).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// CreateCategory handles category creation
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	type CreateCategoryRequest struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name:        req.Name,
		Description: req.Description,
		UserID:      user.(*models.User).ID,
	}

	if err := h.db.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}
