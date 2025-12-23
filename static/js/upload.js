document.addEventListener("DOMContentLoaded", () => {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab")

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Show selected tab content, hide others
      tabContents.forEach((content) => {
        if (content.id === tabId) {
          content.style.display = "block"
          // Add a small delay before showing for animation effect
          setTimeout(() => {
            content.style.opacity = "1"
          }, 50)
        } else {
          content.style.display = "none"
          content.style.opacity = "0"
        }
      })
    })
  })

  // CSV file upload handling
  const dropZone = document.getElementById("dropzone")
  const fileInput = document.getElementById("csv_file")
  const fileInfo = document.getElementById("selected-file-info")
  const uploadButton = document.getElementById("upload-csv-btn")

  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect)
  }

  if (dropZone) {
    ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false)
    })
    ;["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false)
    })
    ;["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false)
    })

    dropZone.addEventListener("drop", handleDrop, false)
  }

  function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function highlight() {
    dropZone.querySelector(".drag-drop-area").classList.add("drag-over")
  }

  function unhighlight() {
    dropZone.querySelector(".drag-drop-area").classList.remove("drag-over")
  }

  function handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files

    if (files.length) {
      fileInput.files = files
      handleFileSelect()
    }
  }

  function handleFileSelect() {
    if (fileInput.files.length) {
      const file = fileInput.files[0]

      // Check if file is CSV
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        fileInfo.innerHTML = `
          <div class="selected-file-details">
            <i class="fas fa-file-csv"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
          </div>
        `
        uploadButton.disabled = false
      } else {
        fileInfo.innerHTML = `
          <div class="selected-file-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>Invalid file type. Please select a CSV file.</span>
          </div>
        `
        uploadButton.disabled = true
      }
    } else {
      fileInfo.innerHTML = "<p>No file selected</p>"
      uploadButton.disabled = true
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Radio button validation for tree health and type
  const submitButton = document.getElementById("submit-manual-btn")
  const treeHealthRadios = document.querySelectorAll('input[name="tree_health"]')
  const treeTypeRadios = document.querySelectorAll('input[name="tree_type"]')

  function validateRadioButtons() {
    const healthSelected = document.querySelector('input[name="tree_health"]:checked')
    const typeSelected = document.querySelector('input[name="tree_type"]:checked')
    
    if (healthSelected && typeSelected && submitButton) {
      submitButton.disabled = false
    } else if (submitButton) {
      submitButton.disabled = true
    }
  }

  // Validate when radio buttons change
  if (treeHealthRadios.length) {
    treeHealthRadios.forEach((radio) => {
      radio.addEventListener("change", validateRadioButtons)
    })
  }

  if (treeTypeRadios.length) {
    treeTypeRadios.forEach((radio) => {
      radio.addEventListener("change", validateRadioButtons)
    })
  }

  // Initial validation
  validateRadioButtons()

  // Form validation and submission
  const manualForm = document.getElementById("manual-entry-form")
  const seedForm = document.getElementById("seed-entry-form")

  if (manualForm) {
    manualForm.addEventListener("submit", function (e) {
      if (!validateForm(this)) {
        e.preventDefault()
      }
    })
  }

  if (seedForm) {
    seedForm.addEventListener("submit", function (e) {
      if (!validateForm(this)) {
        e.preventDefault()
      }
    })

    // Handle conditional fields based on germination status
    const germinationStatus = document.getElementById("seed_germination_status")
    const germinationDate = document.getElementById("seed_germination_date")

    if (germinationStatus && germinationDate) {
      germinationStatus.addEventListener("change", function () {
        const value = this.value
        if (value === "not_germinated" || value === "failed") {
          germinationDate.parentElement.style.opacity = "0.5"
          germinationDate.disabled = true
        } else {
          germinationDate.parentElement.style.opacity = "1"
          germinationDate.disabled = false
        }
      })

      // Trigger on page load
      germinationStatus.dispatchEvent(new Event("change"))
    }
  }

  function validateForm(form) {
    let isValid = true
    const requiredFields = form.querySelectorAll("[required]")

    requiredFields.forEach((field) => {
      // Handle radio buttons differently
      if (field.type === 'radio') {
        const radioGroup = form.querySelectorAll(`input[name="${field.name}"]`)
        const isChecked = Array.from(radioGroup).some(radio => radio.checked)
        
        if (!isChecked) {
          isValid = false
          // Mark all radios in the group as error
          radioGroup.forEach(radio => {
            radio.classList.add("error")
          })
        } else {
          // Remove error from all radios in the group
          radioGroup.forEach(radio => {
            radio.classList.remove("error")
          })
        }
      } else {
        // Handle other input types
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")

          // Add error message if not already present
          let errorMsg = field.parentElement.querySelector(".error-message")
          if (!errorMsg) {
            errorMsg = document.createElement("div")
            errorMsg.className = "error-message"
            errorMsg.textContent = "This field is required"
            field.parentElement.appendChild(errorMsg)
          }
        } else {
          field.classList.remove("error")
          const errorMsg = field.parentElement.querySelector(".error-message")
          if (errorMsg) {
            errorMsg.remove()
          }
        }
      }
    })

    return isValid
  }

  // Family and genus are now textboxes, no filtering needed

  // Add animation effects to form elements
  const formGroups = document.querySelectorAll(".form-group")
  formGroups.forEach((group, index) => {
    group.style.opacity = "0"
    group.style.transform = "translateY(20px)"
    group.style.transition = "opacity 0.3s ease, transform 0.3s ease"

    setTimeout(() => {
      group.style.opacity = "1"
      group.style.transform = "translateY(0)"
    }, 50 * index)
  })

  // Initialize radio button validation on page load
  validateRadioButtons()

  // Auto-populate tree data from CSV
  const commonNameInput = document.getElementById("common_name")
  const scientificNameInput = document.getElementById("scientific_name")
  const familyInput = document.getElementById("family")
  const genusInput = document.getElementById("genus")

  // Check if we're on the manual entry form
  if (!commonNameInput || !scientificNameInput || !familyInput || !genusInput) {
    console.log("Tree auto-population: Form fields not found, skipping initialization")
  } else {
    console.log("Tree auto-population: Form fields found, initializing...")
  }

  let treesData = []
  let dataLoaded = false

  // Fetch tree data from API
  async function loadTreesData() {
    try {
      console.log("Loading trees data from API...")
      const response = await fetch("/api/endemic-trees-list/")
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }
      const data = await response.json()
      console.log("API response:", data)
      if (data.success && data.trees) {
        treesData = data.trees
        dataLoaded = true
        console.log(`Loaded ${treesData.length} trees from CSV`)
        // Log first few trees for debugging
        if (treesData.length > 0) {
          console.log("Sample trees:", treesData.slice(0, 3))
        }
      } else {
        console.error("API returned unsuccessful response:", data)
      }
    } catch (error) {
      console.error("Error loading trees data:", error)
      // Show user-friendly error message
      if (commonNameInput) {
        const errorMsg = document.createElement('small')
        errorMsg.className = 'text-danger'
        errorMsg.textContent = ' (Unable to load tree data for auto-complete)'
        errorMsg.style.display = 'block'
        commonNameInput.parentElement.appendChild(errorMsg)
      }
    }
  }

  // Auto-populate fields based on common name
  function autoPopulateTreeData(commonName) {
    // If common name is empty, clear auto-populated fields
    if (!commonName || !commonName.trim()) {
      console.log("Common name is empty, clearing auto-populated fields")
      if (scientificNameInput && scientificNameInput.dataset.autoFilled === 'true') {
        scientificNameInput.value = ''
        scientificNameInput.dataset.autoFilled = 'false'
        scientificNameInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (familyInput && familyInput.dataset.autoFilled === 'true') {
        familyInput.value = ''
        familyInput.dataset.autoFilled = 'false'
        familyInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (genusInput && genusInput.dataset.autoFilled === 'true') {
        genusInput.value = ''
        genusInput.dataset.autoFilled = 'false'
        genusInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      return
    }
    
    if (!dataLoaded || !treesData.length) {
      console.log("Tree data not loaded yet or empty. Data loaded:", dataLoaded, "Trees count:", treesData.length)
      return
    }

    const searchTerm = commonName.trim().toLowerCase()
    if (!searchTerm) return

    console.log(`Searching for: "${searchTerm}" in ${treesData.length} trees`)

    // First try exact match (case-insensitive)
    let matchedTree = treesData.find(tree => 
      tree.common_name && tree.common_name.toLowerCase() === searchTerm
    )

    // If no exact match, try starts-with match
    if (!matchedTree) {
      matchedTree = treesData.find(tree => {
        if (!tree.common_name) return false
        const treeName = tree.common_name.toLowerCase()
        return treeName.startsWith(searchTerm) || searchTerm.startsWith(treeName)
      })
    }

    // If still no match, try partial match (user input contains tree name or vice versa)
    if (!matchedTree) {
      matchedTree = treesData.find(tree => {
        if (!tree.common_name) return false
        const treeName = tree.common_name.toLowerCase()
        return treeName.includes(searchTerm) || searchTerm.includes(treeName)
      })
    }

    if (matchedTree) {
      console.log("Match found:", matchedTree)
      // Populate fields - always populate if they're empty, or if they were auto-filled
      const shouldPopulateScientific = !scientificNameInput.value || scientificNameInput.dataset.autoFilled === 'true'
      const shouldPopulateFamily = !familyInput.value || familyInput.dataset.autoFilled === 'true'
      const shouldPopulateGenus = !genusInput.value || genusInput.dataset.autoFilled === 'true'

      if (shouldPopulateScientific && scientificNameInput && matchedTree.scientific_name) {
        scientificNameInput.value = matchedTree.scientific_name
        scientificNameInput.dataset.autoFilled = 'true'
        console.log("Populated scientific name:", matchedTree.scientific_name)
        // Trigger input event to ensure form validation sees the change
        scientificNameInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (shouldPopulateFamily && familyInput && matchedTree.family) {
        familyInput.value = matchedTree.family
        familyInput.dataset.autoFilled = 'true'
        console.log("Populated family:", matchedTree.family)
        familyInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (shouldPopulateGenus && genusInput && matchedTree.genus) {
        genusInput.value = matchedTree.genus
        genusInput.dataset.autoFilled = 'true'
        console.log("Populated genus:", matchedTree.genus)
        genusInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    } else {
      console.log("No match found for:", searchTerm)
      console.log("Available tree names:", treesData.map(t => t.common_name).slice(0, 5))
    }
  }

  // Track manual changes to prevent overwriting user input
  if (scientificNameInput) {
    scientificNameInput.addEventListener('input', function() {
      if (this.value && this.dataset.autoFilled !== 'true') {
        this.dataset.autoFilled = 'false'
      }
    })
  }

  if (familyInput) {
    familyInput.addEventListener('input', function() {
      if (this.value && this.dataset.autoFilled !== 'true') {
        this.dataset.autoFilled = 'false'
      }
    })
  }

  if (genusInput) {
    genusInput.addEventListener('input', function() {
      if (this.value && this.dataset.autoFilled !== 'true') {
        this.dataset.autoFilled = 'false'
      }
    })
  }

  // Listen for common name input changes
  if (commonNameInput && scientificNameInput && familyInput && genusInput) {
    console.log("Common name input found, setting up event listeners")
    let debounceTimer
    commonNameInput.addEventListener('input', function(e) {
      const value = this.value
      console.log("Common name input changed to:", value)
      clearTimeout(debounceTimer)
      // Reduce debounce time for more responsive feel
      debounceTimer = setTimeout(() => {
        autoPopulateTreeData(value)
      }, 200) // Wait 200ms after user stops typing
    })
    
    // Also try to populate immediately if data is already loaded
    commonNameInput.addEventListener('focus', function() {
      console.log("Common name input focused, data loaded:", dataLoaded)
      if (dataLoaded && this.value) {
        autoPopulateTreeData(this.value)
      }
    })
    
    // Try to populate on blur as well (when user leaves the field)
    commonNameInput.addEventListener('blur', function() {
      if (dataLoaded && this.value) {
        autoPopulateTreeData(this.value)
      }
    })

    // Load tree data on page load
    loadTreesData()
  } else {
    console.log("Tree auto-population: Not all form fields found, skipping setup")
  }

  // Auto-geocode address from latitude/longitude
  const latitudeInput = document.getElementById("latitude")
  const longitudeInput = document.getElementById("longitude")
  const addressInput = document.getElementById("address")

  if (latitudeInput && longitudeInput && addressInput) {
    let geocodeTimeout = null
    let lastGeocodeTime = 0
    const GEOCODE_THROTTLE_MS = 1000 // 1 second throttle

    function geocodeCoordinates() {
      const lat = latitudeInput.value.trim()
      const lon = longitudeInput.value.trim()

      // Clear address if lat or lon is empty
      if (!lat || !lon) {
        addressInput.value = ""
        return
      }

      // Validate coordinates are numbers
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)
      
      if (isNaN(latNum) || isNaN(lonNum)) {
        addressInput.value = ""
        return
      }

      // Throttle: ensure at least 1 second has passed since last request
      const now = Date.now()
      const timeSinceLastRequest = now - lastGeocodeTime
      
      if (timeSinceLastRequest < GEOCODE_THROTTLE_MS) {
        // Clear existing timeout and set new one
        if (geocodeTimeout) {
          clearTimeout(geocodeTimeout)
        }
        const delay = GEOCODE_THROTTLE_MS - timeSinceLastRequest
        geocodeTimeout = setTimeout(() => {
          performGeocode(latNum, lonNum)
        }, delay)
        return
      }

      // Perform geocode immediately
      performGeocode(latNum, lonNum)
    }

    function performGeocode(lat, lon) {
      lastGeocodeTime = Date.now()
      
      // Show loading state
      addressInput.value = "Loading address..."
      addressInput.disabled = true

      // Call geocoding API
      fetch(`/api/geocode/?lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.address) {
            addressInput.value = data.address
          } else {
            addressInput.value = ""
          }
          addressInput.disabled = false
        })
        .catch(error => {
          console.error("Geocoding error:", error)
          addressInput.value = ""
          addressInput.disabled = false
        })
    }

    // Listen for changes on latitude and longitude inputs
    latitudeInput.addEventListener("input", geocodeCoordinates)
    longitudeInput.addEventListener("input", geocodeCoordinates)
    
    // Also trigger on blur (when user leaves the field)
    latitudeInput.addEventListener("blur", geocodeCoordinates)
    longitudeInput.addEventListener("blur", geocodeCoordinates)
  }
})
