package dto

import (
	"time"

	"github.com/leccarvalho/dinheiros/internal/models"
)

type CreateTransactionRequest struct {
	Date        string                 `json:"date" binding:"required"`
	Amount      float64                `json:"amount" binding:"required,gt=0"`
	Type        models.TransactionType `json:"type" binding:"required,oneof=income expense transfer"`
	Description string                 `json:"description"`
	CategoryIDs []uint                 `json:"category_ids"`
	ToAccountID *uint                  `json:"to_account_id,omitempty"`
}

type CategoryResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type TransactionResponse struct {
	ID          uint               `json:"id"`
	Date        time.Time          `json:"date"`
	Amount      float64            `json:"amount"`
	Type        string             `json:"type"`
	Description string             `json:"description"`
	Categories  []CategoryResponse `json:"categories"`
	AccountID   uint               `json:"account_id"`
	ToAccountID *uint              `json:"to_account_id,omitempty"`
}

func ToTransactionResponse(transaction *models.Transaction) TransactionResponse {
	categories := make([]CategoryResponse, len(transaction.Categories))
	for i, cat := range transaction.Categories {
		categories[i] = CategoryResponse{
			ID:   cat.ID,
			Name: cat.Name,
		}
	}

	return TransactionResponse{
		ID:          transaction.ID,
		Date:        transaction.Date,
		Amount:      transaction.Amount,
		Type:        string(transaction.Type),
		Description: transaction.Description,
		Categories:  categories,
		AccountID:   transaction.AccountID,
		ToAccountID: transaction.ToAccountID,
	}
}

func ToTransactionResponseList(transactions []models.Transaction) []TransactionResponse {
	responses := make([]TransactionResponse, len(transactions))
	for i, t := range transactions {
		transaction := t // Create a new variable to avoid implicit memory aliasing
		responses[i] = ToTransactionResponse(&transaction)
	}
	return responses
}
