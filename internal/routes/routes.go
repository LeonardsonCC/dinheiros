package routes

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/LeonardsonCC/dinheiros/internal/di"
	"github.com/LeonardsonCC/dinheiros/internal/middleware"
)

func SetupRoutes(container *di.Container) *gin.Engine {
	r := gin.Default()

	// Add request logging middleware
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		log.Printf("[GIN] %s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
		return ""
	}))

	// Public routes
	api := r.Group("/api")
	{
		// Auth routes
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", container.UserHandler.Register)
			authGroup.POST("/login", container.UserHandler.Login)
			// Google OAuth login
			authGroup.POST("/google", container.UserHandler.GoogleLogin)
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

				// List extractors for all accounts (not per account)
				accounts.GET("/transactions/extractors", container.TransactionHandler.ListExtractors)

				// Single account operations
				account := accounts.Group("/:id")
				{
					account.GET("", container.AccountHandler.GetAccount)
					account.PUT("", container.AccountHandler.UpdateAccount)
					account.DELETE("", container.AccountHandler.DeleteAccount)
					account.POST("/reactivate", container.AccountHandler.ReactivateAccount)

					// Account sharing routes
					shares := account.Group("/shares")
					{
						shares.POST("", container.AccountShareHandler.CreateShareInvitation)
						shares.GET("", container.AccountShareHandler.GetAccountShares)
						shares.DELETE("/:userId", container.AccountShareHandler.RevokeShare)
					}

					// Share invitations routes
					invitations := account.Group("/invitations")
					{
						invitations.GET("", container.AccountShareHandler.GetPendingInvitations)
						invitations.DELETE("/:invitationId", container.AccountShareHandler.CancelInvitation)
					}

					// Transaction routes for a specific account
					transactions := account.Group("/transactions")
					{
						transactions.GET("", container.TransactionHandler.GetTransactions)
						transactions.POST("", container.TransactionHandler.CreateTransaction)
						transactions.GET("/:transactionId", container.TransactionHandler.GetTransaction)
						transactions.PUT("/:transactionId", container.TransactionHandler.UpdateTransaction)
						transactions.DELETE("/:transactionId", container.TransactionHandler.DeleteTransaction)
						transactions.POST("/import", container.TransactionHandler.ImportTransactions)
						transactions.POST("/bulk", container.TransactionHandler.BulkCreateTransactions)
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
				categories.PUT(":id", container.CategoryHandler.UpdateCategory)
				categories.DELETE(":id", container.CategoryHandler.DeleteCategory)
			}

			// User profile routes
			user := protected.Group("/users/me")
			{
				user.GET("", container.UserHandler.GetCurrentUser)
				user.PATCH("", container.UserHandler.UpdateName)
				user.PATCH("/password", container.UserHandler.UpdatePassword)
			}

			// Statistics routes
			statistics := protected.Group("/statistics")
			{
				statistics.GET("/transactions-per-day", container.TransactionHandler.GetStatisticsTransactionsPerDay)
				statistics.GET("/amount-by-month", container.TransactionHandler.GetStatisticsAmountByMonth)
				statistics.GET("/amount-by-account", container.TransactionHandler.GetStatisticsAmountByAccount)
				statistics.GET("/amount-by-category", container.TransactionHandler.GetStatisticsAmountByCategory)
				statistics.GET("/amount-spent-by-day", container.TransactionHandler.GetStatisticsAmountSpentByDay)
				statistics.GET("/amount-spent-and-gained-by-day", container.TransactionHandler.GetStatisticsAmountSpentAndGainedByDay)
			}

			// Categorization rule routes
			categorizationRules := protected.Group("/categorization-rules")
			{
				categorizationRules.GET("", container.CategorizationRuleHandler.ListRules)
				categorizationRules.POST("", container.CategorizationRuleHandler.CreateRule)
				categorizationRules.GET(":id", container.CategorizationRuleHandler.GetRule)
				categorizationRules.PUT(":id", container.CategorizationRuleHandler.UpdateRule)
				categorizationRules.DELETE(":id", container.CategorizationRuleHandler.DeleteRule)
			}

			// Global sharing routes
			shares := protected.Group("/shares")
			{
				shares.POST("/accept", container.AccountShareHandler.AcceptInvitation)
				shares.GET("/accounts", container.AccountShareHandler.GetSharedAccounts)
			}
		}
	}

	// Static file server - should be the last route
	r.NoRoute(func(c *gin.Context) {
		c.File("frontend/dist/index.html")
	})
	r.Static("/assets", "frontend/dist/assets")

	return r
}
