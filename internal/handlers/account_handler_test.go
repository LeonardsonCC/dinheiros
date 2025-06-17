package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/leccarvalho/dinheiros/internal/dto"
	"github.com/leccarvalho/dinheiros/internal/handlers"
	"github.com/leccarvalho/dinheiros/internal/models"
	svc "github.com/leccarvalho/dinheiros/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAccountService is a mock implementation of the AccountService interface
type MockAccountService struct {
	mock.Mock
}

func (m *MockAccountService) CreateAccount(account *models.Account) error {
	args := m.Called(account)
	if args.Get(0) != nil {
		*account = *args.Get(0).(*models.Account)
	}
	return args.Error(1)
}

func (m *MockAccountService) GetAccountByID(id uint, userID uint) (*models.Account, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Account), args.Error(1)
}

func (m *MockAccountService) GetAccountsByUserID(userID uint) ([]models.Account, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Account), args.Error(1)
}

func (m *MockAccountService) UpdateAccount(account *models.Account, userID uint) error {
	args := m.Called(account, userID)
	return args.Error(0)
}

func (m *MockAccountService) DeleteAccount(id uint, userID uint) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func setupTestRouter(service svc.AccountService) *gin.Engine {
	handler := handlers.NewAccountHandler(service)
	router := gin.Default()

	// Add test user to context
	router.Use(func(c *gin.Context) {
		user := &models.User{}
		c.Set("user", user)
		c.Next()
	})

	// Setup routes
	api := router.Group("/api")
	{
		accounts := api.Group("/accounts")
		{
			accounts.GET("", handler.GetAccounts)
			accounts.POST("", handler.CreateAccount)
			account := accounts.Group("/:id")
			{
				account.GET("", handler.GetAccount)
				account.DELETE("", handler.DeleteAccount)
			}
		}
	}

	return router
}

func TestCreateAccount(t *testing.T) {
	mockService := new(MockAccountService)
	router := setupTestRouter(mockService)

	tests := []struct {
		name           string
		request        dto.CreateAccountRequest
		setupMock      func()
		expectedStatus int
	}{
		{
			name: "success",
			request: dto.CreateAccountRequest{
				Name:           "Test Account",
				Type:           models.AccountTypeChecking,
				Currency:       "USD",
				InitialBalance: 1000.0,
			},
			setupMock: func() {
				mockService.On("CreateAccount", mock.AnythingOfType("*models.Account")).
					Run(func(args mock.Arguments) {
						account := args.Get(0).(*models.Account)
						account.ID = 1
					}).Return(nil)
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "invalid request",
			request: dto.CreateAccountRequest{
				Name:           "", // Missing required name
				Type:           models.AccountTypeChecking,
				Currency:       "USD",
				InitialBalance: 1000.0,
			},
			setupMock:      func() {},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			requestBody, _ := json.Marshal(tt.request)
			req, _ := http.NewRequest(http.MethodPost, "/api/accounts", bytes.NewBuffer(requestBody))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			mockService.AssertExpectations(t)
		})
	}
}

func TestGetAccounts(t *testing.T) {
	mockService := new(MockAccountService)
	router := setupTestRouter(mockService)

	testAccounts := []models.Account{
		{Name: "Account 1", UserID: 1},
		{Name: "Account 2", UserID: 1},
	}

	mockService.On("GetAccountsByUserID", uint(1)).Return(testAccounts, nil)

	req, _ := http.NewRequest(http.MethodGet, "/api/accounts", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	accounts := response["accounts"].([]interface{})
	assert.Len(t, accounts, 2)

	mockService.AssertExpectations(t)
}

func TestGetAccount(t *testing.T) {
	mockService := new(MockAccountService)
	router := setupTestRouter(mockService)

	testAccount := &models.Account{
		Name:   "Test Account",
		UserID: 1,
	}

	tests := []struct {
		name           string
		accountID      string
		setupMock      func()
		expectedStatus int
	}{
		{
			name:      "success",
			accountID: "1",
			setupMock: func() {
				mockService.On("GetAccountByID", uint(1), uint(1)).Return(testAccount, nil)
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:      "not found",
			accountID: "999",
			setupMock: func() {
				mockService.On("GetAccountByID", uint(999), uint(1)).Return((*models.Account)(nil), nil)
			},
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid id",
			accountID:      "invalid",
			setupMock:      func() {},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			req, _ := http.NewRequest(http.MethodGet, "/api/accounts/"+tt.accountID, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}

	mockService.AssertExpectations(t)
}

func TestDeleteAccount(t *testing.T) {
	mockService := new(MockAccountService)
	router := setupTestRouter(mockService)

	tests := []struct {
		name           string
		accountID      string
		setupMock      func()
		expectedStatus int
	}{
		{
			name:      "success",
			accountID: "1",
			setupMock: func() {
				mockService.On("DeleteAccount", uint(1), uint(1)).Return(nil)
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:      "not found",
			accountID: "999",
			setupMock: func() {
				mockService.On("DeleteAccount", uint(999), uint(1)).Return(nil)
			},
			expectedStatus: http.StatusOK, // Still returns 200 even if not found
		},
		{
			name:           "invalid id",
			accountID:      "invalid",
			setupMock:      func() {},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			req, _ := http.NewRequest(http.MethodDelete, "/api/accounts/"+tt.accountID, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}

	mockService.AssertExpectations(t)
}
