describe('GIS Map Page', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
    
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
    
    cy.visit('/gis/')
  })

  it('should display map interface', () => {
    // Check that the GIS page is loaded
    cy.get('.gis-container').should('be.visible')
    
    // Check that the map element is visible
    cy.get('#map').should('be.visible')
    
    // Check that floating controls are visible
    cy.get('.floating-controls').should('be.visible')
  })

  it('should have map type controls', () => {
    // Check map type control
    cy.get('#mapTypeToggle').should('be.visible').click()
    
    // Check that map type options are visible
    cy.get('.map-type-control .control-dropdown').should('be.visible')
    
    // Check specific map type options
    cy.get('#mapTypeDark').should('be.visible')
    cy.get('#mapTypeLight').should('be.visible')
    cy.get('#mapTypeSatellite').should('be.visible')
    cy.get('#mapTypeStreet').should('be.visible')
    // Scroll into view for elements that might be clipped
    cy.get('#mapTypeTopographic').scrollIntoView().should('be.visible')
  })

  it('should have tree filter controls', () => {
    // Check tree filter control
    cy.get('#treeFilterToggle').should('be.visible').click()
    
    // Check that tree filter options are visible
    cy.get('.tree-filter-control .control-dropdown').should('be.visible')
    
    // Check "All Trees" option
    cy.get('#allTrees').should('be.visible')
  })

  it('should have entity type controls', () => {
    // Check entity type control
    cy.get('#entityTypeToggle').should('be.visible').click()
    
    // Check that entity type options are visible
    cy.get('.entity-type-control .control-dropdown').should('be.visible')
    
    // Check specific entity type options
    cy.get('#showTrees').should('be.visible')
    cy.get('#showSeeds').should('be.visible')
  })

  it('should have layer controls', () => {
    // Check layer control
    cy.get('#layerControlToggle').should('be.visible').click()
    
    // Check that layer controls are visible
    cy.get('.layer-control .control-dropdown').should('be.visible')
    
    // Check layer controls list
    cy.get('#layerControlsList').should('be.visible')
  })

  it('should have tools controls', () => {
    // Check tools control
    cy.get('#toolsToggle').should('be.visible').click()
    
    // Check that tools options are visible
    cy.get('.tools-control .control-dropdown').should('be.visible')
    
    // Check specific tool buttons that actually exist in the system
    cy.get('#centerMapBtn').should('be.visible')
    cy.get('#exportDataBtn').should('be.visible')
  })
})