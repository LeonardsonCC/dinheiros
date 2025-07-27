# Agent Guidelines for Dinheiros

## Build/Test Commands
- **Frontend**: `cd frontend && npm run dev` (dev), `npm run build` (build), `npm run lint` (lint)
- **Backend**: `go run cmd/dinheiros/main.go` (dev), `make build` (production)
- **Full stack**: `make run` (starts both frontend and backend)
- **Dependencies**: `make setup-frontend` (frontend), `go mod tidy` (backend)
- **Tests**: `go test ./...` (all), `go test ./internal/repository` (repositories), `go test -cover ./...` (with coverage)

## Go Code Style
- Use standard Go formatting (`gofmt`)
- Package comments for exported types/functions
- Struct-based handlers with dependency injection pattern
- Error handling with proper HTTP status codes
- Import grouping: stdlib, external, internal packages

## TypeScript/React Style
- Strict TypeScript with `noUnusedLocals` and `noUnusedParameters`
- React functional components with hooks
- Tailwind CSS for styling with semantic class names
- Heroicons for icons, React Router for navigation
- Form validation with react-hook-form and Zod

## Project Structure
- Backend: `internal/` (handlers, services, models, repositories)
- Frontend: `frontend/src/` (components, pages, services)
- No tests currently configured - ask user for test setup if needed