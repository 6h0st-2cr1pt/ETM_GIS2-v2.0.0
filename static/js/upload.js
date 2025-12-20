document.addEventListener("DOMContentLoaded", () => {
  // Image preview functionality for location images
  const locationImageInput = document.getElementById('location_image')
  const locationImagePreview = document.getElementById('image-preview')
  const locationImagePreviewContainer = document.getElementById('image-preview-container')
  
  if (locationImageInput && locationImagePreview) {
    locationImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = function(e) {
          locationImagePreview.src = e.target.result
          locationImagePreviewContainer.style.display = 'block'
        }
        reader.readAsDataURL(file)
      } else {
        locationImagePreviewContainer.style.display = 'none'
      }
    })
  }
  
  
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

  // Health Status Distribution Validation
  const populationInput = document.getElementById("population")
  const populationCountDisplay = document.getElementById("population-count")
  const healthyCount = document.getElementById("healthy_count")
  const goodCount = document.getElementById("good_count")
  const badCount = document.getElementById("bad_count")
  const deceasedCount = document.getElementById("deceased_count")
  const healthStatusInputs = document.querySelectorAll(".health-count")
  const progressBar = document.getElementById("health-progress-bar")
  const statusMessage = document.getElementById("health-status-message")
  const submitButton = document.getElementById("submit-manual-btn")

  // Update population count display when population input changes
  if (populationInput && populationCountDisplay) {
    populationInput.addEventListener("input", () => {
      const value = Number.parseInt(populationInput.value) || 0
      populationCountDisplay.textContent = value
      validateHealthCounts()
    })
  }

  // Validate health counts when any health status input changes
  if (healthStatusInputs.length) {
    healthStatusInputs.forEach((input) => {
      input.addEventListener("input", validateHealthCounts)
    })
  }

  function validateHealthCounts() {
    const population = Number.parseInt(populationInput.value) || 0
    const healthy = Number.parseInt(healthyCount.value) || 0
    const good = Number.parseInt(goodCount.value) || 0
    const bad = Number.parseInt(badCount.value) || 0
    const deceased = Number.parseInt(deceasedCount.value) || 0

    const totalHealth = healthy + good + bad + deceased
    const percentage = population > 0 ? (totalHealth / population) * 100 : 0

    // Update progress bar
    progressBar.style.width = `${Math.min(percentage, 100)}%`
    progressBar.textContent = `${Math.round(percentage)}%`

    // Update color based on match
    if (totalHealth === population) {
      progressBar.style.background = "linear-gradient(90deg, #4CAF50, #8BC34A)"
      statusMessage.textContent = "Health status counts match the total population!"
      statusMessage.style.color = "#4CAF50"
      submitButton.disabled = false
    } else if (totalHealth > population) {
      progressBar.style.background = "#F44336"
      statusMessage.textContent = `Health status total (${totalHealth}) exceeds population (${population})!`
      statusMessage.style.color = "#F44336"
      submitButton.disabled = true
    } else {
      progressBar.style.background = "#FF9800"
      statusMessage.textContent = `Health status total (${totalHealth}) is less than population (${population})`
      statusMessage.style.color = "#FF9800"
      submitButton.disabled = true
    }

    // Set aria values for accessibility
    progressBar.setAttribute("aria-valuenow", percentage)
    progressBar.setAttribute("aria-valuemax", 100)
  }

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

  // Initialize health status validation on page load
  if (populationInput && healthStatusInputs.length) {
    validateHealthCounts()
  }

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
})
