document.addEventListener("DOMContentLoaded", () => {
  // Check if there's a hash in URL to open specific tab (for error redirects)
  const hash = window.location.hash
  let defaultTab = "csv-upload"
  if (hash) {
    const tabId = hash.substring(1) // Remove the #
    if (tabId === "csv-upload" || tabId === "manual-entry" || tabId === "manage-taxonomy") {
      defaultTab = tabId
    }
  }
  
  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")

  // Function to switch tabs
  function switchTab(tabId) {
      // Update active tab button
    tabButtons.forEach((btn) => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

      // Show selected tab content, hide others
      tabContents.forEach((content) => {
        if (content.id === tabId) {
          content.style.display = "block"
          // Add a small delay before showing for animation effect
          setTimeout(() => {
            content.style.opacity = "1"
          }, 50)
          
          // Load taxonomy list if switching to manage-taxonomy tab
          if (tabId === "manage-taxonomy" && typeof loadTaxonomyList === 'function') {
            setTimeout(() => {
              loadTaxonomyList()
            }, 100)
          }
        } else {
          content.style.display = "none"
          content.style.opacity = "0"
        }
      })
    
    // Update URL hash without scrolling
    if (history.pushState) {
      history.pushState(null, null, '#' + tabId)
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab")
      switchTab(tabId)
    })
  })
  
  // Switch to default tab on page load
  if (defaultTab !== "csv-upload") {
    switchTab(defaultTab)
  } else {
    // Ensure CSV upload tab is active by default
    switchTab("csv-upload")
  }

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

  // CSV Upload - simple form submission without progress bar
  const csvUploadForm = document.getElementById("csv-upload-form")

  if (csvUploadForm) {
    csvUploadForm.addEventListener("submit", function (e) {
      const fileInput = document.getElementById("csv_file")
      
      if (!fileInput || !fileInput.files.length) {
        e.preventDefault()
        alert("Please select a CSV file to upload")
        return false
      }
      
      // Form will submit normally - no AJAX, no progress bar
      return true
    })
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
    const errorMessages = []

    // Special validation for common name - must be selected from dropdown
    const commonNameInput = document.getElementById("common_name")
    if (commonNameInput && form.id === "manual-entry-form") {
      const commonNameValue = commonNameInput.value.trim()
      const selectedFromDropdown = commonNameInput.dataset.selectedFromDropdown === 'true'
      
      if (!commonNameValue) {
        isValid = false
        commonNameInput.classList.add("error")
        let errorMsg = commonNameInput.parentElement.querySelector(".error-message")
        if (!errorMsg) {
          errorMsg = document.createElement("div")
          errorMsg.className = "error-message"
          errorMsg.style.color = "#f44336"
          errorMsg.style.fontSize = "0.875rem"
          errorMsg.style.marginTop = "0.25rem"
          commonNameInput.parentElement.appendChild(errorMsg)
        }
        errorMsg.textContent = "Common Name is required"
        errorMessages.push("Common Name is required")
      } else if (!selectedFromDropdown) {
        isValid = false
        commonNameInput.classList.add("error")
        let errorMsg = commonNameInput.parentElement.querySelector(".error-message")
        if (!errorMsg) {
          errorMsg = document.createElement("div")
          errorMsg.className = "error-message"
          errorMsg.style.color = "#f44336"
          errorMsg.style.fontSize = "0.875rem"
          errorMsg.style.marginTop = "0.25rem"
          commonNameInput.parentElement.appendChild(errorMsg)
        }
        errorMsg.textContent = "Please select a Common Name from the dropdown suggestions"
        errorMessages.push("Please select a Common Name from the dropdown suggestions")
      } else {
        commonNameInput.classList.remove("error")
        const errorMsg = commonNameInput.parentElement.querySelector(".error-message")
        if (errorMsg) {
          errorMsg.remove()
        }
      }
    }

    // Validate all required fields (except Notes)
    requiredFields.forEach((field) => {
      // Skip Notes field
      if (field.id === 'notes' || field.name === 'notes') {
        return
      }
      
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
          const fieldLabel = field.closest('.form-group')?.querySelector('label')?.textContent || field.name
          errorMessages.push(`${fieldLabel} is required`)
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
            errorMsg.style.color = "#f44336"
            errorMsg.style.fontSize = "0.875rem"
            errorMsg.style.marginTop = "0.25rem"
            errorMsg.textContent = "This field is required"
            field.parentElement.appendChild(errorMsg)
          }
          
          const fieldLabel = field.closest('.form-group')?.querySelector('label')?.textContent || field.name
          if (!errorMessages.includes(`${fieldLabel} is required`)) {
            errorMessages.push(`${fieldLabel} is required`)
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

    // Show alert with all errors if validation fails
    if (!isValid && errorMessages.length > 0) {
      alert("Please fix the following errors:\n\n" + errorMessages.join("\n"))
    }

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
    
    // Initialize autocomplete dropdown for Common Name
    initializeCommonNameAutocomplete()
  } else {
    console.log("Tree auto-population: Not all form fields found, skipping setup")
  }

  // Initialize taxonomy management if tab exists
  if (document.getElementById("manage-taxonomy")) {
    initializeTaxonomyManagement()
  }
})

// Autocomplete dropdown for Common Name
let autocompleteSuggestions = []
let selectedSuggestionIndex = -1
let userSelectedFromDropdown = false

function initializeCommonNameAutocomplete() {
  const commonNameInput = document.getElementById("common_name")
  const suggestionsContainer = document.getElementById("commonNameSuggestions")
  
  if (!commonNameInput || !suggestionsContainer) return

  // Load suggestions from API
  loadAutocompleteSuggestions()

  // Handle input
  commonNameInput.addEventListener('input', function(e) {
    const value = this.value.trim()
    userSelectedFromDropdown = false
    // Clear the flag when user types (not selecting from dropdown)
    this.dataset.selectedFromDropdown = 'false'
    
    if (value.length === 0) {
      suggestionsContainer.style.display = 'none'
      selectedSuggestionIndex = -1
      // Clear the flag when field is empty
      this.dataset.selectedFromDropdown = 'false'
      return
    }

    // Filter suggestions
    const filtered = autocompleteSuggestions.filter(tree => 
      tree.common_name.toLowerCase().includes(value.toLowerCase())
    )

    if (filtered.length > 0) {
      displaySuggestions(filtered, suggestionsContainer)
    } else {
      suggestionsContainer.style.display = 'none'
    }
  })

  // Handle focus out - clear if not selected
  commonNameInput.addEventListener('blur', function(e) {
    // Check if the blur was caused by clicking on a suggestion
    const relatedTarget = e.relatedTarget || document.activeElement
    const clickedSuggestion = relatedTarget && relatedTarget.closest('.autocomplete-suggestion')
    
    // If clicking on a suggestion, don't clear - let the click handler do its work
    if (clickedSuggestion) {
      return
    }
    
    // Delay to allow click on suggestion
    setTimeout(() => {
      // Double-check that user didn't select from dropdown (in case click happened)
      if (!userSelectedFromDropdown && this.value.trim()) {
        // Check if value matches any suggestion exactly
        const exactMatch = autocompleteSuggestions.find(tree => 
          tree.common_name.toLowerCase() === this.value.trim().toLowerCase()
        )
        
        if (!exactMatch) {
          // Clear the field if user didn't select from dropdown
          this.value = ''
          this.dataset.selectedFromDropdown = 'false'
          suggestionsContainer.style.display = 'none'
          
          // Clear auto-filled fields
          const scientificNameInput = document.getElementById("scientific_name")
          const familyInput = document.getElementById("family")
          const genusInput = document.getElementById("genus")
          
          if (scientificNameInput && scientificNameInput.dataset.autoFilled === 'true') {
            scientificNameInput.value = ''
            scientificNameInput.dataset.autoFilled = 'false'
          }
          if (familyInput && familyInput.dataset.autoFilled === 'true') {
            familyInput.value = ''
            familyInput.dataset.autoFilled = 'false'
          }
          if (genusInput && genusInput.dataset.autoFilled === 'true') {
            genusInput.value = ''
            genusInput.dataset.autoFilled = 'false'
          }
        } else {
          // If exact match found, mark as selected from dropdown
          this.dataset.selectedFromDropdown = 'true'
        }
      }
      suggestionsContainer.style.display = 'none'
      selectedSuggestionIndex = -1
      // Reset the flag after processing
      userSelectedFromDropdown = false
    }, 250)
  })

  // Handle keyboard navigation
  commonNameInput.addEventListener('keydown', function(e) {
    const suggestions = suggestionsContainer.querySelectorAll('.autocomplete-suggestion')
    
    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1)
      updateSelectedSuggestion(suggestions)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1)
      updateSelectedSuggestion(suggestions)
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[selectedSuggestionIndex]
      if (selected) {
        // Get the tree data from the filtered suggestions
        const filtered = autocompleteSuggestions.filter(tree => 
          tree.common_name.toLowerCase().includes(this.value.trim().toLowerCase())
        )
        const treeData = filtered[selectedSuggestionIndex]
        selectSuggestion(selected, treeData)
      }
    } else if (e.key === 'Escape') {
      suggestionsContainer.style.display = 'none'
      selectedSuggestionIndex = -1
    }
  })
}

function loadAutocompleteSuggestions() {
  fetch("/api/endemic-trees-list/")
    .then(response => response.json())
    .then(data => {
      if (data.success && data.trees) {
        autocompleteSuggestions = data.trees
        console.log(`Loaded ${autocompleteSuggestions.length} suggestions for autocomplete`)
      }
    })
    .catch(error => {
      console.error("Error loading autocomplete suggestions:", error)
    })
}

function displaySuggestions(suggestions, container) {
  container.innerHTML = ''
  selectedSuggestionIndex = -1
  
  suggestions.slice(0, 10).forEach((tree, index) => {
    const div = document.createElement('div')
    div.className = 'autocomplete-suggestion'
    div.dataset.index = index
    // Store the tree data in the element for easy access
    div.dataset.commonName = tree.common_name
    div.dataset.scientificName = tree.scientific_name
    div.dataset.family = tree.family || ''
    div.dataset.genus = tree.genus || ''
    div.innerHTML = `<strong>${tree.common_name}</strong> <em>(${tree.scientific_name})</em>`
    
    div.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      selectSuggestion(div, tree)
    })
    
    div.addEventListener('mousedown', (e) => {
      // Prevent blur event from firing when clicking suggestion
      e.preventDefault()
    })
    
    div.addEventListener('mouseenter', () => {
      selectedSuggestionIndex = index
      updateSelectedSuggestion(container.querySelectorAll('.autocomplete-suggestion'))
    })
    
    container.appendChild(div)
  })
  
  container.style.display = 'block'
}

function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((suggestion, index) => {
    if (index === selectedSuggestionIndex) {
      suggestion.classList.add('selected')
    } else {
      suggestion.classList.remove('selected')
    }
  })
}

function selectSuggestion(suggestionElement, treeData) {
  const commonNameInput = document.getElementById("common_name")
  const suggestionsContainer = document.getElementById("commonNameSuggestions")
  
  if (!commonNameInput || !suggestionsContainer) {
    console.error("Common name input or suggestions container not found")
    return
  }
  
  // Get common name from treeData or data attribute
  const commonName = treeData ? treeData.common_name : (suggestionElement.dataset.commonName || '')
  
  if (!commonName) {
    console.error("Could not extract common name from suggestion")
    return
  }
  
  // Set the flag BEFORE setting the value to prevent blur handler from clearing it
  userSelectedFromDropdown = true
  
  // Set the common name value with correct capitalization
  commonNameInput.value = commonName
  
  // Mark that this value was selected from dropdown (for validation)
  commonNameInput.dataset.selectedFromDropdown = 'true'
  
  // Hide suggestions
  suggestionsContainer.style.display = 'none'
  selectedSuggestionIndex = -1
  
  // Focus back on the input to trigger auto-populate
  commonNameInput.focus()
  
  // Trigger input event to auto-populate other fields
  const inputEvent = new Event('input', { bubbles: true })
  commonNameInput.dispatchEvent(inputEvent)
  
  // Also trigger a change event
  const changeEvent = new Event('change', { bubbles: true })
  commonNameInput.dispatchEvent(changeEvent)
  
  console.log("Selected suggestion:", commonName)
}

// Taxonomy Management
let editingTaxonomyId = null

function initializeTaxonomyManagement() {
  // Load taxonomy list on tab show
  const taxonomyTab = document.querySelector('[data-tab="manage-taxonomy"]')
  if (taxonomyTab) {
    taxonomyTab.addEventListener('click', () => {
      loadTaxonomyList()
    })
  }
  
  // Handle taxonomy form submission
  const taxonomyForm = document.getElementById("taxonomy-form")
  if (taxonomyForm) {
    taxonomyForm.addEventListener('submit', function(e) {
      e.preventDefault()
      
      const formData = new FormData(this)
      const submitButton = this.querySelector('button[type="submit"]')
      const isEditing = editingTaxonomyId !== null
      const url = isEditing ? `/api/update-taxonomy/${editingTaxonomyId}/` : "/api/add-taxonomy/"
      const successMessage = isEditing ? 'Taxonomy updated successfully!' : 'Taxonomy added successfully!'
      
      fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(successMessage)
          this.reset()
          editingTaxonomyId = null
          resetTaxonomyFormButton()
          loadTaxonomyList()
          // Reload autocomplete suggestions
          loadAutocompleteSuggestions()
        } else {
          alert('Error: ' + (data.error || 'Failed to save taxonomy'))
        }
      })
      .catch(error => {
        console.error("Error saving taxonomy:", error)
        alert('Error saving taxonomy. Please check console for details.')
      })
    })
  }
  
  // Clear taxonomy form
  const clearBtn = document.getElementById("clear-taxonomy-form")
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      document.getElementById("taxonomy-form").reset()
      editingTaxonomyId = null
      resetTaxonomyFormButton()
    })
  }
  
  // Load initial taxonomy list if tab is active (check both display style and active class)
  const manageTaxonomyTab = document.getElementById("manage-taxonomy")
  const manageTaxonomyButton = document.querySelector('[data-tab="manage-taxonomy"]')
  if (manageTaxonomyTab && manageTaxonomyButton && 
      (manageTaxonomyTab.style.display !== 'none' || manageTaxonomyButton.classList.contains('active'))) {
    loadTaxonomyList()
  }
}

function loadTaxonomyList() {
  const container = document.getElementById("taxonomy-list-container")
  if (!container) return
  
  container.innerHTML = '<div class="text-center" style="padding: 2rem;"><p>Loading taxonomy entries...</p></div>'
  
  fetch("/api/list-taxonomy/")
    .then(response => response.json())
    .then(data => {
      if (data.success && data.taxonomy) {
        displayTaxonomyList(data.taxonomy, container)
      } else {
        container.innerHTML = '<div class="text-center" style="padding: 2rem;"><p>No taxonomy entries found.</p></div>'
      }
    })
    .catch(error => {
      console.error("Error loading taxonomy:", error)
      container.innerHTML = '<div class="text-center" style="padding: 2rem;"><p style="color: #f44336;">Error loading taxonomy entries.</p></div>'
    })
}

function displayTaxonomyList(taxonomy, container) {
  if (taxonomy.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 2rem;"><p>No taxonomy entries found. Add your first entry above.</p></div>'
    return
  }
  
  let html = `
    <table class="taxonomy-table">
      <thead>
        <tr>
          <th>Common Name</th>
          <th>Scientific Name</th>
          <th>Family</th>
          <th>Genus</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `
  
  taxonomy.forEach(item => {
    html += `
      <tr>
        <td>${item.common_name}</td>
        <td><em>${item.scientific_name}</em></td>
        <td>${item.family}</td>
        <td>${item.genus}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="editTaxonomy(${item.id}, '${item.common_name.replace(/'/g, "\\'")}', '${item.scientific_name.replace(/'/g, "\\'")}', '${item.family.replace(/'/g, "\\'")}', '${item.genus.replace(/'/g, "\\'")}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteTaxonomy(${item.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `
  })
  
  html += `
      </tbody>
    </table>
  `
  
  container.innerHTML = html
}

function editTaxonomy(id, commonName, scientificName, family, genus) {
  // Populate form fields
  document.getElementById("taxonomy_common_name").value = commonName
  document.getElementById("taxonomy_scientific_name").value = scientificName
  document.getElementById("taxonomy_family").value = family
  document.getElementById("taxonomy_genus").value = genus
  
  // Set editing mode
  editingTaxonomyId = id
  
  // Update form button
  const submitButton = document.querySelector('#taxonomy-form button[type="submit"]')
  if (submitButton) {
    submitButton.innerHTML = '<i class="fas fa-save"></i> Update Taxonomy'
    submitButton.classList.remove('btn-primary')
    submitButton.classList.add('btn-success')
  }
  
  // Scroll to form
  document.getElementById("taxonomy-form").scrollIntoView({ behavior: 'smooth', block: 'start' })
  
  // Focus on first field
  document.getElementById("taxonomy_common_name").focus()
}

function resetTaxonomyFormButton() {
  const submitButton = document.querySelector('#taxonomy-form button[type="submit"]')
  if (submitButton) {
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Taxonomy'
    submitButton.classList.remove('btn-success')
    submitButton.classList.add('btn-primary')
  }
}

function deleteTaxonomy(id) {
  if (!confirm('Are you sure you want to delete this taxonomy entry?')) {
    return
  }
  
  fetch(`/api/delete-taxonomy/${id}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Taxonomy deleted successfully!')
      loadTaxonomyList()
      // Reload autocomplete suggestions
      loadAutocompleteSuggestions()
    } else {
      alert('Error: ' + (data.error || 'Failed to delete taxonomy'))
    }
  })
  .catch(error => {
    console.error("Error deleting taxonomy:", error)
    alert('Error deleting taxonomy. Please check console for details.')
  })
}
