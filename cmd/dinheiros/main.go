package main

import (
	"log"

	"github.com/leccarvalho/dinheiros/config"
	"github.com/leccarvalho/dinheiros/internal/database"
	"github.com/leccarvalho/dinheiros/internal/routes"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	if err := database.InitDB(cfg.DBPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Setup routes
	r := routes.SetupRoutes()

	// Start server
	serverAddr := ":" + cfg.Port
	log.Printf("Server starting on http://localhost%s\n", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
