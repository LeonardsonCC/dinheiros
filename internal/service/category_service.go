package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type CategoryService interface {
	ListCategories(ctx context.Context, userID uint) ([]models.Category, error)
	CreateCategory(ctx context.Context, category *models.Category) error
	GetCategoryByID(ctx context.Context, id string, userID uint) (*models.Category, error)
	UpdateCategory(ctx context.Context, category *models.Category) error
	DeleteCategory(ctx context.Context, id string, userID uint) error
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

func (s *categoryService) GetCategoryByID(ctx context.Context, id string, userID uint) (*models.Category, error) {
	var category models.Category
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&category).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (s *categoryService) UpdateCategory(ctx context.Context, category *models.Category) error {
	return s.db.WithContext(ctx).Save(category).Error
}

func (s *categoryService) DeleteCategory(ctx context.Context, id string, userID uint) error {
	return s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.Category{}).Error
}
