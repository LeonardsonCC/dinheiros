.PHONY: run setup-frontend build-frontend build

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

# Run backend in development mode
backend:
	@echo "Starting backend in development mode..."
	go run cmd/dinheiros/main.go

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



help:
	@echo "Available targets:"
	@echo "  run            - Start both frontend and backend in development mode (default)"
	@echo "  backend        - Start only the backend server"
	@echo "  frontend       - Start only the frontend development server"
	@echo "  setup-frontend - Install frontend dependencies"
	@echo "  build-frontend - Build frontend assets"
	@echo "  build          - Build production binary with embedded frontend"
	@echo "  deps           - Install Go dependencies"
	@echo "  clean          - Remove generated files"
	@echo "  help           - Show this help message"
