package di

import (
	"os"
	"time"

	"gorm.io/gorm"
	"github.com/leccarvalho/dinheiros/internal/auth"
	"github.com/leccarvalho/dinheiros/internal/handlers"
	"github.com/leccarvalho/dinheiros/internal/repository"
	"github.com/leccarvalho/dinheiros/internal/service"
)

type Container struct {
	// Repositories
	AccountRepository     repository.AccountRepository
	TransactionRepository repository.TransactionRepository
	UserRepository       repository.UserRepository
	CategoryRepository   repository.CategoryRepository

	// Services
	AccountService     service.AccountService
	TransactionService service.TransactionService
	UserService        service.UserService
	CategoryService    service.CategoryService

	// Auth
	JWTManager *auth.JWTManager

	// Handlers
	AccountHandler     *handlers.AccountHandler
	TransactionHandler *handlers.TransactionHandler
	UserHandler        *handlers.UserHandler
	CategoryHandler    *handlers.CategoryHandler
}

func NewContainer(db *gorm.DB) (*Container, error) {
	// Initialize JWT manager
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		// In a production environment, you should always have a proper JWT secret
		// For development, we'll generate a random one if not set
		var err error
		jwtSecret, err = auth.GenerateRandomKey()
		if err != nil {
			return nil, err
		}
	}

	// Set token duration (24 hours by default)
	tokenDuration := 24 * time.Hour
	if durationStr := os.Getenv("JWT_TOKEN_DURATION"); durationStr != "" {
		duration, err := time.ParseDuration(durationStr)
		if err == nil {
			tokenDuration = duration
		}
	}

	jwtManager := auth.NewJWTManager(jwtSecret, tokenDuration)

	// Initialize repositories
	accountRepo := repository.NewAccountRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	userRepo := repository.NewUserRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)

	// Initialize services
	accountService := service.NewAccountService(accountRepo)
	transactionService := service.NewTransactionService(transactionRepo, accountRepo)
	userService := service.NewUserService(userRepo, jwtManager)
	categoryService := service.NewCategoryService(db) // Using db directly as per the service implementation

	// Initialize handlers
	accountHandler := handlers.NewAccountHandler(accountService)
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	userHandler := handlers.NewUserHandler(userService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	return &Container{
		AccountRepository:     accountRepo,
		TransactionRepository: transactionRepo,
		UserRepository:       userRepo,
		CategoryRepository:   categoryRepo,
		AccountService:       accountService,
		TransactionService:   transactionService,
		UserService:          userService,
		CategoryService:      categoryService,
		JWTManager:           jwtManager,
		AccountHandler:       accountHandler,
		TransactionHandler:   transactionHandler,
		UserHandler:          userHandler,
		CategoryHandler:      categoryHandler,
	}, nil
}
