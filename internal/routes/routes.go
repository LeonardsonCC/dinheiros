package routes

import (
    "github.com/gin-gonic/gin"
    "github.com/leccarvalho/dinheiros/internal/handlers"
    "github.com/leccarvalho/dinheiros/internal/middleware"
)

func SetupRoutes() *gin.Engine {
    r := gin.Default()

    // Create handlers
    userHandler := handlers.NewUserHandler()
    accountHandler := handlers.NewAccountHandler()
    transactionHandler := handlers.NewTransactionHandler()
    categoryHandler := handlers.NewCategoryHandler()

    // Auth routes
    auth := r.Group("/api/auth")
    {
        auth.POST("/register", userHandler.Register)
        auth.POST("/login", userHandler.Login)
    }

    // Protected routes
    api := r.Group("/api")
    api.Use(middleware.AuthMiddleware())
    {
        // Dashboard summary
        api.GET("/summary", transactionHandler.GetDashboardSummary)
        
        // Account routes
        accounts := api.Group("/accounts")
        {
            accounts.GET("", accountHandler.GetAccounts)
            accounts.POST("", accountHandler.CreateAccount)
            
            // Single account operations
            account := accounts.Group("/:id")
            {
                account.GET("", accountHandler.GetAccount)
                account.DELETE("", accountHandler.DeleteAccount)

                // Transaction routes for a specific account
                transactions := account.Group("/transactions")
                {
                    transactions.GET("", transactionHandler.GetTransactions)
                    transactions.POST("", transactionHandler.CreateTransaction)
                    transactions.GET("/:transactionId", transactionHandler.GetTransaction)
                    transactions.DELETE("/:transactionId", transactionHandler.DeleteTransaction)
                }
            }

            // Category routes
            categories := api.Group("/categories")
            {
                categories.GET("", categoryHandler.ListCategories)
                categories.POST("", categoryHandler.CreateCategory)
            }
        }
    }

    return r
}
