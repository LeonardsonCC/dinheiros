package models

import "gorm.io/gorm"

type AccountType string

const (
	AccountTypeChecking AccountType = "checking"
	AccountTypeSavings  AccountType = "savings"
	AccountTypeCredit   AccountType = "credit_card"
	AccountTypeCash     AccountType = "cash"
)

type Account struct {
	gorm.Model
	Name           string        `json:"name" gorm:"not null"`
	Type           AccountType   `json:"type" gorm:"type:varchar(20);not null"`
	InitialBalance float64       `json:"initial_balance" gorm:"type:decimal(10,2);default:0.00"`
	Balance        float64       `json:"balance" gorm:"type:decimal(10,2);default:0.00"`
	UserID         uint          `json:"user_id" gorm:"not null"`
	User           User          `json:"-" gorm:"foreignKey:UserID"`
	Transactions   []Transaction `json:"transactions,omitempty" gorm:"foreignKey:AccountID"`
}
