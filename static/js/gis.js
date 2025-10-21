document.addEventListener("DOMContentLoaded", () => {
  // Declare L at the beginning of the script to ensure it's defined
  const L = window.L

  // Location search functionality
  const searchInput = document.getElementById("locationSearch")
  const searchButton = document.getElementById("searchButton")

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      performSearch()
    })

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })

    function performSearch() {
      const searchTerm = searchInput.value.trim()
      if (!searchTerm) return

      // Use Nominatim for geocoding (OpenStreetMap's free geocoding service)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            const result = data[0]
            const lat = Number.parseFloat(result.lat)
            const lon = Number.parseFloat(result.lon)

            // Center map on search result
            map.setView([lat, lon], 12)

            // Add a marker for the search result
            const searchMarker = L.marker([lat, lon], {
              icon: L.divIcon({
                className: "search-result-marker",
                html: '<i class="fas fa-search-location"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              }),
            }).addTo(map)

            // Add popup with info
            searchMarker.bindPopup(`<b>${result.display_name}</b>`).openPopup()

            // Remove marker after 5 seconds
            setTimeout(() => {
              map.removeLayer(searchMarker)
            }, 5000)
          } else {
            alert("Location not found. Please try a different search term.")
          }
        })
        .catch((error) => {
          console.error("Error searching for location:", error)
          alert("Error searching for location. Please try again.")
        })
    }
  }
  // Initialize the map centered on Negros Island, Philippines
  // Negros Island coordinates: approximately 10.0° N, 123.0° E
  const map = L.map("map", {
    center: [10.0, 123.0],
    zoom: 9,
    zoomControl: false, // We'll add custom controls
    attributionControl: false,
  })

  // Add attribution control to the bottom right
  L.control
    .attribution({
      position: "bottomright",
    })
    .addTo(map)

  // Add zoom control to the right
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map)

  // Map base layers - Using both OpenStreetMap and free Esri layers
  const baseLayers = {
    dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }),
    // Fix for dark-normal - using a different provider that doesn't require authentication
    "dark-normal": L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 20,
    }),
    // OpenStreetMap topographic layer
    topographic: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      maxZoom: 17,
    }),
    // Light theme
    light: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }),
    // Free Esri satellite imagery
    satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 19,
      },
    ),
    // Standard OpenStreetMap
    street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }),
  }

  // Set initial base layer (dark by default)
  let currentBaseLayer = "dark"
  baseLayers[currentBaseLayer].addTo(map)

  // Create layer groups for tree and seed markers
  const treeLayer = L.layerGroup().addTo(map)
  const seedLayer = L.layerGroup().addTo(map)
  
  // Debug: Log that layers are created
  console.log("Tree and seed layers created and added to map")

  // Create layer groups for additional layers - Fix for issue #12
  const additionalLayers = {
    heatmap: L.layerGroup(),
    protected: L.layerGroup(),
    landuse: L.layerGroup(),
    soil: L.layerGroup(),
  }

  // Add sample layers for demonstration
  // Heatmap layer (will be populated with actual data)
  const heatmapLayer = L.layerGroup()
  additionalLayers.heatmap = heatmapLayer

  // Protected areas layer (using a GeoJSON placeholder)
  const protectedAreasLayer = L.layerGroup()
  additionalLayers.protected = protectedAreasLayer

  // Land use layer
  const landUseLayer = L.layerGroup()
  additionalLayers.landuse = landUseLayer

  // Soil type layer
  const soilTypeLayer = L.layerGroup()
  additionalLayers.soil = soilTypeLayer

  // Populate layer controls
  const layerControlsList = document.getElementById("layerControlsList")

  // Define available layers
  const availableLayers = [
    { id: "heatmap", name: "Heatmap", active: false },
    { id: "protected", name: "Protected Areas", active: false },
    { id: "landuse", name: "Land Use", active: false },
    { id: "soil", name: "Soil Type", active: false },
  ]

  // Add layer controls to the UI
  availableLayers.forEach((layer) => {
    const layerItem = document.createElement("div")
    layerItem.className = "control-option"
    layerItem.innerHTML = `
            <input type="checkbox" id="layer-${layer.id}" value="${layer.id}" ${layer.active ? "checked" : ""}>
            <label for="layer-${layer.id}">${layer.name}</label>
        `
    layerControlsList.appendChild(layerItem)

    // Add event listener
    const checkbox = layerItem.querySelector(`#layer-${layer.id}`)
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        additionalLayers[layer.id].addTo(map)
      } else {
        map.removeLayer(additionalLayers[layer.id])
      }
    })

    // Add active layers to map
    if (layer.active) {
      additionalLayers[layer.id].addTo(map)
    }
  })

  // Create a container for the filtered tree data
  const filteredDataContainer = document.createElement("div")
  filteredDataContainer.className = "filtered-data-container"
  filteredDataContainer.style.display = "none"
  document.querySelector(".gis-container").appendChild(filteredDataContainer)

  // Color mapping for tree species
  const colorMap = {}
  const colorPalette = [
    "#FF5733", // Red-Orange
    "#33FF57", // Green
    "#3357FF", // Blue
    "#FF33A8", // Pink
    "#33FFF5", // Cyan
    "#FFD133", // Yellow
    "#8C33FF", // Purple
    "#FF8C33", // Orange
    "#33FFBD", // Mint
    "#FF3333", // Red
    "#33FF33", // Lime
    "#3333FF", // Deep Blue
    "#FF33FF", // Magenta
    "#33FFFF", // Aqua
    "#FFFF33", // Bright Yellow
    "#C733FF", // Violet
    "#FF5733", // Coral
    "#33FFA8", // Light Green
    "#A833FF", // Lavender
    "#FF33A8", // Hot Pink
  ]
  let colorIndex = 0

  // Load all trees and seeds by default
  Promise.all([loadTrees(), loadSeeds()])
    .then(() => {
      console.log("Initial data load complete")
      // Ensure seed layer is visible
      if (document.getElementById("showSeeds").checked) {
        console.log("Show seeds is checked, ensuring seed layer is visible")
        if (!map.hasLayer(seedLayer)) {
          map.addLayer(seedLayer)
          console.log("Seed layer added to map after initial load")
        }
      }
      
      // Test seed data loading
      setTimeout(() => {
        console.log("Testing seed data...")
        fetch("/api/seed-data/")
          .then(response => response.json())
          .then(data => {
            console.log("Test: Seed data loaded successfully", {
              featureCount: data.features ? data.features.length : 0,
              firstFeature: data.features && data.features.length > 0 ? data.features[0] : null
            })
          })
          .catch(error => {
            console.error("Test: Error loading seed data:", error)
          })
      }, 1000)
    })
    .catch((error) => {
      console.error("Error loading initial data:", error)
    })

  // Add a refresh button to manually reload tree data
  const refreshButton = document.createElement("button")
  refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data'
  refreshButton.className = "refresh-button"
  refreshButton.style.position = "absolute"
  refreshButton.style.top = "10px"
  refreshButton.style.right = "10px"
  refreshButton.style.zIndex = "1000"
  refreshButton.style.padding = "8px 12px"
  refreshButton.style.backgroundColor = "#4caf50"
  refreshButton.style.color = "white"
  refreshButton.style.border = "none"
  refreshButton.style.borderRadius = "4px"
  refreshButton.style.cursor = "pointer"

  refreshButton.addEventListener("click", () => {
    Promise.all([loadTrees(), loadSeeds()])
      .then(() => {
        // Hide the filtered data container when refreshing all data
        filteredDataContainer.style.display = "none"
        console.log("Data refreshed successfully")
        // Show a more visible notification
        const notification = document.createElement("div")
        notification.innerHTML = "🌱 Tree and seed data refreshed! Look for diamond-shaped markers."
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: bold;
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      })
      .catch((error) => {
        console.error("Error refreshing data:", error)
        alert("Error refreshing data. Please check the console for details.")
      })
  })

  document.querySelector(".gis-container").appendChild(refreshButton)


  // Map type control change event
  document.querySelectorAll('input[name="mapType"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      // Remove current base layer
      map.removeLayer(baseLayers[currentBaseLayer])

      // Add new base layer
      currentBaseLayer = this.value
      baseLayers[currentBaseLayer].addTo(map)
    })
  })

  // Tree filter change event
  document.querySelectorAll('input[name="treeFilter"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      const filterValue = this.value
      treeLayer.clearLayers()

      if (filterValue === "all") {
        loadTrees()
        // Hide the filtered data container
        filteredDataContainer.style.display = "none"
      } else {
        loadFilteredTrees(filterValue)
      }
    })
  })

  // Toggle control dropdowns
  document.querySelectorAll(".control-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const dropdown = this.nextElementSibling

      // Close all other dropdowns
      document.querySelectorAll(".control-dropdown").forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove("active")
        }
      })

      // Toggle this dropdown
      dropdown.classList.toggle("active")
    })
  })

  // Close dropdowns when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".control-group")) {
      document.querySelectorAll(".control-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active")
      })
    }
  })

  // Map tools functionality
  document.getElementById("centerMapBtn").addEventListener("click", () => {
    map.setView([10.0, 123.0], 9)
  })

  // Measure distance tool
  let measureControl = null
  document.getElementById("measureDistanceBtn").addEventListener("click", function () {
    if (measureControl) {
      // If measurement is active, remove it
      map.removeControl(measureControl)
      measureControl = null
      this.classList.remove("active")
    } else {
      // Activate measurement
      measureControl = L.control.measure({
        position: "topright",
        primaryLengthUnit: "kilometers",
        secondaryLengthUnit: "miles",
        primaryAreaUnit: "sqkilometers",
        secondaryAreaUnit: "acres",
      })
      measureControl.addTo(map)
      this.classList.add("active")
    }
  })

  // Draw polygon tool
  let drawControl = null
  document.getElementById("drawPolygonBtn").addEventListener("click", function () {
    if (drawControl) {
      // If drawing is active, remove it
      map.removeControl(drawControl)
      drawControl = null
      this.classList.remove("active")
    } else {
      // Activate drawing
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)

      drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
        },
        draw: {
          polygon: true,
          polyline: true,
          rectangle: true,
          circle: true,
          marker: true,
        },
      })
      map.addControl(drawControl)
      this.classList.add("active")

      map.on(L.Draw.Event.CREATED, (event) => {
        const layer = event.layer
        drawnItems.addLayer(layer)
      })
    }
  })

  // Export data tool
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    // Get visible trees
    fetch("/api/tree-data/")
      .then((response) => response.json())
      .then((data) => {
        // Convert to CSV
        let csv = "data:text/csv;charset=utf-8,"
        csv += "Common Name,Scientific Name,Family,Genus,Population,Latitude,Longitude,Year,Notes\n"

        data.features.forEach((feature) => {
          const p = feature.properties
          const coords = feature.geometry.coordinates
          csv += `"${p.common_name}","${p.scientific_name}","${p.family}","${p.genus}",${p.population},${coords[1]},${coords[0]},${p.year},"${p.notes}"\n`
        })

        // Create download link
        const encodedUri = encodeURI(csv)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "endemic_trees_data.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      .catch((error) => console.error("Error exporting data:", error))
  })

  // Function to load all trees
  function loadTrees() {
    // Clear existing tree markers
    treeLayer.clearLayers()

    // Add a console log to debug
    console.log("Loading all trees...")

    // Use the correct API endpoint
    fetch("/api/tree-data/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Tree data received:", data)
        addTreesToMap(data)

        // Also update heatmap if active
        if (map.hasLayer(additionalLayers.heatmap)) {
          updateHeatmap(data)
        }
      })
      .catch((error) => {
        console.error("Error loading trees:", error)
        alert("Error loading tree data. Please check the console for details.")
      })
  }

  // Function to load all seeds
  function loadSeeds() {
    // Clear existing seed markers
    seedLayer.clearLayers()

    // Add a console log to debug
    console.log("Loading all seeds...")

    // Use the correct API endpoint
    fetch("/api/seed-data/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Seed data received:", data)
        if (data.features && data.features.length > 0) {
          console.log("Seed features found:", data.features.length)
          // Log first few seed coordinates for debugging
          data.features.slice(0, 3).forEach((feature, index) => {
            console.log(`Seed ${index + 1}:`, {
              name: feature.properties.common_name,
              coords: feature.geometry.coordinates,
              status: feature.properties.germination_status
            })
          })
          addSeedsToMap(data)
          console.log(`Added ${data.features.length} seed markers to the map`)
        } else {
          console.log("No seed data found")
        }
      })
      .catch((error) => {
        console.error("Error loading seeds:", error)
        alert("Error loading seed data. Please check the console for details.")
      })
  }

  // Helper function to get color for germination status
  function getGerminationColor(status) {
    switch(status) {
      case 'not_germinated': return '#8B4513'
      case 'germinating': return '#9ACD32'
      case 'partially_germinated': return '#32CD32'
      case 'fully_germinated': return '#228B22'
      case 'failed': return '#A52A2A'
      default: return '#8B4513'
    }
  }

  // Function to add seed markers to the map
  function addSeedsToMap(geojson) {
    console.log("🔄 Using NEW seed marker creation method")
    try {
      // Check if we have features
      if (!geojson.features || geojson.features.length === 0) {
        console.log("No seed data found in the response")
        return
      }

      console.log(`Adding ${geojson.features.length} seeds to the map`)
      console.log("Seed layer visibility:", map.hasLayer(seedLayer))
      
      // Log first feature for debugging
      if (geojson.features.length > 0) {
        const firstFeature = geojson.features[0]
        console.log("First seed feature:", {
          coords: firstFeature.geometry.coordinates,
          properties: firstFeature.properties
        })
      }

    // Create markers manually to ensure they're proper Leaflet markers
    geojson.features.forEach((feature) => {
      try {
        const properties = feature.properties
        const coords = feature.geometry.coordinates
        const latlng = [coords[1], coords[0]] // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        
        // Get color based on germination status
        const status = properties.germination_status
        let color = "#8B4513" // Default brown color for seeds

        // Color based on germination status
        if (status === "not_germinated") {
          color = "#8B4513" // Brown
        } else if (status === "germinating") {
          color = "#9ACD32" // Yellow-green
        } else if (status === "partially_germinated") {
          color = "#32CD32" // Lime green
        } else if (status === "fully_germinated") {
          color = "#228B22" // Forest green
        } else if (status === "failed") {
          color = "#A52A2A" // Brown-red
        }

        // Create a larger diamond marker for seeds with better visibility
        const icon = L.divIcon({
          html: `<div style="width: 20px; height: 20px; background-color: ${color}; transform: rotate(45deg); border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); animation: pulse 2s infinite; z-index: 1000;"></div>`,
          className: "seed-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        
        // Create the marker
        const marker = L.marker(latlng, { icon: icon })
        
        // Format germination status for display
        const germinationStatus = properties.germination_status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
        
        // Format survival rate
        const survivalRate = properties.survival_rate !== null ? `${properties.survival_rate}%` : 'Not recorded'
        
        // Format dates
        const plantingDate = properties.planting_date ? new Date(properties.planting_date).toLocaleDateString() : 'Not set'
        const germinationDate = properties.germination_date ? new Date(properties.germination_date).toLocaleDateString() : 'Not applicable'
        const maturityDate = properties.expected_maturity_date ? new Date(properties.expected_maturity_date).toLocaleDateString() : 'Not set'

        // Create popup content with better formatting
        const popupContent = `
          <div class="tree-popup seed-popup">
            <h3>🌱 ${properties.common_name} Seeds</h3>
            <p><em>${properties.scientific_name}</em></p>
            <table class="popup-table">
              <tr><td><strong>Family:</strong></td><td>${properties.family}</td></tr>
              <tr><td><strong>Genus:</strong></td><td>${properties.genus}</td></tr>
              <tr><td><strong>Quantity Planted:</strong></td><td>${properties.quantity} seeds</td></tr>
              <tr><td><strong>Planting Date:</strong></td><td>${plantingDate}</td></tr>
              <tr><td><strong>Germination Status:</strong></td><td><span style="color: ${getGerminationColor(properties.germination_status)}; font-weight: bold;">${germinationStatus}</span></td></tr>
              <tr><td><strong>Germination Date:</strong></td><td>${germinationDate}</td></tr>
              <tr><td><strong>Survival Rate:</strong></td><td>${survivalRate}</td></tr>
              <tr><td><strong>Expected Maturity:</strong></td><td>${maturityDate}</td></tr>
              <tr><td><strong>Location:</strong></td><td>${properties.location}</td></tr>
            </table>
            ${properties.notes ? `<p class="popup-notes"><strong>Notes:</strong> ${properties.notes}</p>` : ""}
          </div>
        `

        // Bind popup to marker
        marker.bindPopup(popupContent)
        
        // Add marker to seed layer
        marker.addTo(seedLayer)
        
        console.log(`Added seed marker for ${properties.common_name} at [${latlng[0]}, ${latlng[1]}]`)
        
      } catch (error) {
        console.error(`Error creating marker for seed:`, error)
      }
    })
    
      console.log("Seed layer added to map, total layers:", seedLayer.getLayers().length)
      console.log("Seed layer is visible on map:", map.hasLayer(seedLayer))
      
      // Show success message
      console.log("✅ Seed markers successfully added to the map!")
      console.log("Look for diamond-shaped markers with pulsing animation")
      
      // Fit map to show all seed markers
      if (geojson.features.length > 0) {
        try {
          const latlngs = geojson.features.map(feature => {
            const coords = feature.geometry.coordinates
            return [coords[1], coords[0]] // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
          })
          const bounds = L.latLngBounds(latlngs)
          map.fitBounds(bounds, { padding: [20, 20] })
          console.log("Map fitted to seed bounds")
        } catch (e) {
          console.error("Error fitting map to seed bounds:", e)
        }
      }
    } catch (error) {
      console.error("Error in addSeedsToMap:", error)
      alert("Error adding seed markers to map. Please check the console for details.")
    }
  }

  // Function to load filtered trees
  function loadFilteredTrees(speciesId) {
    // Clear existing tree markers
    treeLayer.clearLayers()

    // Add a console log to debug
    console.log(`Loading filtered trees for species ID: ${speciesId}`)

    // Use the correct API endpoint
    fetch(`/api/filter-trees/${speciesId}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Filtered tree data received:", data)
        addTreesToMap(data)

        // Also update heatmap if active
        if (map.hasLayer(additionalLayers.heatmap)) {
          updateHeatmap(data)
        }

        // Display filtered data in the glass card
        if (data.features && data.features.length > 0) {
          displayFilteredData(data)
        } else {
          // If no features, show a message
          displayNoDataMessage(speciesId)
        }
      })
      .catch((error) => {
        console.error("Error loading filtered trees:", error)
        alert("Error loading filtered tree data. Please check the console for details.")
      })
  }

  // Function to display a message when no data is found
  function displayNoDataMessage(speciesId) {
    // Find the species name from the filter options
    let speciesName = "Selected species"
    const filterOption = document.querySelector(`#tree${speciesId}`)
    if (filterOption) {
      speciesName = filterOption.nextElementSibling.textContent
    }

    const html = `
      <div class="filtered-data-card">
        <div class="filtered-data-header">
          <h3>${speciesName}</h3>
        </div>
        <div class="filtered-data-body">
          <div class="data-section">
            <p class="no-data-message">No data available for this species.</p>
          </div>
        </div>
      </div>
    `

    filteredDataContainer.innerHTML = html
    filteredDataContainer.style.display = "block"
  }

  // Function to display filtered data in a glass card
  function displayFilteredData(data) {
    if (!data.features || data.features.length === 0) return

    // Get the first feature to extract species info
    const firstFeature = data.features[0]
    const commonName = firstFeature.properties.common_name
    const scientificName = firstFeature.properties.scientific_name
    const family = firstFeature.properties.family
    const genus = firstFeature.properties.genus

    // Calculate total population
    let totalPopulation = 0
    const healthCounts = {
      very_poor: 0,
      poor: 0,
      good: 0,
      very_good: 0,
      excellent: 0,
    }
    const yearData = {}

    data.features.forEach((feature) => {
      const props = feature.properties
      totalPopulation += props.population

      // Count health statuses
      if (props.health_status in healthCounts) {
        healthCounts[props.health_status]++
      }

      // Group by year
      if (props.year in yearData) {
        yearData[props.year].count++
        yearData[props.year].population += props.population
      } else {
        yearData[props.year] = {
          count: 1,
          population: props.population,
        }
      }
    })

    // Create the HTML for the filtered data card
    let html = `
    <div class="filtered-data-card">
      <div class="filtered-data-header">
        <h3>${commonName}</h3>
        <p class="scientific-name">${scientificName}</p>
      </div>
      <div class="filtered-data-body">
        <div class="data-section">
          <h4>Taxonomy</h4>
          <div class="data-row">
            <span class="data-label">Family:</span>
            <span class="data-value">${family}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Genus:</span>
            <span class="data-value">${genus}</span>
          </div>
        </div>

        <div class="data-section">
          <h4>Population</h4>
          <div class="data-row">
            <span class="data-label">Total:</span>
            <span class="data-value">${totalPopulation}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Records:</span>
            <span class="data-value">${data.features.length}</span>
          </div>
        </div>

        <div class="data-section">
          <h4>Health Status</h4>
          <div class="health-bars">
  `

    // Add health status bars
    const healthLabels = {
      very_poor: "Very Poor",
      poor: "Poor",
      good: "Good",
      very_good: "Very Good",
      excellent: "Excellent",
    }

    const healthColors = {
      very_poor: "#e74a3b",
      poor: "#f6c23e",
      good: "#36b9cc",
      very_good: "#1cc88a",
      excellent: "#4e73df",
    }

    for (const [status, count] of Object.entries(healthCounts)) {
      if (count > 0) {
        const percentage = Math.round((count / data.features.length) * 100)
        html += `
        <div class="health-bar-container">
          <div class="health-bar-label">${healthLabels[status]}</div>
          <div class="health-bar">
            <div class="health-bar-fill" style="width: ${percentage}%; background-color: ${healthColors[status]}"></div>
          </div>
          <div class="health-bar-value">${percentage}%</div>
        </div>
      `
      }
    }

    html += `
          </div>
        </div>

        <div class="data-section">
          <h4>Yearly Distribution</h4>
          <div class="year-distribution">
  `

    // Add year distribution
    const years = Object.keys(yearData).sort()
    years.forEach((year) => {
      const yearInfo = yearData[year]
      html += `
      <div class="year-item">
        <div class="year-label">${year}</div>
        <div class="year-count">${yearInfo.count} records</div>
        <div class="year-population">${yearInfo.population} population</div>
      </div>
    `
    })

    html += `
          </div>
        </div>
      </div>
    </div>
  `

    // Update the container and show it
    filteredDataContainer.innerHTML = html
    filteredDataContainer.style.display = "block"
  }

  // Function to get color for a tree species
  function getColorForSpecies(commonName) {
    if (!colorMap[commonName]) {
      colorMap[commonName] = colorPalette[colorIndex % colorPalette.length]
      colorIndex++
    }
    return colorMap[commonName]
  }

  // Function to add tree markers to the map
  function addTreesToMap(geojson) {
    if (!geojson.features || geojson.features.length === 0) {
      console.log("No tree data found in the response")
      return
    }

    const geoJsonLayer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const color = getColorForSpecies(feature.properties.common_name)
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 1.0,
        })
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties
        const __pos = typeof layer.getLatLng === 'function' ? layer.getLatLng() : { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] }

        const imageHtml = p.image_url ? `<div style="margin:8px 0"><img src="${p.image_url}" alt="${p.common_name}" style="max-width:220px;border-radius:6px"></div>` : ''
        const popupContent = `
          <div class="tree-popup">
            <h3>${p.common_name}</h3>
            <p><em>${p.scientific_name}</em></p>
            ${imageHtml}
            <table class="popup-table">
              <tr><td>Family:</td><td>${p.family}</td></tr>
              <tr><td>Genus:</td><td>${p.genus}</td></tr>
              <tr><td>Population:</td><td>${p.population}</td></tr>
              <tr><td>Health Status:</td><td>${p.health_status.replace(/_/g, " ")}</td></tr>
              <tr><td>Health Distribution:</td><td>
                <div class="health-distribution">
                  <div class="health-count">Healthy: ${p.healthy_count ?? 0}</div>
                  <div class="health-count">Good: ${p.good_count ?? 0}</div>
                  <div class="health-count">Bad: ${p.bad_count ?? 0}</div>
                  <div class="health-count">Deceased: ${p.deceased_count ?? 0}</div>
                </div>
              </td></tr>
              <tr><td>Year:</td><td>${p.year}</td></tr>
              <tr><td>Location:</td><td>${p.location} (${Number(__pos.lat).toFixed(6)}, ${Number(__pos.lng).toFixed(6)})</td></tr>
            </table>
            ${p.notes ? `<p class="popup-notes">${p.notes}</p>` : ""}
          </div>
        `
        layer.bindPopup(popupContent)
      },
    }).addTo(treeLayer)

    try { map.fitBounds(geoJsonLayer.getBounds()) } catch (e) { console.error('Error fitting bounds:', e) }
    updateLegend()
  }

  // Function to update heatmap
  function updateHeatmap(geojson) {
    // Clear existing heatmap
    additionalLayers.heatmap.clearLayers()

    // Extract points for heatmap
    const heatPoints = []
    geojson.features.forEach((feature) => {
      const coords = feature.geometry.coordinates
      const intensity = feature.properties.population
      heatPoints.push([coords[1], coords[0], intensity / 10]) // lat, lng, intensity
    })

    // Create heatmap layer
    if (heatPoints.length > 0) {
      const heat = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.4: "blue", 0.65: "lime", 1: "red" },
      })
      additionalLayers.heatmap.addLayer(heat)
    }
  }

  // Create a legend for tree species
  const legend = L.control({ position: "bottomleft" })

  legend.onAdd = (map) => {
    const div = L.DomUtil.create("div", "info legend")
    div.innerHTML = "<h4>Tree Species</h4>"

    // We'll populate this dynamically as trees are added
    div.setAttribute("id", "species-legend")
    return div
  }

  legend.addTo(map)

  // Function to update the legend
  function updateLegend() {
    const legendDiv = document.getElementById("species-legend")
    if (!legendDiv) return

    let legendContent = "<h4>Tree Species</h4>"

    for (const [species, color] of Object.entries(colorMap)) {
      legendContent += `
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${color}"></span>
          <span class="legend-label">${species}</span>
        </div>
      `
    }

    // Add germination status legend
    legendContent += `
    <div class="germination-legend">
      <h4>🌱 Seed Status</h4>
      <div class="germination-item">
        <span class="germination-color" style="background-color: #8B4513"></span>
        <span class="germination-label">Not Germinated</span>
      </div>
      <div class="germination-item">
        <span class="germination-color" style="background-color: #9ACD32"></span>
        <span class="germination-label">Germinating</span>
      </div>
      <div class="germination-item">
        <span class="germination-color" style="background-color: #32CD32"></span>
        <span class="germination-label">Partially Germinated</span>
      </div>
      <div class="germination-item">
        <span class="germination-color" style="background-color: #228B22"></span>
        <span class="germination-label">Fully Germinated</span>
      </div>
      <div class="germination-item">
        <span class="germination-color" style="background-color: #A52A2A"></span>
        <span class="germination-label">Failed</span>
      </div>
    </div>
  `

    legendDiv.innerHTML = legendContent
  }

  // Entity type control change event
  document.getElementById("showTrees").addEventListener("change", function () {
    if (this.checked) {
      map.addLayer(treeLayer)
    } else {
      map.removeLayer(treeLayer)
    }
  })

  document.getElementById("showSeeds").addEventListener("change", function () {
    console.log("Show seeds checkbox changed:", this.checked)
    if (this.checked) {
      map.addLayer(seedLayer)
      console.log("Seed layer added to map")
    } else {
      map.removeLayer(seedLayer)
      console.log("Seed layer removed from map")
    }
  })
})

