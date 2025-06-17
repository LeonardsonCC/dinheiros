package service

import (
	"context"
	"errors"

	"github.com/leccarvalho/dinheiros/internal/models"
	"gorm.io/gorm"
)

type CategoryService interface {
	ListCategories(ctx context.Context, userID uint) ([]models.Category, error)
	CreateCategory(ctx context.Context, category *models.Category) error
}

type categoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) CategoryService {
	return &categoryService{db: db}
}

func (s *categoryService) ListCategories(ctx context.Context, userID uint) ([]models.Category, error) {
	var categories []models.Category
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

func (s *categoryService) CreateCategory(ctx context.Context, category *models.Category) error {
	// Check if category with same name and type already exists for this user
	var count int64
	if err := s.db.WithContext(ctx).
		Model(&models.Category{}).
		Where("user_id = ? AND name = ? AND type = ?", category.UserID, category.Name, category.Type).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("category with this name and type already exists")
	}

	return s.db.WithContext(ctx).Create(category).Error
}
