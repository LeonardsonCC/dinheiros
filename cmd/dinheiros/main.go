package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/LeonardsonCC/dinheiros/config"
	"github.com/LeonardsonCC/dinheiros/internal/database"
	"github.com/LeonardsonCC/dinheiros/internal/di"
	"github.com/LeonardsonCC/dinheiros/internal/routes"
)

// @title Dinheiros API
// @version 1.0
// @description Personal finance management API
// @host localhost:8080
// @BasePath /api
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token

func main() {
	_ = godotenv.Load()
	cfg := config.LoadConfig()

	// Initialize database
	if err := database.InitDB(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Setup dependency injection container
	container, err := di.NewContainer(database.DB)
	if err != nil {
		log.Fatalf("Failed to initialize dependency injection container: %v", err)
	}

	// Setup routes
	r := routes.SetupRoutes(container)

	// Start server
	serverAddr := ":" + cfg.Port
	log.Printf("Server starting on http://localhost%s\n", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
