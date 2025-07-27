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
- No tests currently configured - ask user for test setup if neededALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using `container-use log <env_id>` AND `container-use checkout <env_id>`. Failure to do this will make your work inaccessible to others.
