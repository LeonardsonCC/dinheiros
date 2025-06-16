package models

import (
    "time"
    "gorm.io/gorm"
)

type TransactionType string

const (
    TransactionTypeIncome  TransactionType = "income"
    TransactionTypeExpense TransactionType = "expense"
    TransactionTypeTransfer TransactionType = "transfer"
)

type Transaction struct {
    gorm.Model
    Date          time.Time       `json:"date" gorm:"not null"`
    Amount        float64         `json:"amount" gorm:"type:decimal(10,2);not null"`
    Type          TransactionType `json:"type" gorm:"type:varchar(20);not null"`
    Description   string          `json:"description"`
    AccountID     uint            `json:"account_id" gorm:"not null"`
    Account       Account         `json:"-" gorm:"foreignKey:AccountID"`
    ToAccountID   *uint           `json:"to_account_id,omitempty"`
    ToAccount     *Account        `json:"-" gorm:"foreignKey:ToAccountID"`
    Categories    []*Category     `json:"categories,omitempty" gorm:"many2many:transaction_categories;"`
}
