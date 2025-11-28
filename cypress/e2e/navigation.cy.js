describe('Navigation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
  })

  it('should navigate to dashboard', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Dashboard').click()
    cy.url().should('include', '/dashboard/')
    cy.get('.page-title').contains('Dashboard')
  })

  it('should navigate to GIS map', () => {
    // Handle uncaught exceptions from the GIS map
    cy.on('uncaught:exception', (err, runnable) => {
      // Ignore specific errors that don't affect functionality
      if (err.message.includes('addTo') || 
          err.message.includes('addEventListener') ||
          err.message.includes('Cannot read properties of null')) {
        return false
      }
      // Let other errors fail the test
      return true
    })
    
    cy.visit('/')
    cy.get('.sidebar-item').contains('GIS').click()
    cy.url().should('include', '/gis/')
    cy.get('#map').should('be.visible')
  })

  it('should navigate to analytics', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Analytics').click()
    cy.url().should('include', '/analytics/')
    cy.get('.page-title').contains('Analytics')
  })

  it('should navigate to layer control', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Layer Control').click()
    cy.url().should('include', '/layers/')
    cy.get('.page-title').contains('Layer Control')
  })

  it('should navigate to datasets', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Datasets').click()
    cy.url().should('include', '/datasets/')
    cy.get('.page-title').contains('Datasets')
  })

  it('should navigate to reports', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Reports').click()
    cy.url().should('include', '/reports/')
    cy.get('.page-title').contains('Reports')
  })

  it('should navigate to upload data', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('Upload Data').click()
    cy.url().should('include', '/upload/')
    cy.get('.page-title').contains('Upload Data')
  })

  it('should navigate to about', () => {
    cy.visit('/')
    cy.get('.sidebar-item').contains('About').click()
    cy.url().should('include', '/about/')
    cy.get('.page-title').contains('About')
  })

  it('should logout successfully', () => {
    cy.visit('/')
    cy.get('.sidebar-logout').click()
    cy.url().should('include', '/login/')
  })
})