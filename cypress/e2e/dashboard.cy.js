describe('Dashboard Page', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
    cy.visit('/dashboard/')
  })

  it('should display dashboard with statistics', () => {
    // Check that the dashboard page is loaded
    cy.get('.page-title').contains('Dashboard')
    
    // Check that statistics cards are visible
    cy.get('.stat-card').should('have.length.gte', 4)
    
    // Check specific stat cards
    cy.get('.stat-card').eq(0).within(() => {
      cy.get('h2').should('be.visible')
      cy.get('p').contains('Total Tree Records')
    })
    
    cy.get('.stat-card').eq(1).within(() => {
      cy.get('h2').should('be.visible')
      cy.get('p').contains('Unique Species')
    })
    
    cy.get('.stat-card').eq(2).within(() => {
      cy.get('h2').should('be.visible')
      cy.get('p').contains('Total Population')
    })
    
    cy.get('.stat-card').eq(3).within(() => {
      cy.get('h2').should('be.visible')
      cy.get('p').contains('Trees in Good Health')
    })
  })

  it('should display charts', () => {
    // Check that charts container is visible
    cy.get('.dashboard-charts-container').should('be.visible')
    
    // Check that chart cards exist
    cy.get('.dashboard-chart').should('have.length.gte', 3)
    
    // Check specific charts
    cy.get('.dashboard-chart').eq(0).within(() => {
      cy.get('h3').contains('Population by Year')
      cy.get('#populationChart').should('exist')
    })
    
    cy.get('.dashboard-chart').eq(1).within(() => {
      cy.get('h3').contains('Species Distribution')
      cy.get('#speciesChart').should('exist')
    })
    
    cy.get('.dashboard-chart').eq(2).within(() => {
      cy.get('h3').contains('Health Status Distribution')
      cy.get('#healthChart').should('exist')
    })
  })

  it('should display recent updates table', () => {
    // Check that the recent updates table is visible
    cy.get('.dashboard-table-container').within(() => {
      cy.get('h3').contains('Recent Updates')
      cy.get('table').should('exist')
      
      // Check table headers
      cy.get('thead th').contains('Species')
      cy.get('thead th').contains('Location')
      cy.get('thead th').contains('Population')
      cy.get('thead th').contains('Health Status')
      cy.get('thead th').contains('Last Updated')
    })
  })
})