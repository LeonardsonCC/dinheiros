package config

import (
	"os"
)

// Config holds all database and server configuration
// DBType: "sqlite3" or "postgres"
type Config struct {
	DBType string
	DBPath string
	DBHost string
	DBPort string
	DBUser string
	DBPass string
	DBName string
	Port   string
}

// getEnv returns the value of the environment variable or fallback if not set
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func LoadConfig() *Config {
	return &Config{
		DBType: getEnv("DB_TYPE", "sqlite3"),
		DBPath: getEnv("DB_PATH", "./dinheiros.db"),
		DBHost: getEnv("DB_HOST", "localhost"),
		DBPort: getEnv("DB_PORT", "5432"),
		DBUser: getEnv("DB_USER", "postgres"),
		DBPass: getEnv("DB_PASS", "password"),
		DBName: getEnv("DB_NAME", "dinheiros"),
		Port:   getEnv("PORT", "8080"),
	}
}
