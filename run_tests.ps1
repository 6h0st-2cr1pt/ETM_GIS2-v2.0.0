# ETM GIS2 Test Setup and Runner
# PowerShell script for Windows

Write-Host "ETM GIS2 - Test Suite Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path ".venv")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "Virtual environment found." -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1

# Install/Update dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Cyan
python manage.py makemigrations
python manage.py migrate

# Display menu
function Show-Menu {
    Write-Host ""
    Write-Host "Test Runner Menu" -ForegroundColor Green
    Write-Host "================" -ForegroundColor Green
    Write-Host "1. Run all tests"
    Write-Host "2. Run all tests with coverage"
    Write-Host "3. Run model tests only"
    Write-Host "4. Run API tests only"
    Write-Host "5. Run view tests only"
    Write-Host "6. Run specific test"
    Write-Host "7. Generate coverage report (HTML)"
    Write-Host "8. Run tests in parallel"
    Write-Host "9. Exit"
    Write-Host ""
}

do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-9)"
    
    switch ($choice) {
        '1' {
            Write-Host "Running all tests..." -ForegroundColor Cyan
            pytest -v
        }
        '2' {
            Write-Host "Running all tests with coverage..." -ForegroundColor Cyan
            pytest --cov=app --cov-report=term-missing
        }
        '3' {
            Write-Host "Running model tests..." -ForegroundColor Cyan
            pytest app/tests.py -k "Model" -v
        }
        '4' {
            Write-Host "Running API tests..." -ForegroundColor Cyan
            pytest app/tests.py -k "API" -v
        }
        '5' {
            Write-Host "Running view tests..." -ForegroundColor Cyan
            pytest app/tests.py -k "View" -v
        }
        '6' {
            $testName = Read-Host "Enter test name or pattern"
            Write-Host "Running test: $testName" -ForegroundColor Cyan
            pytest app/tests.py -k "$testName" -v
        }
        '7' {
            Write-Host "Generating HTML coverage report..." -ForegroundColor Cyan
            pytest --cov=app --cov-report=html
            Write-Host "Opening coverage report..." -ForegroundColor Green
            Start-Process "htmlcov\index.html"
        }
        '8' {
            Write-Host "Running tests in parallel..." -ForegroundColor Cyan
            pytest -n auto -v
        }
        '9' {
            Write-Host "Exiting..." -ForegroundColor Yellow
            break
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
        }
    }
    
    if ($choice -ne '9') {
        Write-Host ""
        Read-Host "Press Enter to continue"
    }
} while ($choice -ne '9')

Write-Host ""
Write-Host "Thank you for testing ETM GIS2!" -ForegroundColor Green
