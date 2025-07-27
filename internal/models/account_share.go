package models

import (
	"time"

	"gorm.io/gorm"
)

type PermissionLevel string

const (
	PermissionRead PermissionLevel = "read"
	// Future: PermissionWrite PermissionLevel = "write"
)

type AccountShare struct {
	gorm.Model
	AccountID       uint            `json:"account_id" gorm:"not null"`
	Account         Account         `json:"account" gorm:"foreignKey:AccountID"`
	OwnerUserID     uint            `json:"owner_user_id" gorm:"not null"`
	OwnerUser       User            `json:"owner_user" gorm:"foreignKey:OwnerUserID"`
	SharedUserID    uint            `json:"shared_user_id" gorm:"not null"`
	SharedUser      User            `json:"shared_user" gorm:"foreignKey:SharedUserID"`
	PermissionLevel PermissionLevel `json:"permission_level" gorm:"type:varchar(20);default:'read';not null"`
	SharedAt        time.Time       `json:"shared_at" gorm:"not null"`
}
