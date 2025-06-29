#!/bin/bash

# Setup script for pre-commit hooks

echo "Setting up pre-commit hooks..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is required but not installed."
    exit 1
fi

# Install pre-commit
echo "Installing pre-commit..."
pip3 install pre-commit

# Install the pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install

# Verify installation
echo "Verifying installation..."
pre-commit --version

echo "Pre-commit setup complete!"
echo "The following hooks will run on commit:"
echo "  - goimports-reviser (formats imports)"
echo "  - golangci-lint (lints Go code)"
echo ""
echo "You can run 'make lint' to manually run golangci-lint"
echo "You can run 'make format' to manually format Go files" 