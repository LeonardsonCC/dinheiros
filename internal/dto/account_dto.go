package dto

import "github.com/LeonardsonCC/dinheiros/internal/models"

type CreateAccountRequest struct {
	Name           string             `json:"name" binding:"required"`
	Type           models.AccountType `json:"type" binding:"required,oneof=checking savings credit_card cash"`
	InitialBalance float64            `json:"initial_balance" binding:""`
	Color          string             `json:"color" binding:"omitempty,hexcolor"`
}

type AccountResponse struct {
	ID             uint               `json:"id"`
	Name           string             `json:"name"`
	Type           models.AccountType `json:"type"`
	InitialBalance float64            `json:"initial_balance"`
	Balance        float64            `json:"balance"`
	Color          string             `json:"color"`
}

func ToAccountResponse(account *models.Account) AccountResponse {
	return AccountResponse{
		ID:             account.ID,
		Name:           account.Name,
		Type:           account.Type,
		InitialBalance: account.InitialBalance,
		Balance:        account.Balance,
		Color:          account.Color,
	}
}

func ToAccountResponseList(accounts []models.Account) []AccountResponse {
	responses := make([]AccountResponse, len(accounts))
	for i, account := range accounts {
		responses[i] = ToAccountResponse(&account)
	}
	return responses
}
