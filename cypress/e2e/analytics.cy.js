describe('Analytics Page', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
    cy.visit('/analytics/')
  })

  it('should display analytics page', () => {
    // Check that the analytics page is loaded
    cy.get('.page-title').contains('Analytics')
    
    // Check that analytics container is visible
    cy.get('.analytics-container').should('be.visible')
  })

  it('should display analytics charts', () => {
    // Check that charts container is visible
    cy.get('.analytics-charts-container').should('be.visible')
    
    // Check that chart cards exist
    cy.get('.analytics-chart-card').should('have.length.gte', 4)
    
    // Check specific charts
    cy.get('.analytics-chart-card').eq(0).within(() => {
      cy.get('h3').contains('Population Growth Over Time')
      cy.get('#populationTimeChart').should('exist')
    })
    
    cy.get('.analytics-chart-card').eq(1).within(() => {
      cy.get('h3').contains('Health Status Distribution')
      cy.get('#healthDistributionChart').should('exist')
    })
  })

  it('should have metrics containers', () => {
    // Check that metrics containers exist
    cy.get('.analytics-metrics-container').should('exist')
    
    // Check specific metric cards
    cy.get('.metrics-card').should('have.length.gte', 1)
    
    cy.get('.metrics-card').eq(0).within(() => {
      cy.get('h3').contains('Tree Distribution Map')
      cy.get('#distributionMap').should('exist')
    })
    
    cy.get('.metrics-card').eq(1).within(() => {
      cy.get('h3').contains('Annual Growth Rate')
      cy.get('#growthRateChart').should('exist')
    })
  })
})