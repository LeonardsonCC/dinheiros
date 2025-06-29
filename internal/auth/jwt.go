package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
	"strconv"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

var (
	// ErrInvalidToken is returned when the token is invalid
	ErrInvalidToken = errors.New("invalid token")
	// ErrTokenExpired is returned when the token has expired
	ErrTokenExpired = errors.New("token has expired")
)

// JWTManager handles JWT token generation and validation
type JWTManager struct {
	secretKey     []byte
	tokenDuration time.Duration
}

// UserClaims represents the claims included in the JWT token
type UserClaims struct {
	jwt.RegisteredClaims
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
}

// NewJWTManager creates a new JWTManager with the given secret key and token duration
func NewJWTManager(secretKey string, tokenDuration time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:     []byte(secretKey),
		tokenDuration: tokenDuration,
	}
}

// GenerateToken generates a new JWT token for the given user
func (m *JWTManager) GenerateToken(user *models.User) (string, error) {
	claims := UserClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.tokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "dinheiros-api",
			Subject:   strconv.FormatUint(uint64(user.ID), 10),
		},
		UserID: user.ID,
		Email:  user.Email,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secretKey)
}

// VerifyToken verifies the given JWT token and returns the user claims if valid
func (m *JWTManager) VerifyToken(tokenString string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&UserClaims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, ErrInvalidToken
			}
			return m.secretKey, nil
		},
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GenerateRandomKey generates a random 32-byte key for JWT signing
func GenerateRandomKey() (string, error) {
	key := make([]byte, 32)
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(key), nil
}

// GetJWTConfig returns the JWT configuration from environment variables
func GetJWTConfig() (string, time.Duration, error) {
	secretKey := os.Getenv("JWT_SECRET_KEY")
	if secretKey == "" {
		return "", 0, errors.New("JWT_SECRET_KEY environment variable not set")
	}

	tokenDurationStr := os.Getenv("JWT_TOKEN_DURATION_HOURS")
	if tokenDurationStr == "" {
		tokenDurationStr = "24" // Default to 24 hours
	}

	tokenDurationHours, err := strconv.Atoi(tokenDurationStr)
	if err != nil {
		return "", 0, err
	}

	return secretKey, time.Duration(tokenDurationHours) * time.Hour, nil
}
