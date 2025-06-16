# Setup script for pre-commit hooks (PowerShell version)

Write-Host "Setting up pre-commit hooks..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is required but not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Python from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check if pip is installed
try {
    $pipVersion = pip --version 2>&1
    Write-Host "Found pip: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: pip is required but not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Install pre-commit
Write-Host "Installing pre-commit..." -ForegroundColor Yellow
pip install pre-commit

# Install the pre-commit hooks
Write-Host "Installing pre-commit hooks..." -ForegroundColor Yellow
pre-commit install

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
pre-commit --version

Write-Host "Pre-commit setup complete!" -ForegroundColor Green
Write-Host "The following hooks will run on commit:" -ForegroundColor Cyan
Write-Host "  - goimports-reviser (formats imports)" -ForegroundColor White
Write-Host "  - golangci-lint (lints Go code)" -ForegroundColor White
Write-Host ""
Write-Host "You can run 'make lint' to manually run golangci-lint" -ForegroundColor Yellow
Write-Host "You can run 'make format' to manually format Go files" -ForegroundColor Yellow 