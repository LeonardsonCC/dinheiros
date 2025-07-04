package errors

import "errors"

var (
	// Common errors
	ErrInvalidRequest      = errors.New("invalid request")
	ErrNotFound            = errors.New("not found")
	ErrInsufficientFunds   = errors.New("insufficient funds")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrSameAccountTransfer = errors.New("transfer to the same account is not allowed")
	ErrFromAccountNotFound = errors.New("source account not found")
	ErrToAccountNotFound   = errors.New("destination account not found")
)

// ValidationError represents a validation error
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// NotFoundError represents a not found error
type NotFoundError struct {
	Message string
}

func (e *NotFoundError) Error() string {
	if e.Message == "" {
		return "resource not found"
	}
	return e.Message
}

// ErrorResponse represents an error response to the client
type ErrorResponse struct {
	Error string `json:"error"`
}

// NewErrorResponse creates a new error response
func NewErrorResponse(err error) ErrorResponse {
	return ErrorResponse{Error: err.Error()}
}

// NewValidationError creates a new validation error
func NewValidationError(message string) *ValidationError {
	return &ValidationError{Message: message}
}

// NewNotFoundError creates a new not found error
func NewNotFoundError(message string) *NotFoundError {
	return &NotFoundError{Message: message}
}
