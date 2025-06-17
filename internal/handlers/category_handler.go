package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/models"
	"github.com/leccarvalho/dinheiros/internal/service"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

type CategoryHandler struct {
	service service.CategoryService
}

func NewCategoryHandler(service service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// ListCategories returns all categories for the authenticated user
// @Summary List all categories
// @Description Get all categories for the authenticated user
// @Tags categories
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {array} models.Category
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /categories [get]
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	userID, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	categories, err := h.service.ListCategories(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// CreateCategoryRequest represents the request body for creating a category
type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreateCategory handles category creation
// @Summary Create a new category
// @Description Create a new category for the authenticated user
// @Tags categories
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateCategoryRequest true "Category details"
// @Success 201 {object} models.Category
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	userID, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name:        req.Name,
		Description: req.Description,
		UserID:      userID.(uint),
	}

	if err := h.service.CreateCategory(c.Request.Context(), &category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}
