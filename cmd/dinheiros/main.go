package main

import (
	"log"

	"github.com/leccarvalho/dinheiros/config"
	"github.com/leccarvalho/dinheiros/internal/database"
	"github.com/leccarvalho/dinheiros/internal/di"
	"github.com/leccarvalho/dinheiros/internal/routes"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	err := database.InitDB(cfg.DBPath)
	if err != nil {
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
