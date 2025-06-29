package database

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/LeonardsonCC/dinheiros/config"
)

var DB *gorm.DB

// InitDB initializes the database connection based on config
func InitDB(cfg *config.Config) error {
	var err error
	var dialector gorm.Dialector

	switch cfg.DBType {
	case "postgres":
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, cfg.DBPort)
		dialector = postgres.Open(dsn)
	case "sqlite3":
		fallthrough
	default:
		// dialector = sqlite.Open(cfg.DBPath)
	}

	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Auto migrate the schema
	// err = DB.AutoMigrate(
	// 	&models.User{},
	// 	&models.Account{},
	// 	&models.Transaction{},
	// 	&models.Category{},
	// 	&models.CategorizationRule{},
	// )
	// if err != nil {
	// 	return fmt.Errorf("failed to migrate database: %v", err)
	// }

	return nil
}
