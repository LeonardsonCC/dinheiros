package models

import (
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

type User struct {
    gorm.Model
    Name     string    `json:"name" gorm:"not null"`
    Email    string    `json:"email" gorm:"unique;not null"`
    Password string    `json:"-" gorm:"not null"`
    Accounts []Account `json:"accounts,omitempty" gorm:"foreignKey:UserID"`
}

func (u *User) HashPassword() error {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    u.Password = string(hashedPassword)
    return nil
}

func (u *User) CheckPassword(password string) error {
    return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}
