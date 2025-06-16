package repository

import (
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{}, &models.Account{}, &models.Category{}, &models.Transaction{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

func TestUserRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}

	err := repo.Create(user)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if user.ID == 0 {
		t.Error("Expected user ID to be set after creation")
	}
}

func TestUserRepository_Create_DuplicateEmail(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	user1 := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}

	user2 := &models.User{
		Name:     "Jane Doe",
		Email:    "john@example.com", // Same email
		Password: "hashedpassword2",
	}

	err := repo.Create(user1)
	if err != nil {
		t.Errorf("Expected no error for first user, got %v", err)
	}

	err = repo.Create(user2)
	if err == nil {
		t.Error("Expected error for duplicate email, got nil")
	}
}

func TestUserRepository_FindByID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}
	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Find the user
	foundUser, err := repo.FindByID(user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if foundUser.ID != user.ID {
		t.Errorf("Expected user ID %d, got %d", user.ID, foundUser.ID)
	}

	if foundUser.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, foundUser.Email)
	}
}

func TestUserRepository_FindByID_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	_, err := repo.FindByID(999)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound, got %v", err)
	}
}

func TestUserRepository_FindByEmail(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}
	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Find the user by email
	foundUser, err := repo.FindByEmail(user.Email)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if foundUser.ID != user.ID {
		t.Errorf("Expected user ID %d, got %d", user.ID, foundUser.ID)
	}

	if foundUser.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, foundUser.Email)
	}
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	_, err := repo.FindByEmail("nonexistent@example.com")
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound, got %v", err)
	}
}

func TestUserRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}
	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Update the user
	user.Name = "John Smith"
	user.Email = "johnsmith@example.com"

	err = repo.Update(user)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the update
	updatedUser, err := repo.FindByID(user.ID)
	if err != nil {
		t.Fatalf("Failed to find updated user: %v", err)
	}

	if updatedUser.Name != "John Smith" {
		t.Errorf("Expected name 'John Smith', got %s", updatedUser.Name)
	}

	if updatedUser.Email != "johnsmith@example.com" {
		t.Errorf("Expected email 'johnsmith@example.com', got %s", updatedUser.Email)
	}
}

func TestUserRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "hashedpassword",
	}
	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Delete the user
	err = repo.Delete(user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify the user is deleted
	_, err = repo.FindByID(user.ID)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound after deletion, got %v", err)
	}
}

func TestUserRepository_Delete_NonExistent(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)

	// Try to delete a non-existent user
	err := repo.Delete(999)
	if err != nil {
		t.Errorf("Expected no error for deleting non-existent user, got %v", err)
	}
}
