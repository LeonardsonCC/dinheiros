package handlers

import (
	"net/http"
	"strconv"

	"log"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/service"
)

type AccountShareHandler struct {
	shareService *service.AccountShareService
}

func NewAccountShareHandler(shareService *service.AccountShareService) *AccountShareHandler {
	return &AccountShareHandler{
		shareService: shareService,
	}
}

// CreateShareInvitation handles creating a new share invitation
// @Summary Create share invitation
// @Description Create a new invitation to share an account with another user
// @Tags account-sharing
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Param request body dto.CreateShareInvitationRequest true "Share invitation data"
// @Success 201 {object} dto.ShareInvitationResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id}/shares [post]
func (h *AccountShareHandler) CreateShareInvitation(c *gin.Context) {
	userID := c.GetUint("user")
	accountIDStr := c.Param("id")
	accountID, err := strconv.ParseUint(accountIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	var req dto.CreateShareInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default permission level if not provided
	permissionLevel := models.PermissionRead
	if req.PermissionLevel != "" {
		permissionLevel = models.PermissionLevel(req.PermissionLevel)
	}

	invitation, err := h.shareService.CreateShareInvitation(uint(accountID), userID, req.InvitedEmail, permissionLevel)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := dto.ShareInvitationResponse{
		ID:              invitation.ID,
		AccountID:       invitation.AccountID,
		AccountName:     invitation.Account.Name,
		InvitedEmail:    invitation.InvitedEmail,
		PermissionLevel: string(invitation.PermissionLevel),
		Status:          string(invitation.Status),
		ExpiresAt:       invitation.ExpiresAt,
		CreatedAt:       invitation.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetAccountShares handles fetching all shares for an account
// @Summary Get account shares
// @Description Get all active shares for a specific account
// @Tags account-sharing
// @Produce json
// @Security BearerAuth
// @Param id path int true "Account ID"
// @Success 200 {array} dto.AccountShareResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/{id}/shares [get]
func (h *AccountShareHandler) GetAccountShares(c *gin.Context) {
	userID := c.GetUint("user")
	accountIDStr := c.Param("id")
	accountID, err := strconv.ParseUint(accountIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Check if user can access this account
	canAccess, isOwner, err := h.shareService.CanUserAccessAccount(uint(accountID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !canAccess || !isOwner {
		log.Printf("[WARN] Access denied for user %d to account %d", userID, accountID)
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	shares, err := h.shareService.GetAccountShares(uint(accountID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []dto.AccountShareResponse
	for _, share := range shares {
		response = append(response, dto.AccountShareResponse{
			ID:              share.ID,
			AccountID:       share.AccountID,
			AccountName:     share.Account.Name,
			SharedUserEmail: share.SharedUser.Email,
			SharedUserName:  share.SharedUser.Name,
			PermissionLevel: string(share.PermissionLevel),
			SharedAt:        share.SharedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// DELETE /api/accounts/:id/shares/:userId
func (h *AccountShareHandler) RevokeShare(c *gin.Context) {
	userID := c.GetUint("user")
	accountIDStr := c.Param("id")
	sharedUserIDStr := c.Param("userId")

	accountID, err := strconv.ParseUint(accountIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	sharedUserID, err := strconv.ParseUint(sharedUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = h.shareService.RevokeShare(uint(accountID), uint(sharedUserID), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Share revoked successfully"})
}

// GET /api/accounts/:id/invitations
func (h *AccountShareHandler) GetPendingInvitations(c *gin.Context) {
	userID := c.GetUint("user")
	accountIDStr := c.Param("id")
	accountID, err := strconv.ParseUint(accountIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Check if user can access this account
	canAccess, isOwner, err := h.shareService.CanUserAccessAccount(uint(accountID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !canAccess || !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	invitations, err := h.shareService.GetPendingInvitations(uint(accountID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []dto.ShareInvitationResponse
	for _, invitation := range invitations {
		response = append(response, dto.ShareInvitationResponse{
			ID:              invitation.ID,
			AccountID:       invitation.AccountID,
			AccountName:     invitation.Account.Name,
			InvitedEmail:    invitation.InvitedEmail,
			PermissionLevel: string(invitation.PermissionLevel),
			Status:          string(invitation.Status),
			ExpiresAt:       invitation.ExpiresAt,
			CreatedAt:       invitation.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// DELETE /api/accounts/:id/invitations/:invitationId
func (h *AccountShareHandler) CancelInvitation(c *gin.Context) {
	userID := c.GetUint("user")
	invitationIDStr := c.Param("invitationId")

	invitationID, err := strconv.ParseUint(invitationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID"})
		return
	}

	err = h.shareService.CancelInvitation(uint(invitationID), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation canceled successfully"})
}

// AcceptInvitation handles accepting a share invitation
// @Summary Accept share invitation
// @Description Accept an invitation to access a shared account
// @Tags account-sharing
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.AcceptInvitationRequest true "Invitation token"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /shares/accept [post]
func (h *AccountShareHandler) AcceptInvitation(c *gin.Context) {
	userID := c.GetUint("user")

	var req dto.AcceptInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	share, err := h.shareService.AcceptInvitation(req.Token, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Invitation accepted successfully",
		"account_id": share.AccountID,
	})
}

// GetSharedAccounts handles fetching accounts shared with the user
// @Summary Get shared accounts
// @Description Get all accounts that have been shared with the authenticated user
// @Tags account-sharing
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.SharedAccountResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /shares/accounts [get]
func (h *AccountShareHandler) GetSharedAccounts(c *gin.Context) {
	userID := c.GetUint("user")

	shares, err := h.shareService.GetSharedAccounts(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []dto.SharedAccountResponse
	for _, share := range shares {
		response = append(response, dto.SharedAccountResponse{
			ID:              share.Account.ID,
			Name:            share.Account.Name,
			Type:            string(share.Account.Type),
			Balance:         share.Account.Balance,
			Color:           share.Account.Color,
			OwnerName:       share.OwnerUser.Name,
			OwnerEmail:      share.OwnerUser.Email,
			PermissionLevel: string(share.PermissionLevel),
			SharedAt:        share.SharedAt,
			IsShared:        true,
		})
	}

	c.JSON(http.StatusOK, response)
}
