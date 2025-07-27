package dto

import "time"

type CreateShareInvitationRequest struct {
	InvitedEmail    string `json:"invited_email" binding:"required,email"`
	PermissionLevel string `json:"permission_level" binding:"omitempty,oneof=read"`
}

type ShareInvitationResponse struct {
	ID              uint      `json:"id"`
	AccountID       uint      `json:"account_id"`
	AccountName     string    `json:"account_name"`
	InvitedEmail    string    `json:"invited_email"`
	PermissionLevel string    `json:"permission_level"`
	Status          string    `json:"status"`
	ExpiresAt       time.Time `json:"expires_at"`
	CreatedAt       time.Time `json:"created_at"`
}

type AccountShareResponse struct {
	ID              uint      `json:"id"`
	AccountID       uint      `json:"account_id"`
	AccountName     string    `json:"account_name"`
	SharedUserEmail string    `json:"shared_user_email"`
	SharedUserName  string    `json:"shared_user_name"`
	PermissionLevel string    `json:"permission_level"`
	SharedAt        time.Time `json:"shared_at"`
}

type AcceptInvitationRequest struct {
	Token string `json:"token" binding:"required"`
}

type SharedAccountResponse struct {
	ID              uint      `json:"id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"`
	Balance         float64   `json:"balance"`
	Color           string    `json:"color"`
	OwnerName       string    `json:"owner_name"`
	OwnerEmail      string    `json:"owner_email"`
	PermissionLevel string    `json:"permission_level"`
	SharedAt        time.Time `json:"shared_at"`
	IsShared        bool      `json:"is_shared"`
}
