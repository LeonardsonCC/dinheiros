package dto

import "github.com/leccarvalho/dinheiros/internal/models"

type CreateAccountRequest struct {
	Name           string             `json:"name" binding:"required"`
	Type           models.AccountType `json:"type" binding:"required,oneof=checking savings credit cash"`
	Currency       string             `json:"currency" binding:"required,oneof=BRL USD EUR"`
	InitialBalance float64            `json:"initial_balance" binding:"required"`
}

type AccountResponse struct {
	ID             uint                `json:"id"`
	Name           string              `json:"name"`
	Type           models.AccountType  `json:"type"`
	Currency       string              `json:"currency"`
	InitialBalance float64             `json:"initial_balance"`
	Balance        float64             `json:"balance"`
}

func ToAccountResponse(account *models.Account) AccountResponse {
	return AccountResponse{
		ID:             account.ID,
		Name:           account.Name,
		Type:           account.Type,
		Currency:       account.Currency,
		InitialBalance: account.InitialBalance,
		Balance:        account.Balance,
	}
}

func ToAccountResponseList(accounts []models.Account) []AccountResponse {
	responses := make([]AccountResponse, len(accounts))
	for i, account := range accounts {
		responses[i] = ToAccountResponse(&account)
	}
	return responses
}
