/**
 * Endemic Trees Monitoring System - Main JavaScript
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize components
  initSidebar()
  initNotifications()

  // Handle theme changes
  handleThemeChanges()

  // Initialize settings functionality
  initSettings()

  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.dataset.theme
      const newTheme = currentTheme === "dark" ? "light" : "dark"

      // Update HTML attribute
      document.documentElement.dataset.theme = newTheme

      // Save preference to server
      fetch("/api/settings/theme/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((error) => console.error("Error saving theme preference:", error))
    })
  }

  // Fix for form controls in light mode
  if (document.documentElement.dataset.theme === "light") {
    document.querySelectorAll(".form-control, .form-select").forEach((element) => {
      element.style.color = "var(--text-primary)"
    })
  }
})

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
  const sidebar = document.getElementById("sidebar")
  const mainContent = document.getElementById("main-content")
  const sidebarToggle = document.getElementById("sidebar-toggle")

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed")
      mainContent.classList.toggle("expanded")
    })
  }

  // Add responsive sidebar behavior
  const mediaQuery = window.matchMedia("(max-width: 768px)")

  function handleScreenChange(e) {
    if (e.matches) {
      // Mobile view
      sidebar.classList.add("collapsed")
      mainContent.classList.add("expanded")
    }
  }

  // Initial check
  handleScreenChange(mediaQuery)

  // Add listener for screen size changes
  mediaQuery.addEventListener("change", handleScreenChange)
}

/**
 * Initialize notifications system
 */
function initNotifications() {
  // Auto-hide notifications after 5 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll(".alert")
    alerts.forEach((alert) => {
      if (alert && typeof bootstrap !== "undefined") {
        const bsAlert = new bootstrap.Alert(alert)
        bsAlert.close()
      } else if (alert) {
        alert.remove()
      }
    })
  }, 5000)
}

/**
 * Handle theme changes
 */
function handleThemeChanges() {
  const themeRadios = document.querySelectorAll('input[name="theme"]')

  if (themeRadios.length) {
    themeRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.checked) {
          // Set theme
          document.documentElement.setAttribute("data-theme", this.value)

          // Save theme preference via AJAX
          fetch("/api/settings/theme/", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-CSRFToken": getCsrfToken(),
            },
            body: `theme=${this.value}`,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Theme saved:", data)
            })
            .catch((error) => {
              console.error("Error saving theme:", error)
            })
        }
      })
    })
  }
}

/**
 * Initialize settings functionality
 */
function initSettings() {
  // Map style settings
  const mapStyleRadios = document.querySelectorAll('input[name="map_style"]')
  if (mapStyleRadios.length) {
    mapStyleRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.checked) {
          // Save map style preference via AJAX
          fetch("/api/settings/map-style/", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-CSRFToken": getCsrfToken(),
            },
            body: `style=${this.value}`,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Map style saved:", data)
            })
            .catch((error) => {
              console.error("Error saving map style:", error)
            })
        }
      })
    })
  }

  // Other settings (zoom, animations, etc.)
  const settingsInputs = document.querySelectorAll(
    '.settings-form input:not([name="theme"]):not([name="map_style"]):not([name="pin_style"])',
  )
  if (settingsInputs.length) {
    settingsInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const key = this.name
        let value

        if (this.type === "checkbox") {
          value = this.checked.toString()
        } else {
          value = this.value
        }

        // Save setting via AJAX
        saveSetting(key, value)
      })
    })
  }
}

/**
 * Save a setting via AJAX
 * @param {string} key - The setting key
 * @param {string} value - The setting value
 */
function saveSetting(key, value) {
  fetch("/api/settings/save/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": getCsrfToken(),
    },
    body: `key=${key}&value=${value}`,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(`Setting ${key} saved:`, data)
    })
    .catch((error) => {
      console.error(`Error saving setting ${key}:`, error)
    })
}

/**
 * Get CSRF token from cookies
 */
function getCsrfToken() {
  const name = "csrftoken"
  let cookieValue = null

  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }

  return cookieValue
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, warning, info)
 */
function showNotification(message, type = "success") {
  const notificationContainer = document.createElement("div")
  notificationContainer.className = "notification-container"

  const notification = document.createElement("div")
  notification.className = `alert alert-${type} alert-dismissible fade show notification`
  notification.setAttribute("role", "alert")
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `

  // Initialize Bootstrap Alert (if Bootstrap is available)
  let bsAlertInstance
  try {
    if (typeof bootstrap !== "undefined" && typeof bootstrap.Alert === "function") {
      bsAlertInstance = new bootstrap.Alert(notification)
    }
  } catch (error) {
    console.error("Bootstrap not fully loaded:", error)
    bsAlertInstance = null
  }

  notificationContainer.appendChild(notification)
  document.querySelector(".main-content").prepend(notificationContainer)

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (bsAlertInstance) {
      bsAlertInstance.close()
    } else {
      notification.remove()
    }
  }, 5000)
}
