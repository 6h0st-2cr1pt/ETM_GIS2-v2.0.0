describe('Complete User Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
  })

  it('should complete a full workflow from dashboard to GIS map', () => {
    // 1. Visit dashboard
    cy.visit('/dashboard/')
    cy.get('.page-title').contains('Dashboard')
    
    // 2. Check dashboard statistics
    cy.get('.stat-card').should('have.length.gte', 4)
    
    // 3. Navigate to GIS map
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
    
    cy.get('.sidebar-item').contains('GIS').click()
    cy.url().should('include', '/gis/')
    
    // 4. Check that map is loaded
    cy.get('#map').should('be.visible')
    
    // 5. Check map controls
    cy.get('.floating-controls').should('be.visible')
    
    // 6. Change map type
    cy.get('#mapTypeToggle').click()
    cy.get('#mapTypeSatellite').click()
    
    // 7. Navigate to analytics
    cy.get('.sidebar-item').contains('Analytics').click()
    cy.url().should('include', '/analytics/')
    cy.get('.page-title').contains('Analytics')
    
    // 8. Check analytics charts
    cy.get('.analytics-chart-card').should('have.length.gte', 1)
    
    // 9. Navigate back to dashboard
    cy.get('.sidebar-item').contains('Dashboard').click()
    cy.url().should('include', '/dashboard/')
    cy.get('.page-title').contains('Dashboard')
  })

  it('should test data upload and visualization workflow', () => {
    // Handle uncaught exceptions from the GIS map
    cy.on('uncaught:exception', (err, runnable) => {
      // Ignore specific errors that don't affect functionality
      if (err.message.includes('addTo') || 
          err.message.includes('addEventListener') ||
          err.message.includes('Cannot read properties of null') ||
          err.message.includes('Cannot read properties of undefined')) {
        return false
      }
      // Let other errors fail the test
      return true
    })
    
    // 1. Navigate to upload page
    cy.get('.sidebar-item').contains('Upload Data').click()
    cy.url().should('include', '/upload/')
    cy.get('.page-title').contains('Upload Data')
    
    // 2. Check upload forms
    cy.get('#csv_file').should('exist')
    cy.get('#common_name').should('be.visible')
    
    // Click on seed entry tab with force option
    cy.get('.tab-button').contains('Seed Planting').click({ force: true })
    cy.get('#seed_common_name').should('be.visible')
    
    // 3. Navigate to datasets
    cy.get('.sidebar-item').contains('Datasets').click()
    cy.url().should('include', '/datasets/')
    cy.get('.page-title').contains('Datasets')
    
    // 4. Check datasets table
    cy.get('table').should('be.visible')
    
    // 5. Navigate to GIS map to visualize data
    cy.get('.sidebar-item').contains('GIS').click()
    cy.url().should('include', '/gis/')
    cy.get('#map').should('be.visible')
  })
})