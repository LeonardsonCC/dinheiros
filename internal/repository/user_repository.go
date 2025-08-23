package repository

import (
	"errors"
	"log"

	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

// Common repository errors
var (
	ErrNotFound = errors.New("record not found")
)

// UserRepository defines the interface for user data access operations
type UserRepository interface {
	// Create saves a new user to the database
	Create(user *models.User) error
	// FindByID finds a user by their ID
	FindByID(id uint) (*models.User, error)
	// FindByEmail finds a user by their email
	FindByEmail(email string) (*models.User, error)
	// Update updates an existing user
	Update(user *models.User) error
	// Delete removes a user from the database
	Delete(id uint) error
}

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new instance of UserRepository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create implements UserRepository
func (r *userRepository) Create(user *models.User) error {
	log.Printf("[UserRepository] Create: Creating user: %+v", user)
	log.Printf("[UserRepository] Create: User ID before creation: %d", user.ID)

	if err := r.db.Create(user).Error; err != nil {
		log.Printf("[UserRepository] Create: Error creating user: %v", err)
		return err
	}

	log.Printf("[UserRepository] Create: User created successfully")
	log.Printf("[UserRepository] Create: User ID after creation: %d", user.ID)
	log.Printf("[UserRepository] Create: Final user object: %+v", user)

	return nil
}

// FindByID implements UserRepository
func (r *userRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindByEmail implements UserRepository
func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update implements UserRepository
func (r *userRepository) Update(user *models.User) error {
	if err := r.db.Save(user).Error; err != nil {
		return err
	}
	return nil
}

// Delete implements UserRepository
func (r *userRepository) Delete(id uint) error {
	if err := r.db.Delete(&models.User{}, id).Error; err != nil {
		return err
	}
	return nil
}
