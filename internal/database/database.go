package database

import (
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/LeonardsonCC/dinheiros/config"
)

var DB *gorm.DB

// InitDB initializes the database connection with connection pooling
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
		dialector = sqlite.Open(cfg.DBPath)
	}

	DB, err = gorm.Open(dialector, &gorm.Config{
		// Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	// Configure connection pool settings
	configureConnectionPool(sqlDB)

	// Auto migrate the schema
	// err = DB.AutoMigrate(
	// 	&models.User{},
	// 	&models.Account{},
	// 	&models.Transaction{},
	// 	&models.Category{},
	// 	&models.CategorizationRule{},
	// 	&models.AccountShare{},
	// 	&models.ShareInvitation{},
	// )
	// if err != nil {
	// 	return fmt.Errorf("failed to migrate database: %v", err)
	// }

	return nil
}

// configureConnectionPool sets up the database connection pool parameters
func configureConnectionPool(sqlDB *sql.DB) {
	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool
	sqlDB.SetMaxIdleConns(10)

	// SetMaxOpenConns sets the maximum number of open connections to the database
	sqlDB.SetMaxOpenConns(100)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused
	sqlDB.SetConnMaxLifetime(time.Hour)

	// SetConnMaxIdleTime sets the maximum amount of time a connection may be idle
	sqlDB.SetConnMaxIdleTime(time.Minute * 30)
}
