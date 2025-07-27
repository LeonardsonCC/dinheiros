package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/repository"
)

type AccountShareService struct {
	shareRepo   *repository.AccountShareRepository
	userRepo    repository.UserRepository
	accountRepo repository.AccountRepository
}

func NewAccountShareService(shareRepo *repository.AccountShareRepository, userRepo repository.UserRepository, accountRepo repository.AccountRepository) *AccountShareService {
	return &AccountShareService{
		shareRepo:   shareRepo,
		userRepo:    userRepo,
		accountRepo: accountRepo,
	}
}

// Core sharing functionality
func (s *AccountShareService) CreateShareInvitation(accountID, ownerUserID uint, invitedEmail string, permissionLevel models.PermissionLevel) (*models.ShareInvitation, error) {
	// Verify account ownership
	account, err := s.accountRepo.FindByID(accountID, ownerUserID)
	if err != nil {
		return nil, fmt.Errorf("account not found: %w", err)
	}
	if account.UserID != ownerUserID {
		return nil, errors.New("unauthorized: you can only share your own accounts")
	}

	// Check if user is trying to share with themselves
	owner, err := s.userRepo.FindByID(ownerUserID)
	if err != nil {
		return nil, fmt.Errorf("owner not found: %w", err)
	}
	if owner.Email == invitedEmail {
		return nil, errors.New("cannot share account with yourself")
	}

	// Check if already shared with this user
	invitedUser, err := s.userRepo.FindByEmail(invitedEmail)
	if err == nil {
		// User exists, check if already shared
		hasAccess, err := s.shareRepo.HasAccess(accountID, invitedUser.ID)
		if err != nil {
			return nil, fmt.Errorf("error checking existing access: %w", err)
		}
		if hasAccess {
			return nil, errors.New("account is already shared with this user")
		}
	}

	// Generate invitation token
	token, err := s.generateInvitationToken()
	if err != nil {
		return nil, fmt.Errorf("error generating invitation token: %w", err)
	}

	// Create invitation
	invitation := &models.ShareInvitation{
		AccountID:       accountID,
		OwnerUserID:     ownerUserID,
		InvitedEmail:    invitedEmail,
		InvitationToken: token,
		PermissionLevel: permissionLevel,
		Status:          models.InvitationPending,
		ExpiresAt:       time.Now().Add(7 * 24 * time.Hour), // 7 days
	}

	err = s.shareRepo.CreateInvitation(invitation)
	if err != nil {
		return nil, fmt.Errorf("error creating invitation: %w", err)
	}

	return invitation, nil
}

func (s *AccountShareService) AcceptInvitation(token string, userID uint) (*models.AccountShare, error) {
	// Get invitation
	invitation, err := s.shareRepo.GetInvitationByToken(token)
	if err != nil {
		return nil, fmt.Errorf("invitation not found: %w", err)
	}

	// Check if invitation is valid
	if invitation.Status != models.InvitationPending {
		return nil, errors.New("invitation is no longer valid")
	}
	if time.Now().After(invitation.ExpiresAt) {
		return nil, errors.New("invitation has expired")
	}

	// Get user and verify email
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	if user.Email != invitation.InvitedEmail {
		return nil, errors.New("invitation email does not match your account")
	}

	// Check if already shared
	hasAccess, err := s.shareRepo.HasAccess(invitation.AccountID, userID)
	if err != nil {
		return nil, fmt.Errorf("error checking existing access: %w", err)
	}
	if hasAccess {
		return nil, errors.New("you already have access to this account")
	}

	// Create share
	share := &models.AccountShare{
		AccountID:       invitation.AccountID,
		OwnerUserID:     invitation.OwnerUserID,
		SharedUserID:    userID,
		PermissionLevel: invitation.PermissionLevel,
		SharedAt:        time.Now(),
	}

	err = s.shareRepo.CreateShare(share)
	if err != nil {
		return nil, fmt.Errorf("error creating share: %w", err)
	}

	// Update invitation status
	err = s.shareRepo.UpdateInvitationStatus(invitation.ID, models.InvitationAccepted)
	if err != nil {
		return nil, fmt.Errorf("error updating invitation status: %w", err)
	}

	return share, nil
}

func (s *AccountShareService) GetAccountShares(accountID uint) ([]models.AccountShare, error) {
	return s.shareRepo.GetSharesByAccountID(accountID)
}

func (s *AccountShareService) GetSharedAccounts(userID uint) ([]models.AccountShare, error) {
	return s.shareRepo.GetSharesByUserID(userID)
}

func (s *AccountShareService) RevokeShare(accountID, sharedUserID, ownerUserID uint) error {
	// Verify account ownership
	_, err := s.accountRepo.FindByID(accountID, ownerUserID)
	if err != nil {
		return fmt.Errorf("account not found: %w", err)
	}

	return s.shareRepo.DeleteShare(accountID, sharedUserID)
}

func (s *AccountShareService) GetPendingInvitations(accountID uint) ([]models.ShareInvitation, error) {
	return s.shareRepo.GetInvitationsByAccountID(accountID)
}

func (s *AccountShareService) CancelInvitation(invitationID, ownerUserID uint) error {
	// Get invitation to verify ownership
	invitation, err := s.shareRepo.GetInvitationByID(invitationID)
	if err != nil {
		return fmt.Errorf("invitation not found: %w", err)
	}
	if invitation.OwnerUserID != ownerUserID {
		return errors.New("unauthorized: you can only cancel your own invitations")
	}

	return s.shareRepo.UpdateInvitationStatus(invitationID, models.InvitationCanceled)
}

// Access control
func (s *AccountShareService) CanUserAccessAccount(accountID, userID uint) (bool, bool, error) {
	// Check if user owns the account
	account, err := s.accountRepo.FindByIDWithoutUserCheck(accountID)
	if err != nil {
		return false, false, fmt.Errorf("account not found: %w", err)
	}
	if account.UserID == userID {
		return true, true, nil // canAccess=true, isOwner=true
	}

	// Check if user has shared access
	hasAccess, err := s.shareRepo.HasAccess(accountID, userID)
	if err != nil {
		return false, false, fmt.Errorf("error checking shared access: %w", err)
	}

	return hasAccess, false, nil // canAccess=hasAccess, isOwner=false
}

func (s *AccountShareService) generateInvitationToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *AccountShareService) CleanupExpiredInvitations() error {
	return s.shareRepo.CleanupExpiredInvitations()
}
