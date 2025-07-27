package models

import (
	"time"

	"gorm.io/gorm"
)

type InvitationStatus string

const (
	InvitationPending  InvitationStatus = "pending"
	InvitationAccepted InvitationStatus = "accepted"
	InvitationExpired  InvitationStatus = "expired"
	InvitationCanceled InvitationStatus = "canceled"
)

type ShareInvitation struct {
	gorm.Model
	AccountID       uint             `json:"account_id" gorm:"not null"`
	Account         Account          `json:"account" gorm:"foreignKey:AccountID"`
	OwnerUserID     uint             `json:"owner_user_id" gorm:"not null"`
	OwnerUser       User             `json:"owner_user" gorm:"foreignKey:OwnerUserID"`
	InvitedEmail    string           `json:"invited_email" gorm:"not null"`
	InvitationToken string           `json:"invitation_token" gorm:"unique;not null"`
	PermissionLevel PermissionLevel  `json:"permission_level" gorm:"type:varchar(20);default:'read';not null"`
	Status          InvitationStatus `json:"status" gorm:"type:varchar(20);default:'pending';not null"`
	ExpiresAt       time.Time        `json:"expires_at" gorm:"not null"`
	AcceptedAt      *time.Time       `json:"accepted_at,omitempty"`
}
