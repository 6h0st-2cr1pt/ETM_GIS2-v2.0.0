describe('Upload Data Page', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
    cy.visit('/upload/')
  })

  it('should display upload page', () => {
    // Check that the upload page is loaded
    cy.get('.page-title').contains('Upload Data')
    
    // Check that upload container is visible
    cy.get('.upload-container').should('be.visible')
  })

  it('should have tab navigation', () => {
    // Check that tab navigation exists
    cy.get('.tab-navigation').should('be.visible')
    cy.get('.tab-button').should('have.length', 3)
    cy.get('.tab-button').eq(0).should('contain', 'Manual Tree Entry')
    cy.get('.tab-button').eq(1).should('contain', 'Seed Planting')
    cy.get('.tab-button').eq(2).should('contain', 'CSV Upload')
  })

  it('should have CSV upload section', () => {
    // Click on CSV upload tab with force option to bypass overlay
    cy.get('.tab-button').contains('CSV Upload').click({ force: true })
    
    // Check that CSV upload section is visible
    cy.get('#csv-upload').should('be.visible')
    
    // Check CSV upload form elements exist (file input is hidden by d-none class)
    cy.get('#csv_file').should('exist')
    // Scroll into view for button that might be clipped
    cy.get('#upload-csv-btn').scrollIntoView().should('be.visible')
  })

  it('should have manual entry form', () => {
    // Manual entry tab should be active by default
    cy.get('#manual-entry').should('be.visible')
    
    // Check manual entry form elements
    cy.get('#common_name').should('be.visible')
    cy.get('#scientific_name').should('be.visible')
    cy.get('#family').should('be.visible')
    cy.get('#genus').should('be.visible')
    // Scroll into view for elements that might be clipped
    cy.get('#population').scrollIntoView().should('be.visible')
    cy.get('#latitude').scrollIntoView().should('be.visible')
    cy.get('#longitude').scrollIntoView().should('be.visible')
    cy.get('#year').scrollIntoView().should('be.visible')
    cy.get('#submit-manual-btn').scrollIntoView().should('be.visible')
  })

  it('should have seed planting form', () => {
    // Click on seed entry tab with force option
    cy.get('.tab-button').contains('Seed Planting').click({ force: true })
    
    // Check that seed entry section is visible
    cy.get('#seed-entry').should('be.visible')
    
    // Check seed planting form elements
    cy.get('#seed_common_name').should('be.visible')
    cy.get('#seed_scientific_name').should('be.visible')
    cy.get('#seed_family').should('be.visible')
    cy.get('#seed_genus').should('be.visible')
    // Scroll into view for elements that might be clipped
    cy.get('#seed_quantity').scrollIntoView().should('be.visible')
    cy.get('#seed_planting_date').scrollIntoView().should('be.visible')
    cy.get('#seed_latitude').scrollIntoView().should('be.visible')
    cy.get('#seed_longitude').scrollIntoView().should('be.visible')
    cy.get('.btn-primary').contains('Submit Seed Planting').scrollIntoView().should('be.visible')
  })
})