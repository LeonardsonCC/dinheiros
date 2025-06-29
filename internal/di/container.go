package di

import (
	"os"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/auth"
	"github.com/LeonardsonCC/dinheiros/internal/handlers"
	"github.com/LeonardsonCC/dinheiros/internal/repository"
	"github.com/LeonardsonCC/dinheiros/internal/service"
	"gorm.io/gorm"
)

type Container struct {
	// Repositories
	AccountRepository     repository.AccountRepository
	TransactionRepository repository.TransactionRepository
	UserRepository        repository.UserRepository
	CategoryRepository    repository.CategoryRepository
	CategorizationRuleRepository repository.CategorizationRuleRepository

	// Services
	AccountService     service.AccountService
	TransactionService service.TransactionService
	UserService        service.UserService
	CategoryService    service.CategoryService
	CategorizationRuleService    service.CategorizationRuleService

	// Auth
	JWTManager *auth.JWTManager

	// Handlers
	AccountHandler     *handlers.AccountHandler
	TransactionHandler *handlers.TransactionHandler
	UserHandler        *handlers.UserHandler
	CategoryHandler    *handlers.CategoryHandler
	CategorizationRuleHandler    *handlers.CategorizationRuleHandler
}

func NewContainer(db *gorm.DB) (*Container, error) {
	// Initialize JWT manager
	// jwtSecret := os.Getenv("JWT_SECRET")
	jwtSecret := "test"
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
	categorizationRuleRepo := repository.NewCategorizationRuleRepository(db)

	// Initialize services
	accountService := service.NewAccountService(accountRepo)
	categoryService := service.NewCategoryService(db)
	transactionService := service.NewTransactionService(transactionRepo, accountRepo, categoryService)
	userService := service.NewUserService(userRepo, jwtManager)
	categorizationRuleService := service.NewCategorizationRuleService(categorizationRuleRepo)

	// Initialize handlers
	accountHandler := handlers.NewAccountHandler(accountService)
	transactionHandler := handlers.NewTransactionHandler(transactionService, categoryService, categorizationRuleService)
	userHandler := handlers.NewUserHandler(userService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	categorizationRuleHandler := handlers.NewCategorizationRuleHandler(categorizationRuleService)

	return &Container{
		AccountRepository:     accountRepo,
		TransactionRepository: transactionRepo,
		UserRepository:        userRepo,
		CategoryRepository:    categoryRepo,
		CategorizationRuleRepository: categorizationRuleRepo,
		AccountService:        accountService,
		TransactionService:    transactionService,
		UserService:           userService,
		CategoryService:       categoryService,
		CategorizationRuleService:    categorizationRuleService,
		JWTManager:            jwtManager,
		AccountHandler:        accountHandler,
		TransactionHandler:    transactionHandler,
		UserHandler:           userHandler,
		CategoryHandler:       categoryHandler,
		CategorizationRuleHandler:    categorizationRuleHandler,
	}, nil
}
