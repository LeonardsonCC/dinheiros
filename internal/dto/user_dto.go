package dto

import "github.com/LeonardsonCC/dinheiros/internal/models"

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UserResponse represents the user data in API responses
type UserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// AuthResponse represents the authentication response with token and user data
type AuthResponse struct {
	Message string       `json:"message"`
	Token   string       `json:"token"`
	User    UserResponse `json:"user"`
}

// ToUserResponse converts a user model to a UserResponse DTO
func ToUserResponse(user *models.User) *UserResponse {
	return &UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}
}

// ToAuthResponse creates an authentication response with token and user data
func ToAuthResponse(message, token string, user *models.User) *AuthResponse {
	return &AuthResponse{
		Message: message,
		Token:   token,
		User:    *ToUserResponse(user),
	}
}

// UpdateNameRequest represents the request body for updating a user's name
type UpdateNameRequest struct {
	Name string `json:"name" binding:"required,min=2"`
}

// UpdatePasswordRequest represents the request body for updating a user's password
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required,min=6"`
	NewPassword     string `json:"newPassword" binding:"required,min=6,nefield=CurrentPassword"`
}
