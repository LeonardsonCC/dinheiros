package middleware

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/leccarvalho/dinheiros/internal/database"
    "github.com/leccarvalho/dinheiros/internal/models"
    "gorm.io/gorm"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get the Authorization header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
            return
        }

        // Check if the header has the Bearer prefix
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
            return
        }

        token := parts[1]
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
            return
        }

        // In a real application, you would validate the JWT token here
        // For this example, we'll just check if the token exists in the database
        var user models.User
        result := database.DB.Where("email = ?", token).First(&user)
        if result.Error != nil {
            if result.Error == gorm.ErrRecordNotFound {
                c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
                return
            }
            c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Error authenticating user"})
            return
        }

        // Store the user in the context for later use in handlers
        c.Set("user", &user)
        c.Next()
    }
}
