package models

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	Name         string          `json:"name" gorm:"uniqueIndex:idx_user_name_type;not null"`
	Description  string          `json:"description"`
	Type         TransactionType `json:"type" gorm:"type:varchar(20);not null;uniqueIndex:idx_user_name_type"`
	UserID       uint            `json:"user_id" gorm:"not null;uniqueIndex:idx_user_name_type"`
	User         User            `json:"-" gorm:"foreignKey:UserID"`
	Transactions []*Transaction  `json:"transactions,omitempty" gorm:"many2many:transaction_categories;"`
}

type TransactionCategory struct {
	TransactionID uint `gorm:"primaryKey"`
	CategoryID    uint `gorm:"primaryKey"`
}
