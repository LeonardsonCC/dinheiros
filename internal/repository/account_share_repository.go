package repository

import (
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/gorm"
)

type AccountShareRepository struct {
	db *gorm.DB
}

func NewAccountShareRepository(db *gorm.DB) *AccountShareRepository {
	return &AccountShareRepository{db: db}
}

// Share management
func (r *AccountShareRepository) CreateShare(share *models.AccountShare) error {
	return r.db.Create(share).Error
}

func (r *AccountShareRepository) GetSharesByAccountID(accountID uint) ([]models.AccountShare, error) {
	var shares []models.AccountShare
	err := r.db.Preload("SharedUser").Preload("Account").Where("account_id = ?", accountID).Find(&shares).Error
	return shares, err
}

func (r *AccountShareRepository) GetSharesByUserID(userID uint) ([]models.AccountShare, error) {
	var shares []models.AccountShare
	err := r.db.Preload("OwnerUser").Preload("Account").Where("shared_user_id = ?", userID).Find(&shares).Error
	return shares, err
}

func (r *AccountShareRepository) DeleteShare(accountID, sharedUserID uint) error {
	return r.db.Where("account_id = ? AND shared_user_id = ?", accountID, sharedUserID).Delete(&models.AccountShare{}).Error
}

func (r *AccountShareRepository) HasAccess(accountID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.AccountShare{}).Where("account_id = ? AND shared_user_id = ?", accountID, userID).Count(&count).Error
	return count > 0, err
}

// Invitation management
func (r *AccountShareRepository) CreateInvitation(invitation *models.ShareInvitation) error {
	return r.db.Create(invitation).Error
}

func (r *AccountShareRepository) GetInvitationByToken(token string) (*models.ShareInvitation, error) {
	var invitation models.ShareInvitation
	err := r.db.Preload("Account").Preload("OwnerUser").Where("invitation_token = ?", token).First(&invitation).Error
	if err != nil {
		return nil, err
	}
	return &invitation, nil
}

func (r *AccountShareRepository) GetInvitationsByAccountID(accountID uint) ([]models.ShareInvitation, error) {
	var invitations []models.ShareInvitation
	err := r.db.Preload("Account").Where("account_id = ? AND status = ?", accountID, models.InvitationPending).Find(&invitations).Error
	return invitations, err
}

func (r *AccountShareRepository) UpdateInvitationStatus(id uint, status models.InvitationStatus) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if status == models.InvitationAccepted {
		updates["accepted_at"] = time.Now()
	}
	return r.db.Model(&models.ShareInvitation{}).Where("id = ?", id).Updates(updates).Error
}

func (r *AccountShareRepository) DeleteInvitation(id uint) error {
	return r.db.Delete(&models.ShareInvitation{}, id).Error
}

func (r *AccountShareRepository) CleanupExpiredInvitations() error {
	return r.db.Model(&models.ShareInvitation{}).
		Where("expires_at < ? AND status = ?", time.Now(), models.InvitationPending).
		Update("status", models.InvitationExpired).Error
}

func (r *AccountShareRepository) GetInvitationByID(id uint) (*models.ShareInvitation, error) {
	var invitation models.ShareInvitation
	err := r.db.Preload("Account").Preload("OwnerUser").First(&invitation, id).Error
	if err != nil {
		return nil, err
	}
	return &invitation, nil
}
