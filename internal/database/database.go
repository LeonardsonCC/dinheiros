package database

import (
    "fmt"
    "github.com/leccarvalho/dinheiros/internal/models"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(dbPath string) error {
    var err error
    DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return fmt.Errorf("failed to connect to database: %v", err)
    }

    // Auto migrate the schema
    err = DB.AutoMigrate(
        &models.User{},
        &models.Account{},
        &models.Transaction{},
    )
    if err != nil {
        return fmt.Errorf("failed to migrate database: %v", err)
    }

    return nil
}
