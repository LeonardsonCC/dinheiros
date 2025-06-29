package service

import (
	"context"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/repository"
)

type CategorizationRuleService interface {
	ListRules(ctx context.Context, userID uint) ([]models.CategorizationRule, error)
	GetRuleByID(ctx context.Context, id uint, userID uint) (*models.CategorizationRule, error)
	CreateRule(ctx context.Context, rule *models.CategorizationRule) error
	UpdateRule(ctx context.Context, rule *models.CategorizationRule) error
	DeleteRule(ctx context.Context, id uint, userID uint) error
}

type categorizationRuleService struct {
	repo repository.CategorizationRuleRepository
}

func NewCategorizationRuleService(repo repository.CategorizationRuleRepository) CategorizationRuleService {
	return &categorizationRuleService{repo: repo}
}

func (s *categorizationRuleService) ListRules(ctx context.Context, userID uint) ([]models.CategorizationRule, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *categorizationRuleService) GetRuleByID(ctx context.Context, id uint, userID uint) (*models.CategorizationRule, error) {
	return s.repo.FindByIDAndUserID(ctx, id, userID)
}

func (s *categorizationRuleService) CreateRule(ctx context.Context, rule *models.CategorizationRule) error {
	return s.repo.Create(ctx, rule)
}

func (s *categorizationRuleService) UpdateRule(ctx context.Context, rule *models.CategorizationRule) error {
	return s.repo.Update(ctx, rule)
}

func (s *categorizationRuleService) DeleteRule(ctx context.Context, id uint, userID uint) error {
	return s.repo.Delete(ctx, id, userID)
}
