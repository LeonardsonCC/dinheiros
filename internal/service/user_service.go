package service

import (
	"errors"

	"github.com/leccarvalho/dinheiros/internal/auth"
	"github.com/leccarvalho/dinheiros/internal/models"
	repo "github.com/leccarvalho/dinheiros/internal/repository"
)

// UserService defines the interface for user-related operations
type UserService interface {
	// Register creates a new user with the provided information and returns a JWT token
	Register(name, email, password string) (string, *models.User, error)
	// Login authenticates a user with the provided credentials and returns a JWT token
	Login(email, password string) (string, *models.User, error)
	// FindByID finds a user by their ID
	FindByID(id uint) (*models.User, error)
}

type userService struct {
	userRepo   repo.UserRepository
	jwtManager *auth.JWTManager
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
