# Cypress End-to-End Tests

This directory contains end-to-end tests for the Endemic Trees Management System using Cypress.

## Test Structure

```
cypress/
├── e2e/                 # Test files
│   ├── auth.cy.js       # Authentication tests
│   ├── dashboard.cy.js  # Dashboard page tests
│   ├── gis.cy.js        # GIS map tests
│   ├── analytics.cy.js  # Analytics page tests
│   ├── navigation.cy.js # Navigation tests
│   ├── layers.cy.js     # Layer management tests
│   ├── upload.cy.js     # Data upload tests
│   └── api.cy.js        # API endpoint tests
├── fixtures/            # Test data fixtures
├── support/             # Custom commands and configuration
└── screenshots/         # Test screenshots (generated during test runs)
```

## Running Tests

### Prerequisites

1. Make sure the Django server is running:
   ```bash
   python manage.py runserver
   ```

2. Make sure you have test users in your database. You can create them using:
   ```bash
   python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('testuser', 'test@example.com', 'testpass123')"
   ```

### Running Tests in Interactive Mode

```bash
npm run cypress:open
```

This will open the Cypress Test Runner where you can select and run individual tests.

### Running Tests in Headless Mode

```bash
# Run all tests
npm run cypress:run

# Run tests in a specific browser
npm run cypress:run:chrome
npm run cypress:run:firefox
```

## Test Configuration

The tests are configured in `cypress.config.js` with the following settings:

- Base URL: `http://localhost:8000`
- Test user credentials are stored in environment variables
- Test files are located in `cypress/e2e/`

## Writing New Tests

1. Create a new test file in `cypress/e2e/` with the `.cy.js` extension
2. Follow the existing patterns in other test files
3. Use custom commands from `cypress/support/commands.js` when possible
4. Group related tests in `describe` blocks
5. Use `beforeEach` for setup that should run before each test

## Custom Commands

The following custom commands are available:

- `cy.login(username, password)` - Logs in with the provided credentials
- `cy.logout()` - Logs out the current user
- `cy.setupUser()` - Sets up a test user (uses credentials from config)

## Test Data

Test data is configured in `cypress.config.js`:
- Username: `testuser`
- Password: `testpass123`

Make sure these credentials match a user in your test database.

## Troubleshooting

### Tests Fail Due to Missing Test User

Create a test user in your database:
```bash
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('testuser', 'test@example.com', 'testpass123')"
```

### Tests Fail Due to Server Not Running

Make sure the Django development server is running:
```bash
python manage.py runserver
```

### Tests Fail Due to Wrong Base URL

Check that the base URL in `cypress.config.js` matches your Django server URL.