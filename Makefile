.PHONY: run setup-frontend build-frontend build install-precommit setup-hooks lint format swagger-docs install-air backend

# Default target when running just 'make'
run: setup-frontend
	@echo "Starting both frontend and backend in development mode..."
	(trap 'kill 0' SIGINT; \
	cd frontend && npm run dev & \
	cd .. && go run cmd/dinheiros/main.go & \
	wait)

# Install frontend dependencies
setup-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Install pre-commit
install-precommit:
	@echo "Installing pre-commit..."
	pip install pre-commit

# Setup pre-commit hooks
setup-hooks: install-precommit
	@echo "Setting up pre-commit hooks..."
	pre-commit install

# Run linting
lint:
	@echo "Running golangci-lint..."
	golangci-lint run

# Format Go files
format:
	@echo "Formatting Go files with goimports-reviser..."
	goimports-reviser -project-name github.com/LeonardsonCC/dinheiros ./...

# Generate Swagger documentation
swagger-docs:
	@echo "Generating Swagger documentation..."
	swag init -g ./cmd/dinheiros/main.go --output docs

# Install air for hot reloading
install-air:
	@echo "Installing air for hot reloading..."
	@which air > /dev/null 2>&1 || go install github.com/air-verse/air@latest

# Run backend in development mode with hot reload
backend: install-air
	@echo "Starting backend in development mode with hot reload..."
	air

# Run frontend in development mode
.PHONY: frontend
frontend:
	@echo "Starting frontend in development mode..."
	cd frontend && npm run dev

# Install Go dependencies
deps:
	@echo "Installing Go dependencies..."
	go mod tidy

# Clean up generated files
clean:
	@echo "Cleaning up..."
	rm -rf frontend/node_modules frontend/dist
	go clean

# Build the frontend assets
build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build
	mkdir -p bin/frontend
	cp -r frontend/dist/* bin/frontend

# Build production binary with embedded frontend
build: build-frontend
	@echo "Building production binary..."
	env go build -ldflags="-s -w" -o bin/dinheiros ./cmd/dinheiros

generate-version:
	@echo "Generating new version..."
	./scripts/generate-version.sh

help:
	@echo "Available targets:"
	@echo "  run                             - Start both frontend and backend in development mode (default)"
	@echo "  backend                         - Start only the backend server with hot reload"
	@echo "  frontend                        - Start only the frontend development server"
	@echo "  setup-frontend                  - Install frontend dependencies"
	@echo "  install-air                     - Install air for Go hot reloading"
	@echo "  build-frontend                  - Build frontend assets"
	@echo "  build                           - Build production binary with embedded frontend"
	@echo "  deps                            - Install Go dependencies"
	@echo "  clean                           - Remove generated files"
	@echo "  install-precommit               - Install pre-commit tool"
	@echo "  setup-hooks                     - Setup pre-commit hooks"
	@echo "  lint                            - Run golangci-lint"
	@echo "  format                          - Format Go files with goimports-reviser"
	@echo "  swagger-docs                    - Generate Swagger API documentation"
	@echo "  generate-version                - Generate a new version with tag""
	@echo "  help                            - Show this help message"
