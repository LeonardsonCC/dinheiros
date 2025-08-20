package config

import (
	"os"
	"strings"
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

// getSecret returns the value from Docker secret file, environment variable, or fallback
func getSecret(key, fallback string) string {
	// Try Docker secret first (mounted at /run/secrets/<secret_name>)
	secretPath := "/run/secrets/" + strings.ToLower(key)
	if data, err := os.ReadFile(secretPath); err == nil {
		return strings.TrimSpace(string(data))
	}

	// Fall back to environment variable
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
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
		DBHost: getSecret("DB_HOST", "localhost"),
		DBPort: getSecret("DB_PORT", "5432"),
		DBUser: getSecret("DB_USER", "postgres"),
		DBPass: getSecret("DB_PASS", "password"),
		DBName: getSecret("DB_NAME", "dinheiros"),
		Port:   getEnv("PORT", "8080"),
	}
}
