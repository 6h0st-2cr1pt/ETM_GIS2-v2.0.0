// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login/')
  cy.get('#username').type(username)
  cy.get('#password').type(password)
  cy.get('.auth-btn').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('.sidebar-logout a').click()
})

Cypress.Commands.add('setupUser', () => {
  // This would typically be handled by your Django test setup
  // For now, we'll use the credentials from cypress.config.js
  cy.login(Cypress.env('django_user'), Cypress.env('django_password'))
})