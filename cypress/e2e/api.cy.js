describe('API Endpoints', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
  })

  it('should return tree data in GeoJSON format', () => {
    cy.request('/api/tree-data/').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('type', 'FeatureCollection')
      expect(response.body).to.have.property('features')
    })
  })

  it('should return seed data in GeoJSON format', () => {
    cy.request('/api/seed-data/').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('type', 'FeatureCollection')
      expect(response.body).to.have.property('features')
    })
  })

  it('should return analytics data', () => {
    cy.request('/api/analytics-data/').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('species_count')
      expect(response.body).to.have.property('population_by_year')
    })
  })

  it('should return layers data', () => {
    cy.request('/api/layers/').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('layers')
    })
  })
})