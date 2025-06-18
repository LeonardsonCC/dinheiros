package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/di"
	"github.com/leccarvalho/dinheiros/internal/middleware"
)

func SetupRoutes(container *di.Container) *gin.Engine {
	r := gin.Default()

	// Public routes
	api := r.Group("/api")
	{
		// Auth routes
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", container.UserHandler.Register)
			authGroup.POST("/login", container.UserHandler.Login)
		}

		// Protected routes
		protected := api.Group("")
		// Create auth middleware with required dependencies
		authMiddleware := middleware.AuthMiddleware(container.UserService, container.JWTManager)
		protected.Use(authMiddleware)
		{
			// Dashboard summary
			protected.GET("/summary", container.TransactionHandler.GetDashboardSummary)

			// Account routes
			accounts := protected.Group("/accounts")
			{
				accounts.GET("", container.AccountHandler.GetAccounts)
				accounts.POST("", container.AccountHandler.CreateAccount)

				// Single account operations
				account := accounts.Group("/:id")
				{
					account.GET("", container.AccountHandler.GetAccount)
					account.DELETE("", container.AccountHandler.DeleteAccount)

					// Transaction routes for a specific account
					transactions := account.Group("/transactions")
					{
						transactions.GET("", container.TransactionHandler.GetTransactions)
						transactions.POST("", container.TransactionHandler.CreateTransaction)
						transactions.GET("/:transactionId", container.TransactionHandler.GetTransaction)
						transactions.PUT("/:transactionId", container.TransactionHandler.UpdateTransaction)
						transactions.DELETE("/:transactionId", container.TransactionHandler.DeleteTransaction)
					}
				}
			}

			transactions := protected.Group("/transactions")
			{
				transactions.GET("", container.TransactionHandler.ListTransactions)
			}

			// Category routes
			categories := protected.Group("/categories")
			{
				categories.GET("", container.CategoryHandler.ListCategories)
				categories.POST("", container.CategoryHandler.CreateCategory)
			}
		}
	}

	return r
}
