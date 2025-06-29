package handlers

import (
	"net/http"
	"strconv"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/service"
	"github.com/gin-gonic/gin"
)

type CategorizationRuleHandler struct {
	Service service.CategorizationRuleService
}

func NewCategorizationRuleHandler(s service.CategorizationRuleService) *CategorizationRuleHandler {
	return &CategorizationRuleHandler{Service: s}
}

func (h *CategorizationRuleHandler) ListRules(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := user.(uint)
	rules, err := h.Service.ListRules(c.Request.Context(), userID)
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

func (h *CategorizationRuleHandler) GetRule(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := user.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rule, err := h.Service.GetRuleByID(c.Request.Context(), uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, toCategorizationRuleDTO(*rule))
}

func (h *CategorizationRuleHandler) CreateRule(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := user.(uint)
	var req dto.CreateCategorizationRuleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	rule := models.CategorizationRule{
		UserID:      userID,
		Name:        req.Name,
		Type:        req.Type,
		Value:       req.Value,
		CategoryDst: req.CategoryDst,
		Active:      req.Active == nil || *req.Active,
	}
	if err := h.Service.CreateRule(c.Request.Context(), &rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toCategorizationRuleDTO(rule))
}

func (h *CategorizationRuleHandler) UpdateRule(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := user.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rule, err := h.Service.GetRuleByID(c.Request.Context(), uint(id), userID)
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

func (h *CategorizationRuleHandler) DeleteRule(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := user.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Service.DeleteRule(c.Request.Context(), uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func toCategorizationRuleDTO(rule models.CategorizationRule) dto.CategorizationRuleDTO {
	return dto.CategorizationRuleDTO{
		ID:          rule.ID,
		UserID:      rule.UserID,
		Name:        rule.Name,
		Type:        rule.Type,
		Value:       rule.Value,
		CategoryDst: rule.CategoryDst,
		Active:      rule.Active,
		CreatedAt:   rule.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   rule.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
