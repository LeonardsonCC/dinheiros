package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/config"
	"github.com/LeonardsonCC/dinheiros/internal/database"
	"github.com/LeonardsonCC/dinheiros/internal/di"
	"github.com/LeonardsonCC/dinheiros/internal/routes"
)

var router *gin.Engine

func init() {
	// Set gin to release mode for production
	gin.SetMode(gin.ReleaseMode)
	
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	if err := database.InitDB(cfg); err != nil {
		log.Printf("Failed to initialize database: %v", err)
		return
	}

	// Setup dependency injection container
	container, err := di.NewContainer(database.DB)
	if err != nil {
		log.Printf("Failed to initialize dependency injection container: %v", err)
		return
	}

	// Setup routes (serverless version)
	router = routes.SetupServerlessRoutes(container)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if router == nil {
		http.Error(w, "Server not initialized", http.StatusInternalServerError)
		return
	}
	router.ServeHTTP(w, r)
}