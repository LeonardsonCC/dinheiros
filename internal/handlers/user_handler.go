package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/internal/dto"
	"github.com/LeonardsonCC/dinheiros/internal/service"
)

// UserHandler handles HTTP requests related to user operations
type UserHandler struct {
	userService service.UserService
}

// NewUserHandler creates a new instance of UserHandler
func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// Register handles user registration
// @Summary Register a new user
// @Description Register a new user with the provided information
// @Tags users
// @Accept json
// @Produce json
// @Param input body dto.RegisterRequest true "User registration data"
// @Success 201 {object} dto.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create user using the service
	token, user, err := h.userService.Register(req.Name, req.Email, req.Password)
	if err != nil {
		status := http.StatusInternalServerError
		var errMsg string

		switch errMsg = err.Error(); errMsg {
		case "email already registered":
			status = http.StatusConflict
		case "error hashing password", "error creating user", "error generating token":
			errMsg = "Error processing registration"
		}

		c.JSON(status, gin.H{"error": errMsg})
		return
	}

	// Return success response with JWT token
	response := dto.ToAuthResponse("User registered successfully", token, user)
	c.JSON(http.StatusCreated, response)
}

// Login handles user login
// @Summary Login a user
// @Description Authenticate a user and return a token
// @Tags users
// @Accept json
// @Produce json
// @Param input body dto.LoginRequest true "User login credentials"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Authenticate user using the service
	token, user, err := h.userService.Login(req.Email, req.Password)
	if err != nil {
		status := http.StatusInternalServerError
		errMsg := "An error occurred"

		switch err.Error() {
		case "invalid credentials":
			status = http.StatusUnauthorized
			errMsg = "Invalid credentials"
		case "error generating token":
			errMsg = "Error generating authentication token"
		}

		c.JSON(status, gin.H{"error": errMsg})
		return
	}

	// Return success response with JWT token
	response := dto.ToAuthResponse("Login successful", token, user)
	c.JSON(http.StatusOK, response)
}

// GetCurrentUser returns the current authenticated user's information
// @Summary Get current user
// @Description Get the currently authenticated user's information
// @Tags users
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} dto.UserResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/me [get]
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	user := c.GetUint("user")
	if user == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user from service
	userObj, err := h.userService.FindByID(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving user"})
		return
	}

	// Convert to response DTO
	response := dto.ToUserResponse(userObj)
	c.JSON(http.StatusOK, response)
}

// UpdateName handles updating the current user's name
// @Summary Update user's name
// @Description Update the current user's name
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param input body dto.UpdateNameRequest true "Name update data"
// @Success 200 {object} dto.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/me [patch]
func (h *UserHandler) UpdateName(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var req dto.UpdateNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Update user name
	user, err := h.userService.UpdateName(userID.(uint), req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update name"})
		return
	}

	// Convert to response DTO
	response := dto.ToUserResponse(user)
	c.JSON(http.StatusOK, response)
}

// UpdatePassword handles updating the current user's password
// @Summary Update user's password
// @Description Update the current user's password
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param input body dto.UpdatePasswordRequest true "Password update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/me/password [patch]
func (h *UserHandler) UpdatePassword(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var req dto.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Update password
	err := h.userService.UpdatePassword(userID.(uint), req.CurrentPassword, req.NewPassword)
	if err != nil {
		errMsg := "Failed to update password"
		if err.Error() == "current password is incorrect" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errMsg})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// GoogleLogin handles Google OAuth login
// @Summary Login a user with Google
// @Description Authenticate a user with Google OAuth and return a token
// @Tags users
// @Accept json
// @Produce json
// @Param input body dto.GoogleLoginRequest true "Google login credentials"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/google [post]
func (h *UserHandler) GoogleLogin(c *gin.Context) {
	log.Printf("[UserHandler] GoogleLogin: Starting Google login")

	var req dto.GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[UserHandler] GoogleLogin: JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Google credential"})
		return
	}

	log.Printf("[UserHandler] GoogleLogin: Verifying Google token")

	// Verify Google token
	googleUser, err := service.VerifyGoogleToken(req.Credential)
	if err != nil {
		log.Printf("[UserHandler] GoogleLogin: Google token verification failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
		return
	}

	log.Printf("[UserHandler] GoogleLogin: Google token verified for user: %s (%s)", googleUser.Name, googleUser.Email)

	// Find or create user by email
	token, user, err := h.userService.LoginOrRegisterGoogle(googleUser)
	if err != nil {
		log.Printf("[UserHandler] GoogleLogin: LoginOrRegisterGoogle failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[UserHandler] GoogleLogin: Google login successful for user ID: %d", user.ID)

	response := dto.ToAuthResponse("Google login successful", token, user)
	c.JSON(http.StatusOK, response)
}
