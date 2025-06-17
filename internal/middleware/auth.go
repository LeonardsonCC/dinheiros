package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/auth"
	"github.com/leccarvalho/dinheiros/internal/service"
)

// AuthMiddleware creates a middleware that validates JWT tokens and sets the user in the context
func AuthMiddleware(userService service.UserService, jwtManager *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip authentication for public routes
		if isPublicRoute(c.Request.URL.Path) {
			c.Next()
			return
		}

		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Check if the header has the Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized,
				gin.H{"error": "Authorization header format must be Bearer {token}"})
			return
		}

		tokenString := parts[1]
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
			return
		}

		// Validate the JWT token
		claims, err := jwtManager.VerifyToken(tokenString)
		if err != nil {
			status := http.StatusUnauthorized
			if errors.Is(err, auth.ErrTokenExpired) {
				c.AbortWithStatusJSON(status, gin.H{"error": "Token has expired"})
			} else {
				c.AbortWithStatusJSON(status, gin.H{"error": "Invalid token"})
			}
			return
		}

		// Get the user from the database
		user, err := userService.FindByID(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		// Store the user ID in the context for later use in handlers
		c.Set("user", user.ID)
		c.Next()
	}
}

// isPublicRoute checks if the given path is a public route that doesn't require authentication
func isPublicRoute(path string) bool {
	// Define public routes that don't require authentication
	publicRoutes := []string{
		"/api/auth/register",
		"/api/auth/login",
		"/api/health",
	}

	for _, route := range publicRoutes {
		if path == route {
			return true
		}
	}
	return false
}
