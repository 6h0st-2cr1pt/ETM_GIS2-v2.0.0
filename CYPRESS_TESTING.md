# Cypress Testing Guide

This guide explains how to set up and run Cypress end-to-end tests for the Endemic Trees Management System.

## Prerequisites

1. Node.js installed (version 12 or higher)
2. Python and Django environment set up
3. The Django development server running

## Installation

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Make sure your Django server is running:
   ```bash
   python manage.py runserver
   ```

3. Create a test user in your database:
   ```bash
   python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('testuser', 'test@example.com', 'testpass123')"
   ```

## Running Tests

### Interactive Mode (Recommended for Development)

```bash
npm run cypress:open
```

This opens the Cypress Test Runner where you can:
- See all available test files
- Run individual tests
- Watch tests execute in real-time
- Debug failing tests

### Headless Mode (Recommended for CI/CD)

```bash
# Run all tests
npm run cypress:run

# Run tests in a specific browser
npm run cypress:run:chrome
npm run cypress:run:firefox
```

## Test Structure

The Cypress tests are organized as follows:

- `cypress/e2e/` - Contains all test files
- `cypress/fixtures/` - Test data files
- `cypress/support/` - Custom commands and configuration
- `cypress/screenshots/` - Screenshots from test runs (generated)
- `cypress/videos/` - Videos of test runs (generated)

## Writing Tests

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code that runs before each test
    cy.login('username', 'password')
  })

  it('should do something', () => {
    // Test code
    cy.visit('/page/')
    cy.get('.element').should('be.visible')
  })
})
```

### Custom Commands

The project includes custom commands for common actions:

```javascript
// Login
cy.login('username', 'password')

// Logout
cy.logout()
```

### Using Test Data

Load test data from fixtures:

```javascript
cy.fixture('test-data').then((data) => {
  cy.get('#username').type(data.users.testUser.username)
})
```

## Debugging Tests

1. **Use the Cypress Test Runner** - It provides real-time feedback and debugging tools
2. **Add `cy.pause()`** - Insert this command to pause test execution and inspect the application
3. **Use `cy.log()`** - Add logging to understand test flow
4. **Check the console** - Cypress outputs detailed information to the browser console

## Best Practices

1. **Use `data-cy` attributes** - Add `data-cy` attributes to elements you want to test
2. **Keep tests independent** - Each test should be able to run independently
3. **Use `beforeEach` for setup** - Common setup code should go in `beforeEach`
4. **Test user workflows** - Focus on complete user journeys rather than isolated actions
5. **Use assertions** - Verify that actions produce the expected results
6. **Handle flaky tests** - Use appropriate waits and retries when needed

## Common Test Patterns

### Testing Navigation

```javascript
it('should navigate to page', () => {
  cy.get('.nav-link').click()
  cy.url().should('include', '/expected-page/')
  cy.get('.page-title').contains('Expected Page Title')
})
```

### Testing Forms

```javascript
it('should submit form', () => {
  cy.get('#name').type('Test Name')
  cy.get('#email').type('test@example.com')
  cy.get('.submit-btn').click()
  cy.get('.success-message').should('be.visible')
})
```

### Testing API Calls

```javascript
it('should return expected data', () => {
  cy.request('/api/endpoint/').then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body).to.have.property('data')
  })
})
```

## Troubleshooting

### Test User Not Found

Make sure you've created a test user:
```bash
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('testuser', 'test@example.com', 'testpass123')"
```

### Server Not Running

Ensure the Django development server is running:
```bash
python manage.py runserver
```

### Tests Failing Due to Timing Issues

Add explicit waits when needed:
```javascript
cy.wait(1000) // Wait 1 second
// Or wait for a specific element
cy.get('.element', { timeout: 10000 }).should('be.visible')
```

## Continuous Integration

For CI/CD pipelines, run tests in headless mode:
```bash
npm run cypress:run
```

You can also generate reports:
```bash
npm run cypress:run -- --reporter junit
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)

---

**Happy Testing! 🌳**