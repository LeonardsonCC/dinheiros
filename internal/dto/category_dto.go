package dto

import "github.com/leccarvalho/dinheiros/internal/models"

// CategoryDTO represents the category data sent in responses
type CategoryDTO struct {
	ID          uint                `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Type        models.TransactionType `json:"type"`
}

// ToCategoryDTO converts a models.Category to CategoryDTO
func ToCategoryDTO(category models.Category) CategoryDTO {
	return CategoryDTO{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		Type:        category.Type,
	}
}

// ToCategoryDTOs converts a slice of models.Category to a slice of CategoryDTO
func ToCategoryDTOs(categories []models.Category) []CategoryDTO {
	dtos := make([]CategoryDTO, len(categories))
	for i, category := range categories {
		dtos[i] = ToCategoryDTO(category)
	}
	return dtos
}

// CreateCategoryRequest represents the request body for creating a category
type CreateCategoryRequest struct {
	Name        string              `json:"name" binding:"required"`
	Description string              `json:"description"`
	Type        models.TransactionType `json:"type" binding:"required,oneof=income expense transfer"`
}

// ToModel converts CreateCategoryRequest to models.Category
func (r *CreateCategoryRequest) ToModel(userID uint) models.Category {
	return models.Category{
		Name:        r.Name,
		Description: r.Description,
		Type:        r.Type,
		UserID:      userID,
	}
}
