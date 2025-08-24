package models

import (
	"time"

	"gorm.io/gorm"
)

type TransactionType string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
	TransactionTypeInitial TransactionType = "initial"
)

type AttachmentType string

const (
	AttachmentTypeOutboundTransfer AttachmentType = "outbound_transfer"
	AttachmentTypeInboundTransfer  AttachmentType = "inbound_transfer"
)

type Transaction struct {
	gorm.Model
	Date        time.Time       `json:"date" gorm:"not null"`
	Amount      float64         `json:"amount" gorm:"type:decimal(10,2);not null"`
	Type        TransactionType `json:"type" gorm:"type:varchar(20);not null"`
	Description string          `json:"description"`
	AccountID   uint            `json:"account_id" gorm:"not null"`
	Account     Account         `json:"-" gorm:"foreignKey:AccountID"`

	AttachedTransactionID *uint           `json:"attached_transaction_id,omitempty"`
	AttachedTransaction   *Transaction    `json:"attached_transaction,omitempty" gorm:"foreignKey:AttachedTransactionID"`
	AttachmentType        *AttachmentType `json:"attachment_type,omitempty" gorm:"type:varchar(20)"`
	Categories            []*Category     `json:"categories,omitempty" gorm:"many2many:transaction_categories;"`
}

type SearchTransactionParams struct {
	Types       []TransactionType
	AccountIDs  []uint
	CategoryIDs []uint
	Description string
	MinAmount   float64
	MaxAmount   float64
	StartDate   *time.Time
	EndDate     *time.Time
	Page        int
	PageSize    int
}
