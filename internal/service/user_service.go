package service

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"

	"github.com/LeonardsonCC/dinheiros/internal/auth"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	repo "github.com/LeonardsonCC/dinheiros/internal/repository"
)

// UserService defines the interface for user-related operations
type UserService interface {
	// Register creates a new user with the provided information and returns a JWT token
	Register(name, email, password string) (string, *models.User, error)
	// Login authenticates a user with the provided credentials and returns a JWT token
	Login(email, password string) (string, *models.User, error)
	// FindByID finds a user by their ID
	FindByID(id uint) (*models.User, error)
	// UpdateName updates the user's name
	UpdateName(id uint, name string) (*models.User, error)
	// UpdatePassword updates the user's password after verifying the current password
	UpdatePassword(id uint, currentPassword, newPassword string) error
	// LoginOrRegisterGoogle logs in or registers a user using Google info
	LoginOrRegisterGoogle(googleUser *GoogleUser) (string, *models.User, error)
}

type userService struct {
	userRepo   repo.UserRepository
	jwtManager *auth.JWTManager
}

// UpdateName updates the user's name
func (s *userService) UpdateName(id uint, name string) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	user.Name = name
	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("error updating user name")
	}

	return user, nil
}

// UpdatePassword updates the user's password after verifying the current password
func (s *userService) UpdatePassword(id uint, currentPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Verify current password
	if err := user.CheckPassword(currentPassword); err != nil {
		return errors.New("current password is incorrect")
	}

	// Update to new password
	user.Password = newPassword
	if err := user.HashPassword(); err != nil {
		return errors.New("error hashing new password")
	}

	if err := s.userRepo.Update(user); err != nil {
		return errors.New("error updating password")
	}

	return nil
}

// NewUserService creates a new instance of UserService
func NewUserService(userRepo repo.UserRepository, jwtManager *auth.JWTManager) UserService {
	return &userService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

// Register implements the UserService interface
func (s *userService) Register(name, email, password string) (string, *models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(email)
	if err != nil && !errors.Is(err, repo.ErrNotFound) {
		return "", nil, err
	}
	if existingUser != nil {
		return "", nil, errors.New("email already registered")
	}

	// Create new user
	user := &models.User{
		Name:     name,
		Email:    email,
		Password: password, // Will be hashed in the model
	}

	// Hash password
	if err := user.HashPassword(); err != nil {
		return "", nil, errors.New("error hashing password")
	}

	// Save user to database
	if err := s.userRepo.Create(user); err != nil {
		return "", nil, errors.New("error creating user")
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user)
	if err != nil {
		return "", nil, errors.New("error generating token")
	}

	return token, user, nil
}

// Login implements the UserService interface
func (s *userService) Login(email, password string) (string, *models.User, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return "", nil, errors.New("invalid credentials")
		}
		return "", nil, err
	}

	// Check password
	if err := user.CheckPassword(password); err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user)
	if err != nil {
		return "", nil, errors.New("error generating token")
	}

	return token, user, nil
}

// FindByID implements the UserService interface
func (s *userService) FindByID(id uint) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GoogleUser represents the minimal user info from Google
// You can expand this struct as needed
// (sub = user id, email, name, picture, etc)
type GoogleUser struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// VerifyGoogleToken verifies the Google ID token and returns user info
func VerifyGoogleToken(idToken string) (*GoogleUser, error) {
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()
	if resp.StatusCode != 200 {
		return nil, err
	}
	var gu GoogleUser
	if err := json.NewDecoder(resp.Body).Decode(&gu); err != nil {
		return nil, err
	}
	if gu.Email == "" {
		return nil, err
	}
	return &gu, nil
}

// LoginOrRegisterGoogle logs in or registers a user using Google info
func (s *userService) LoginOrRegisterGoogle(googleUser *GoogleUser) (string, *models.User, error) {
	// Try to find user by email
	user, err := s.userRepo.FindByEmail(googleUser.Email)
	if err != nil && err.Error() != "record not found" {
		return "", nil, err
	}
	if user == nil {
		// Register new user with Google info, set a random password
		user = &models.User{
			Name:     googleUser.Name,
			Email:    googleUser.Email,
			Password: generateRandomPassword(), // Not used, but required by schema
		}
		if err := s.userRepo.Create(user); err != nil {
			return "", nil, err
		}
	}
	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

// generateRandomPassword returns a random string (for Google users, password is not used)
func generateRandomPassword() string {
	return uuid.NewString()
}
