package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/service"
)

type CategorizationRuleHandler struct {
	Service service.CategorizationRuleService
}

func NewCategorizationRuleHandler(s service.CategorizationRuleService) *CategorizationRuleHandler {
	return &CategorizationRuleHandler{Service: s}
}

// ListRules handles fetching all categorization rules
// @Summary List categorization rules
// @Description Get all categorization rules for the authenticated user
// @Tags categorization-rules
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.CategorizationRuleDTO
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /categorization-rules [get]
func (h *CategorizationRuleHandler) ListRules(c *gin.Context) {
	user := c.GetUint("user")
	if user != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	rules, err := h.Service.ListRules(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	dtos := make([]dto.CategorizationRuleDTO, len(rules))
	for i, rule := range rules {
		dtos[i] = toCategorizationRuleDTO(rule)
	}
	c.JSON(http.StatusOK, dtos)
}

// GetRule handles fetching a specific categorization rule
// @Summary Get categorization rule by ID
// @Description Get details of a specific categorization rule by its ID
// @Tags categorization-rules
// @Produce json
// @Security BearerAuth
// @Param id path int true "Rule ID"
// @Success 200 {object} dto.CategorizationRuleDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /categorization-rules/{id} [get]
func (h *CategorizationRuleHandler) GetRule(c *gin.Context) {
	user := c.GetUint("user")
	if user != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rule, err := h.Service.GetRuleByID(c.Request.Context(), uint(id), user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, toCategorizationRuleDTO(*rule))
}

// CreateRule handles creating a new categorization rule
// @Summary Create categorization rule
// @Description Create a new categorization rule for automatic transaction categorization
// @Tags categorization-rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateCategorizationRuleDTO true "Categorization rule data"
// @Success 201 {object} dto.CategorizationRuleDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /categorization-rules [post]
func (h *CategorizationRuleHandler) CreateRule(c *gin.Context) {
	user := c.GetUint("user")
	if user != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	var req dto.CreateCategorizationRuleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	rule := models.CategorizationRule{
		UserID:          user,
		Name:            req.Name,
		Type:            req.Type,
		Value:           req.Value,
		TransactionType: req.TransactionType,
		CategoryDst:     req.CategoryDst,
		Active:          req.Active == nil || *req.Active,
	}
	if err := h.Service.CreateRule(c.Request.Context(), &rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toCategorizationRuleDTO(rule))
}

// UpdateRule handles updating an existing categorization rule
// @Summary Update categorization rule
// @Description Update details of an existing categorization rule
// @Tags categorization-rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Rule ID"
// @Param request body dto.UpdateCategorizationRuleDTO true "Rule update data"
// @Success 200 {object} dto.CategorizationRuleDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /categorization-rules/{id} [put]
func (h *CategorizationRuleHandler) UpdateRule(c *gin.Context) {
	user := c.GetUint("user")
	if user != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rule, err := h.Service.GetRuleByID(c.Request.Context(), uint(id), user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var req dto.UpdateCategorizationRuleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Name != nil {
		rule.Name = *req.Name
	}
	if req.Type != nil {
		rule.Type = *req.Type
	}
	if req.Value != nil {
		rule.Value = *req.Value
	}
	if req.TransactionType != nil {
		rule.TransactionType = *req.TransactionType
	}
	if req.CategoryDst != nil {
		rule.CategoryDst = *req.CategoryDst
	}
	if req.Active != nil {
		rule.Active = *req.Active
	}
	if err := h.Service.UpdateRule(c.Request.Context(), rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toCategorizationRuleDTO(*rule))
}

// DeleteRule handles deleting a categorization rule
// @Summary Delete categorization rule
// @Description Delete a specific categorization rule
// @Tags categorization-rules
// @Produce json
// @Security BearerAuth
// @Param id path int true "Rule ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /categorization-rules/{id} [delete]
func (h *CategorizationRuleHandler) DeleteRule(c *gin.Context) {
	user := c.GetUint("user")
	if user != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Service.DeleteRule(c.Request.Context(), uint(id), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func toCategorizationRuleDTO(rule models.CategorizationRule) dto.CategorizationRuleDTO {
	return dto.CategorizationRuleDTO{
		ID:              rule.ID,
		UserID:          rule.UserID,
		Name:            rule.Name,
		Type:            rule.Type,
		Value:           rule.Value,
		TransactionType: rule.TransactionType,
		CategoryDst:     rule.CategoryDst,
		Active:          rule.Active,
		CreatedAt:       rule.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:       rule.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
