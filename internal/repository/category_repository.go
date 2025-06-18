package repository

import (
	"context"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	FindByUserID(ctx context.Context, userID uint) ([]models.Category, error)
	Create(ctx context.Context, category *models.Category) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) FindByUserID(ctx context.Context, userID uint) ([]models.Category, error) {
	var categories []models.Category
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}
