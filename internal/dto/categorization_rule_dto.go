package dto

type CategorizationRuleDTO struct {
	ID              uint   `json:"id"`
	UserID          uint   `json:"user_id"`
	Name            string `json:"name"`
	Type            string `json:"type"`
	Value           string `json:"value"`
	TransactionType string `json:"transaction_type"`
	CategoryDst     uint   `json:"category_dst"`
	Active          bool   `json:"active"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type CreateCategorizationRuleDTO struct {
	Name            string `json:"name"`
	Type            string `json:"type"`
	Value           string `json:"value"`
	TransactionType string `json:"transaction_type"`
	CategoryDst     uint   `json:"category_dst"`
	Active          *bool  `json:"active"`
}

type UpdateCategorizationRuleDTO struct {
	Name            *string `json:"name"`
	Type            *string `json:"type"`
	Value           *string `json:"value"`
	TransactionType *string `json:"transaction_type"`
	CategoryDst     *uint   `json:"category_dst"`
	Active          *bool   `json:"active"`
}
