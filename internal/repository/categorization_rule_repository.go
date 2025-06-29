package repository

import (
	"context"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"gorm.io/gorm"
)

type CategorizationRuleRepository interface {
    FindByUserID(ctx context.Context, userID uint) ([]models.CategorizationRule, error)
    FindByIDAndUserID(ctx context.Context, id uint, userID uint) (*models.CategorizationRule, error)
    Create(ctx context.Context, rule *models.CategorizationRule) error
    Update(ctx context.Context, rule *models.CategorizationRule) error
    Delete(ctx context.Context, id uint, userID uint) error
}

type categorizationRuleRepository struct {
    db *gorm.DB
}

func NewCategorizationRuleRepository(db *gorm.DB) CategorizationRuleRepository {
    return &categorizationRuleRepository{db: db}
}

func (r *categorizationRuleRepository) FindByUserID(ctx context.Context, userID uint) ([]models.CategorizationRule, error) {
    var rules []models.CategorizationRule
    err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&rules).Error
    return rules, err
}

func (r *categorizationRuleRepository) FindByIDAndUserID(ctx context.Context, id uint, userID uint) (*models.CategorizationRule, error) {
    var rule models.CategorizationRule
    err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&rule).Error
    if err != nil {
        return nil, err
    }
    return &rule, nil
}

func (r *categorizationRuleRepository) Create(ctx context.Context, rule *models.CategorizationRule) error {
    return r.db.WithContext(ctx).Create(rule).Error
}

func (r *categorizationRuleRepository) Update(ctx context.Context, rule *models.CategorizationRule) error {
    return r.db.WithContext(ctx).Save(rule).Error
}

func (r *categorizationRuleRepository) Delete(ctx context.Context, id uint, userID uint) error {
    return r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.CategorizationRule{}).Error
} 