package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type CategoryRepository interface {
	FindByUserID(ctx context.Context, userID uint) ([]models.Category, error)
	Create(ctx context.Context, category *models.Category) error
	FindByIDAndUserID(ctx context.Context, id string, userID uint) (*models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id string, userID uint) error
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

func (r *categoryRepository) FindByIDAndUserID(ctx context.Context, id string, userID uint) (*models.Category, error) {
	var category models.Category
	if err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&category).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id string, userID uint) error {
	return r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.Category{}).Error
}
