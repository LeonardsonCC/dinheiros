package repository

import (
	"context"
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupCategoryTestDB(t *testing.T) (*gorm.DB, *models.User) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{}, &models.Account{}, &models.Category{}, &models.Transaction{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	// Create a test user
	user := &models.User{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "hashedpassword",
	}
	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	return db, user
}

func TestCategoryRepository_Create(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	category := &models.Category{
		Name:        "Food",
		Description: "Food and dining expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	err := repo.Create(ctx, category)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if category.ID == 0 {
		t.Error("Expected category ID to be set after creation")
	}
}

func TestCategoryRepository_Create_DuplicateName(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	category1 := &models.Category{
		Name:        "Food",
		Description: "Food and dining expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	category2 := &models.Category{
		Name:        "Food", // Same name and type for same user
		Description: "Another food category",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	err := repo.Create(ctx, category1)
	if err != nil {
		t.Errorf("Expected no error for first category, got %v", err)
	}

	err = repo.Create(ctx, category2)
	if err == nil {
		t.Error("Expected error for duplicate category name/type/user, got nil")
	}
}

func TestCategoryRepository_Create_SameNameDifferentType(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	category1 := &models.Category{
		Name:        "Food",
		Description: "Food expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	category2 := &models.Category{
		Name:        "Food", // Same name but different type
		Description: "Food income (maybe selling food)",
		Type:        models.TransactionTypeIncome,
		UserID:      user.ID,
	}

	err := repo.Create(ctx, category1)
	if err != nil {
		t.Errorf("Expected no error for first category, got %v", err)
	}

	err = repo.Create(ctx, category2)
	if err != nil {
		t.Errorf("Expected no error for same name different type, got %v", err)
	}
}

func TestCategoryRepository_Create_SameNameDifferentUser(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	// Create another user
	user2 := &models.User{
		Name:     "Test User 2",
		Email:    "test2@example.com",
		Password: "hashedpassword",
	}
	err := db.Create(user2).Error
	if err != nil {
		t.Fatalf("Failed to create second user: %v", err)
	}

	category1 := &models.Category{
		Name:        "Food",
		Description: "Food expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	category2 := &models.Category{
		Name:        "Food", // Same name and type but different user
		Description: "Food expenses for user 2",
		Type:        models.TransactionTypeExpense,
		UserID:      user2.ID,
	}

	err = repo.Create(ctx, category1)
	if err != nil {
		t.Errorf("Expected no error for first category, got %v", err)
	}

	err = repo.Create(ctx, category2)
	if err != nil {
		t.Errorf("Expected no error for same name different user, got %v", err)
	}
}

func TestCategoryRepository_FindByUserID(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	// Create multiple categories
	categories := []*models.Category{
		{
			Name:        "Food",
			Description: "Food and dining expenses",
			Type:        models.TransactionTypeExpense,
			UserID:      user.ID,
		},
		{
			Name:        "Transportation",
			Description: "Transportation expenses",
			Type:        models.TransactionTypeExpense,
			UserID:      user.ID,
		},
		{
			Name:        "Salary",
			Description: "Monthly salary",
			Type:        models.TransactionTypeIncome,
			UserID:      user.ID,
		},
	}

	for _, category := range categories {
		err := repo.Create(ctx, category)
		if err != nil {
			t.Fatalf("Failed to create category: %v", err)
		}
	}

	// Find categories by user ID
	foundCategories, err := repo.FindByUserID(ctx, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundCategories) != 3 {
		t.Errorf("Expected 3 categories, got %d", len(foundCategories))
	}

	// Verify categories are correct
	categoryNames := make(map[string]bool)
	for _, cat := range foundCategories {
		categoryNames[cat.Name] = true
		if cat.UserID != user.ID {
			t.Errorf("Expected user ID %d, got %d", user.ID, cat.UserID)
		}
	}

	expectedNames := []string{"Food", "Transportation", "Salary"}
	for _, name := range expectedNames {
		if !categoryNames[name] {
			t.Errorf("Expected to find category %s", name)
		}
	}
}

func TestCategoryRepository_FindByUserID_EmptyResult(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	// Find categories for user with no categories
	foundCategories, err := repo.FindByUserID(ctx, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundCategories) != 0 {
		t.Errorf("Expected 0 categories, got %d", len(foundCategories))
	}
}

func TestCategoryRepository_FindByUserID_OnlyUserCategories(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)
	ctx := context.Background()

	// Create another user
	user2 := &models.User{
		Name:     "Test User 2",
		Email:    "test2@example.com",
		Password: "hashedpassword",
	}
	err := db.Create(user2).Error
	if err != nil {
		t.Fatalf("Failed to create second user: %v", err)
	}

	// Create categories for both users
	category1 := &models.Category{
		Name:        "Food",
		Description: "Food expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	category2 := &models.Category{
		Name:        "Transportation",
		Description: "Transportation expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user2.ID,
	}

	err = repo.Create(ctx, category1)
	if err != nil {
		t.Fatalf("Failed to create category for user 1: %v", err)
	}

	err = repo.Create(ctx, category2)
	if err != nil {
		t.Fatalf("Failed to create category for user 2: %v", err)
	}

	// Find categories for user 1
	foundCategories, err := repo.FindByUserID(ctx, user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundCategories) != 1 {
		t.Errorf("Expected 1 category for user 1, got %d", len(foundCategories))
	}

	if foundCategories[0].Name != "Food" {
		t.Errorf("Expected category name 'Food', got %s", foundCategories[0].Name)
	}

	// Find categories for user 2
	foundCategories, err = repo.FindByUserID(ctx, user2.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(foundCategories) != 1 {
		t.Errorf("Expected 1 category for user 2, got %d", len(foundCategories))
	}

	if foundCategories[0].Name != "Transportation" {
		t.Errorf("Expected category name 'Transportation', got %s", foundCategories[0].Name)
	}
}

func TestCategoryRepository_Create_WithContext(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	// Test with cancelled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	category := &models.Category{
		Name:        "Food",
		Description: "Food and dining expenses",
		Type:        models.TransactionTypeExpense,
		UserID:      user.ID,
	}

	err := repo.Create(ctx, category)
	if err == nil {
		t.Error("Expected error with cancelled context, got nil")
	}
}

func TestCategoryRepository_FindByUserID_WithContext(t *testing.T) {
	db, user := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	// Test with cancelled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	_, err := repo.FindByUserID(ctx, user.ID)
	if err == nil {
		t.Error("Expected error with cancelled context, got nil")
	}
}
