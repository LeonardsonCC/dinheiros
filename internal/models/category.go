package models

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	Name         string         `json:"name" gorm:"unique;not null"`
	Description  string         `json:"description"`
	UserID       uint           `json:"user_id" gorm:"not null"`
	User         User           `json:"-" gorm:"foreignKey:UserID"`
	Transactions []*Transaction `json:"transactions,omitempty" gorm:"many2many:transaction_categories;"`
}

type TransactionCategory struct {
	TransactionID uint `gorm:"primaryKey"`
	CategoryID    uint `gorm:"primaryKey"`
}
