describe('Authentication Flow', () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit('/login/')
  })

  it('should display login page', () => {
    // Check that the login page is displayed correctly
    cy.get('h2').contains('Login')
    cy.get('#username').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.get('.auth-btn').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    // Try to login with invalid credentials
    cy.get('#username').type('invaliduser')
    cy.get('#password').type('wrongpassword')
    cy.get('.auth-btn').click()
    
    // Should show error message
    cy.get('.alert-danger').should('be.visible')
  })

  it('should login with valid credentials', () => {
    // For this test to work, you'll need to have a test user in your database
    // You can create one using Django management commands
    cy.fixture('test-data').then((data) => {
      cy.get('#username').type(data.users.testUser.username)
      cy.get('#password').type(data.users.testUser.password)
      cy.get('.auth-btn').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard/')
      cy.get('.page-title').contains('Dashboard')
    })
  })
})