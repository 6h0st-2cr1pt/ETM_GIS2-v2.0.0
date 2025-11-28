describe('Layer Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
    cy.visit('/layers/')
  })

  it('should display layers page', () => {
    // Check that the layers page is loaded
    cy.get('.page-title').contains('Layer Control')
    
    // Check that layers container is visible
    cy.get('.layers-container').should('be.visible')
  })

  it('should display layers list', () => {
    // Check that layers list container is visible
    cy.get('.layers-list-container').should('be.visible')
    
    // Check layers list
    cy.get('.layers-list').should('be.visible')
  })

  it('should have add layer button', () => {
    // Check that add layer button is visible
    cy.get('#addLayerBtn').should('be.visible')
  })

  it('should display layer form when adding new layer', () => {
    // Click add layer button
    cy.get('#addLayerBtn').click()
    
    // Wait for modal to be visible
    cy.get('#layerFormModal').should('be.visible')
    cy.get('#layerFormModal.show').should('exist')
    
    // Check form fields
    cy.get('#layerName').should('be.visible')
    cy.get('#layerType').should('be.visible')
    cy.get('#layerUrl').should('be.visible')
    
    // Check checkboxes exist (they may be styled and have custom visibility)
    cy.get('#layerIsActive').should('exist')
    cy.get('#layerIsDefault').should('exist')
  })
})