document.addEventListener("DOMContentLoaded", () => {
  // Check if Leaflet is loaded
  if (typeof window.L === 'undefined') {
    console.error("❌ Leaflet is not loaded! Please check if the Leaflet script is included.")
    alert("Error: Map library not loaded. Please refresh the page.")
    return
  }
  
  // Declare L at the beginning of the script to ensure it's defined
  const L = window.L
  
  // Check if leaflet-heat is loaded
  if (typeof L.heatLayer === 'undefined') {
    console.error("❌ Leaflet Heat plugin is not loaded! Heatmap functionality will not work.")
  } else {
    console.log("✅ Leaflet Heat plugin is loaded and ready")
  }

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
  const mapContainer = document.getElementById("map")
  if (!mapContainer) {
    console.error("❌ Map container not found!")
    alert("Error: Map container not found. Please refresh the page.")
    return
  }

  console.log("✅ Map container found, initializing map...")
  
  let map
  try {
    map = L.map("map", {
      center: [10.0, 123.0],
      zoom: 9,
      zoomControl: false, // We'll add custom controls
      attributionControl: false,
    })

    console.log("✅ Map object created successfully")
  } catch (error) {
    console.error("❌ Error initializing map:", error)
    alert("Error initializing map: " + error.message)
    return
  }

  // Invalidate map size to ensure proper rendering
  setTimeout(() => {
    if (map) {
      map.invalidateSize()
      console.log("✅ Map initialized and size invalidated")
    }
  }, 100)

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

  // Map base layers - Using both OpenStreetMap and free Esri/Stadia layers
  const baseLayers = {
    dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }),
    // Streets (Night) - Esri Dark Gray Base + Reference labels
    "streets-night": L.layerGroup([
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: 'Basemap &copy; Esri',
          maxZoom: 19,
        }
      ),
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: 'Labels &copy; Esri',
          maxZoom: 19,
        }
      ),
    ]),
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
    // Esri Imagery Hybrid (Imagery + Label overlays)
    "imagery-hybrid": L.layerGroup([
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Imagery &copy; Esri",
          maxZoom: 19,
        }
      ),
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Labels &copy; Esri",
          maxZoom: 19,
        }
      ),
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Transportation &copy; Esri",
          maxZoom: 19,
        }
      ),
    ]),
    // Standard OpenStreetMap
    street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }),
  }

  // Set initial base layer (dark by default)
  let currentBaseLayer = "dark"
  
  // Add base layer to map
  try {
    baseLayers[currentBaseLayer].addTo(map)
    console.log("✅ Base layer added to map")
    
    // Ensure map renders properly - multiple attempts to handle timing issues
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
        console.log("✅ Map size invalidated (first attempt)")
      }
    }, 100)
    
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
        console.log("✅ Map size invalidated (second attempt)")
        // Force a view reset to ensure tiles load
        map.setView(map.getCenter(), map.getZoom())
      }
    }, 500)
  } catch (error) {
    console.error("❌ Error adding base layer:", error)
  }

  // Create layer groups for tree and seed markers
  const treeLayer = L.layerGroup().addTo(map)
  const seedLayer = L.layerGroup().addTo(map)
  
  // Debug: Log that layers are created
  console.log("Tree and seed layers created and added to map")

  // Create layer groups for additional layers - Fix for issue #12
  const additionalLayers = {
    heatmap: L.layerGroup(),
  }

  // Object to store custom layers from database
  const customLayers = {}

  // Add sample layers for demonstration
  // Heatmap layer (will be populated with actual data)
  const heatmapLayer = L.layerGroup()
  additionalLayers.heatmap = heatmapLayer

  // Populate layer controls
  const layerControlsList = document.getElementById("layerControlsList")

  // Define available layers
  const availableLayers = [
    { id: "heatmap", name: "Heatmap", active: false },
  ]

  // (Removed) Local import helpers moved to Layer Control page

  // Load custom layers from database
  fetch('/api/layers/', {
    cache: 'no-store', // Prevent caching to always get latest layer settings
    credentials: 'same-origin' // Include session cookies for authentication
  })
    .then(response => {
      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error loading custom layers:', error);
      // Don't block map initialization if layers fail to load
      return { layers: [] };
    })
    .then(data => {
      console.log('Loaded custom layers:', data);
      if (data.layers && data.layers.length > 0) {
        console.log('Layer details:');
        data.layers.forEach(layer => {
          console.log(`  - ${layer.name}: is_default=${layer.is_default}, is_active=${layer.is_active}`);
        });
        
        // Iterate all layers; show controls for all, add to map per flags
        console.log(`Loaded ${data.layers.length} layers from server`);
        data.layers.forEach(layer => {
          console.log(`Processing layer: ${layer.name} (id: ${layer.id})`);
          console.log(`  - is_active: ${layer.is_active}`);
          console.log(`  - is_default: ${layer.is_default}`);
          console.log(`  - layer_type: ${layer.layer_type}`);
          console.log(`  - url: ${layer.url}`);

          // Convert ArcGIS URLs if needed
          let layerUrl = layer.url;
          if (layerUrl && typeof layerUrl === 'string' && layerUrl.includes('MapServer') && !layerUrl.includes('{z}')) {
            layerUrl = layerUrl.replace(/\/MapServer.*$/, '/MapServer/tile/{z}/{y}/{x}');
          }

          // Create Leaflet layer based on URL type
          let leafletLayer;
          if (layerUrl && layerUrl.includes('{z}') && layerUrl.includes('{x}') && layerUrl.includes('{y}')) {
            // Tile layer
            leafletLayer = L.tileLayer(layerUrl, {
              attribution: layer.attribution || '',
              maxZoom: 19
            });
          } else if (layerUrl && (layerUrl.endsWith('.json') || layerUrl.endsWith('.geojson'))) {
            // GeoJSON layer
            leafletLayer = L.layerGroup();
            fetch(layerUrl)
              .then(r => r.json())
              .then(geojson => {
                L.geoJSON(geojson).addTo(leafletLayer);
              })
              .catch(err => console.error('Error loading GeoJSON:', err));
          } else if (layerUrl && layerUrl.startsWith('data:application/json')) {
            // Embedded data URL GeoJSON
            try {
              const base64 = layerUrl.split(',')[1]
              const jsonStr = decodeURIComponent(escape(atob(base64)))
              const geojson = JSON.parse(jsonStr)
              leafletLayer = L.layerGroup();
              L.geoJSON(geojson).addTo(leafletLayer)
            } catch (e) {
              console.error('Error parsing embedded GeoJSON data URL:', e)
            }
          }

          if (leafletLayer) {
            // Store the layer
            customLayers[layer.id] = {
              layer: leafletLayer,
              info: layer
            };

            // Add to map only if it's marked as default (show by default on map)
            if (layer.is_default) {
              console.log('Adding layer to map:', layer.name,
                         '(default:', layer.is_default, ', active:', layer.is_active, ')');

              // Check if layer is already on the map to prevent duplicates
              if (!map.hasLayer(leafletLayer)) {
                leafletLayer.addTo(map);
              } else {
                console.log('Layer already on map, skipping:', layer.name);
              }
            }

            // Add to available layers list (show all)
            availableLayers.push({
              id: `custom-${layer.id}`,
              name: layer.name,
              active: !!layer.is_active,
              custom: true,
              layerId: layer.id
            });
          }
        });

        // Render all layers after custom ones are loaded
        renderLayerControls();
      } else {
        // No custom layers, just render default ones
        renderLayerControls();
      }
    })
    .catch(error => {
      console.error('Error loading custom layers:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        url: '/api/layers/'
      });
      // Render default layers even if custom layers fail to load
      renderLayerControls();
    });

  // Function to render layer controls
  function renderLayerControls() {
    // Clear existing controls
    layerControlsList.innerHTML = '';
    
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
        // Handle custom layers
        if (layer.custom && customLayers[layer.layerId]) {
          customLayers[layer.layerId].layer.addTo(map);
        }
        // Handle predefined layers  
        else if (layer.id === 'heatmap') {
          // Load tree data and create heatmap
          fetch("/api/tree-data/", {
            credentials: 'same-origin' // Include session cookies for authentication
          })
            .then((response) => response.json())
            .then((data) => {
              updateHeatmap(data)
              additionalLayers[layer.id].addTo(map)
            })
            .catch((error) => {
              console.error("Error loading data for heatmap:", error)
            })
        } else {
          additionalLayers[layer.id].addTo(map)
        }
      } else {
        // Handle custom layers
        if (layer.custom && customLayers[layer.layerId]) {
          map.removeLayer(customLayers[layer.layerId].layer);
        }
        // Handle predefined layers
        else if (additionalLayers[layer.id]) {
          map.removeLayer(additionalLayers[layer.id])
        }
      }
    })

    // Add active layers to map (only for predefined layers, custom layers are handled during load)
    if (layer.active && !layer.custom) {
      console.log('Processing active predefined layer:', layer.name);

      if (layer.id === 'heatmap') {
        // Load tree data and create heatmap for initially active heatmap
        fetch("/api/tree-data/", {
          credentials: 'same-origin' // Include session cookies for authentication
        })
          .then((response) => response.json())
          .then((data) => {
            updateHeatmap(data)
            additionalLayers[layer.id].addTo(map)
          })
          .catch((error) => {
            console.error("Error loading initial data for heatmap:", error)
          })
      } else if (additionalLayers[layer.id]) {
        // Handle other predefined layers
        console.log('Adding active predefined layer to map:', layer.name);
        additionalLayers[layer.id].addTo(map)
      }
    }
  })
}

  // (Removed) Local import handlers moved to Layer Control page

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

  // Load all trees and seeds by default (show all individual tree pins for "All Trees")
  Promise.all([loadTrees(), loadSeeds()])
    .then(() => {
      console.log("Initial data load complete")
      // Ensure seed layer is visible (only if checkbox exists)
      const showSeedsCheckbox = document.getElementById("showSeeds")
      if (showSeedsCheckbox && showSeedsCheckbox.checked) {
        console.log("Show seeds is checked, ensuring seed layer is visible")
        if (!map.hasLayer(seedLayer)) {
          map.addLayer(seedLayer)
          console.log("Seed layer added to map after initial load")
        }
      } else {
        // If checkbox doesn't exist, add seed layer by default
        if (!map.hasLayer(seedLayer)) {
          map.addLayer(seedLayer)
          console.log("Seed layer added to map (default)")
        }
      }
      
      // Test seed data loading
      setTimeout(() => {
        console.log("Testing seed data...")
        fetch("/api/seed-data/", {
          credentials: 'same-origin' // Include session cookies for authentication
        })
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

  // Store current filter values
  let currentSpeciesFilter = "all"
  let currentYearFilter = ""
  let currentHealthFilter = ""
  let currentStatusFilter = ""
  let currentAddressFilter = ""

  // Function to apply all filters
  function applyFilters() {
      treeLayer.clearLayers()
    // Clear colorMap to ensure legend only shows current trees
    Object.keys(colorMap).forEach(key => delete colorMap[key])
    updateLegend() // Update legend immediately

    if (currentSpeciesFilter === "all") {
      loadTrees() // Show all individual tree pins
        // Hide the filtered data container
        filteredDataContainer.style.display = "none"
      } else {
      loadFilteredTrees(currentSpeciesFilter)
    }
  }

  // Tree filter change event
  document.querySelectorAll('input[name="treeFilter"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      currentSpeciesFilter = this.value
      applyFilters()
    })
    })

  // Year filter change event
  const yearFilter = document.getElementById('yearFilter')
  if (yearFilter) {
    yearFilter.addEventListener("change", function () {
      currentYearFilter = this.value
      applyFilters()
    })
  }

  // Health filter change event
  const healthFilter = document.getElementById('healthFilter')
  if (healthFilter) {
    healthFilter.addEventListener("change", function () {
      currentHealthFilter = this.value
      applyFilters()
    })
  }

  // Status filter change event (Existing/Planted)
  const statusFilter = document.getElementById('statusFilter')
  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      currentStatusFilter = this.value
      applyFilters()
    })
  }

  // Address filter change event
  const addressFilter = document.getElementById('addressFilter')
  if (addressFilter) {
    addressFilter.addEventListener("change", function () {
      currentAddressFilter = this.value
      applyFilters()
    })
  }

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

  // Measure distance tool (guard if button not present)
  let measureControl = null
  const measureBtn = document.getElementById("measureDistanceBtn")
  if (measureBtn) measureBtn.addEventListener("click", function () {
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

  // Draw polygon tool (guard if button not present)
  let drawControl = null
  const drawBtn = document.getElementById("drawPolygonBtn")
  if (drawBtn) drawBtn.addEventListener("click", function () {
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
    fetch("/api/tree-data/", {
      credentials: 'same-origin' // Include session cookies for authentication
    })
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

  // Function to filter GeoJSON features by year, health status, and tree status
  function filterGeoJSON(geojson) {
    if (!geojson.features) return geojson
    
    const filteredFeatures = geojson.features.filter(feature => {
      const props = feature.properties
      
      // Filter by year
      if (currentYearFilter) {
        const treeYear = props.year ? String(props.year) : ''
        if (treeYear !== currentYearFilter) {
          return false
        }
      }
      
      // Filter by health status
      if (currentHealthFilter) {
        const isHealthy = props.is_healthy !== undefined ? props.is_healthy : true
        if (currentHealthFilter === 'healthy' && !isHealthy) {
          return false
        }
        if (currentHealthFilter === 'not_healthy' && isHealthy) {
          return false
        }
      }
      
      // Filter by tree status (Existing/Planted)
      if (currentStatusFilter) {
        const isPlanted = props.is_planted !== undefined ? props.is_planted : false
        if (currentStatusFilter === 'planted' && !isPlanted) {
          return false
        }
        if (currentStatusFilter === 'existing' && isPlanted) {
          return false
        }
      }
      
      // Filter by address
      if (currentAddressFilter) {
        const treeAddress = props.address ? String(props.address).trim() : ''
        if (treeAddress !== currentAddressFilter) {
          return false
        }
      }
      
      return true
    })
    
    return {
      ...geojson,
      features: filteredFeatures
    }
  }

  // Function to load all trees
  function loadTrees() {
    // Clear existing tree markers
    treeLayer.clearLayers()
    // Clear colorMap to ensure legend only shows current trees
    Object.keys(colorMap).forEach(key => delete colorMap[key])
    updateLegend() // Update legend immediately to show "No trees on map" if no data

    // Add a console log to debug
    console.log("Loading all trees...")

    // Use the correct API endpoint
    fetch("/api/tree-data/", {
      credentials: 'same-origin' // Include session cookies for authentication
    })
      .then(async (response) => {
        // Check if redirected (likely to login page)
        if (response.redirected) {
          const redirectUrl = response.url || 'login page';
          throw new Error(`Redirected to ${redirectUrl}. You may need to log in again.`)
        }
        
        // Check response status
        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = `HTTP error! Status: ${response.status}`
          try {
            const contentType = response.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
              const errorData = await response.json()
              errorMessage = errorData.error || errorData.message || errorMessage
            } else {
              const text = await response.text()
              errorMessage = text || errorMessage
            }
          } catch (e) {
            console.error("Error parsing error response:", e)
          }
          throw new Error(errorMessage)
        }
        
        return response.json()
      })
      .then((data) => {
        console.log("Tree data received:", data)
        
        // Check if response contains an error
        if (data.error) {
          console.error("API returned error:", data.error)
          throw new Error(data.error)
        }
        
        // Apply filters
        const filteredData = filterGeoJSON(data)
        console.log(`Filtered ${filteredData.features.length} trees from ${data.features.length} total`)
        
        addTreesToMap(filteredData)

        // Also update heatmap if active
        if (map.hasLayer(additionalLayers.heatmap)) {
          updateHeatmap(filteredData)
        }
      })
      .catch((error) => {
        console.error("Error loading trees:", error)
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        alert(`Error loading tree data: ${error.message}\n\nPlease check the console for more details.`)
      })
  }

  // Function to load trees aggregated by address (for "All Trees" filter)
  function loadTreesByAddress() {
    // Clear existing tree markers
    treeLayer.clearLayers()
    // Clear colorMap to ensure legend only shows current trees
    Object.keys(colorMap).forEach(key => delete colorMap[key])
    updateLegend() // Update legend immediately to show "No trees on map" if no data

    console.log("Loading all trees aggregated by address...")

    // Use the correct API endpoint
    fetch("/api/tree-data/", {
      credentials: 'same-origin' // Include session cookies for authentication
    })
      .then(async (response) => {
        // Check if redirected (likely to login page)
        if (response.redirected) {
          const redirectUrl = response.url || 'login page';
          throw new Error(`Redirected to ${redirectUrl}. You may need to log in again.`)
        }
        
        // Check response status
        if (!response.ok) {
          let errorMessage = `HTTP error! Status: ${response.status}`
          try {
            const contentType = response.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
              const errorData = await response.json()
              errorMessage = errorData.error || errorData.message || errorMessage
            } else {
              const text = await response.text()
              errorMessage = text || errorMessage
            }
          } catch (e) {
            console.error("Error parsing error response:", e)
          }
          throw new Error(errorMessage)
        }
        
        return response.json()
      })
      .then((data) => {
        console.log("Tree data received for address aggregation:", data)
        
        // Check if response contains an error
        if (data.error) {
          console.error("API returned error:", data.error)
          throw new Error(data.error)
        }
        
        // Aggregate trees by address (showStats = false for "All Trees")
        addTreesByAddressToMap(data, false)

        // Also update heatmap if active
        if (map.hasLayer(additionalLayers.heatmap)) {
          updateHeatmap(data)
        }
      })
      .catch((error) => {
        console.error("Error loading trees by address:", error)
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        alert(`Error loading tree data: ${error.message}\n\nPlease check the console for more details.`)
      })
  }

  // Function to load all seeds
  function loadSeeds() {
    // Clear existing seed markers
    seedLayer.clearLayers()

    // Add a console log to debug
    console.log("Loading all seeds...")

    // Use the correct API endpoint
    fetch("/api/seed-data/", {
      credentials: 'same-origin' // Include session cookies for authentication
    })
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
        const germinationStatus = properties.germination_status 
          ? properties.germination_status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
          : 'Unknown'
        
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
    // Clear colorMap to ensure legend only shows current trees
    Object.keys(colorMap).forEach(key => delete colorMap[key])
    updateLegend() // Update legend immediately to show "No trees on map" if no data

    // Add a console log to debug
    console.log(`Loading filtered trees for species ID: ${speciesId}`)

    // Use the correct API endpoint
    fetch(`/api/filter-trees/${speciesId}/`, {
      credentials: 'same-origin' // Include session cookies for authentication
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Filtered tree data received:", data)
        
        // Apply filters
        const filteredData = filterGeoJSON(data)
        console.log(`Filtered ${filteredData.features.length} trees from ${data.features.length} total`)
        
        // Use location aggregation for filtered trees (showStats = true for filtered species)
        addTreesByAddressToMap(filteredData, true)

        // Also update heatmap if active
        if (map.hasLayer(additionalLayers.heatmap)) {
          updateHeatmap(filteredData)
        }

        // Display filtered data in the glass card
        if (filteredData.features && filteredData.features.length > 0) {
          displayFilteredData(filteredData)
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
        const commonName = feature.properties.common_name || 'Unknown';
        const color = getColorForSpecies(commonName)
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

        // Handle undefined values safely - get values before using them
        const commonName = p.common_name || 'Unknown';
        const scientificName = p.scientific_name || 'Unknown';
        const family = p.family || 'Unknown';
        const genus = p.genus || 'Unknown';
        const location = p.location || 'Unknown';
        const address = p.address || '';
        const healthStatus = p.health_status ? p.health_status.replace(/_/g, " ") : 'Unknown';
        
        const imageHtml = p.image_url ? `<div style="margin:8px 0"><img src="${p.image_url}" alt="${commonName}" style="max-width:220px;border-radius:6px"></div>` : ''
        
        // Determine Existing or Planted status
        const isPlanted = p.is_planted !== undefined ? p.is_planted : false
        const treeStatus = isPlanted ? 'Planted' : 'Existing'
        
        const popupContent = `
          <div class="tree-popup">
            <h3>${commonName}</h3>
            <p><em>${scientificName}</em></p>
            ${imageHtml}
            <table class="popup-table">
              <tr><td>Family:</td><td>${family}</td></tr>
              <tr><td>Genus:</td><td>${genus}</td></tr>
              <tr><td>Health Status:</td><td>
                <div class="health-status-indicator" style="display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; ${p.is_healthy ? 'background-color: #4CAF50; color: white;' : 'background-color: #F44336; color: white;'}">
                  ${p.is_healthy !== undefined ? (p.is_healthy ? '✓ Healthy' : '✗ Not Healthy') : 'Status Unknown'}
                </div>
              </td></tr>
              <tr><td>Status:</td><td>${treeStatus}</td></tr>
              <tr><td>Year:</td><td>${p.year || 'N/A'}</td></tr>
              <tr><td>Address:</td><td>${address || 'N/A'}</td></tr>
            </table>
          </div>
        `
        layer.bindPopup(popupContent)
      },
    }).addTo(treeLayer)

    try { map.fitBounds(geoJsonLayer.getBounds()) } catch (e) { console.error('Error fitting bounds:', e) }
    updateLegend()
  }

  // Function to add trees aggregated by location to the map
  // showStats: if true, show detailed statistics (height, diameter, existing/planted, healthy/not healthy)
  function addTreesByAddressToMap(geojson, showStats = false) {
    if (!geojson.features || geojson.features.length === 0) {
      console.log("No tree data found in the response")
      return
    }

    // Aggregate trees by location (same location = same pin)
    // Use location_id if available, otherwise fall back to coordinates
    const locationMap = new Map()
    
    console.log(`[GIS] Aggregating ${geojson.features.length} tree features by location...`)
    
    geojson.features.forEach((feature) => {
      const address = feature.properties.address || ''
      const lat = feature.geometry.coordinates[1]
      const lng = feature.geometry.coordinates[0]
      const locationId = feature.properties.location_id || null
      const population = feature.properties.population || 0
      const commonName = feature.properties.common_name || 'Unknown'
      const height = feature.properties.height_meters || null
      const diameter = feature.properties.diameter_cm || null
      const isHealthy = feature.properties.is_healthy !== undefined ? feature.properties.is_healthy : true
      const isPlanted = feature.properties.is_planted !== undefined ? feature.properties.is_planted : false
      const healthyCount = feature.properties.healthy_count || 0
      const badCount = feature.properties.bad_count || 0
      const deceasedCount = feature.properties.deceased_count || 0
      
      // Use location_id as primary key (most reliable), fall back to coordinates
      const key = locationId ? `loc_${locationId}` : `${lat.toFixed(6)},${lng.toFixed(6)}`
      
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          address: address,
          lat: lat,
          lng: lng,
          location_id: locationId,
          trees: [],
          heights: [],
          diameters: [],
          totalExisting: 0,
          totalPlanted: 0,
          totalHealthy: 0,
          totalNotHealthy: 0,
          images: [] // Store image URLs for species at this location
        })
      }
      
      // Add tree to this location - store individual tree details (do not aggregate)
      const locationData = locationMap.get(key)
      
      // Collect image URL if available
      const imageUrl = feature.properties.image_url || null
      if (imageUrl && !locationData.images.includes(imageUrl)) {
        locationData.images.push(imageUrl)
      }
      
      // Store individual tree record with all details
      locationData.trees.push({
        common_name: commonName,
        scientific_name: feature.properties.scientific_name || 'Unknown',
        family: feature.properties.family || 'Unknown',
        genus: feature.properties.genus || 'Unknown',
        is_healthy: isHealthy,
        is_planted: isPlanted,
        year: feature.properties.year || null,
        image_url: imageUrl,
        population: population // Keep for reference but show individual trees
      })
      
      // Collect height and diameter values for averaging
      if (height !== null && !isNaN(height)) {
        locationData.heights.push(height)
      }
      if (diameter !== null && !isNaN(diameter)) {
        locationData.diameters.push(diameter)
      }
      
      // Aggregate existing/planted counts (based on population)
      if (isPlanted) {
        locationData.totalPlanted += population
      } else {
        locationData.totalExisting += population
      }
      
      // Aggregate healthy/not healthy counts
      // Use healthy_count if available, otherwise use is_healthy flag
      if (healthyCount > 0) {
        locationData.totalHealthy += healthyCount
      } else if (isHealthy) {
        locationData.totalHealthy += population
      }
      
      if (badCount > 0 || deceasedCount > 0) {
        locationData.totalNotHealthy += (badCount + deceasedCount)
      } else if (!isHealthy) {
        locationData.totalNotHealthy += population
      }
      
      // Update address if we have a better one (non-empty)
      if (address && !locationData.address) {
        locationData.address = address
      }
    })
    
    console.log(`[GIS] Aggregated to ${locationMap.size} unique locations`)

    // Create markers for each location
    const markers = []
    locationMap.forEach((locationData, key) => {
      const latlng = [locationData.lat, locationData.lng]
      
      // Calculate total population for marker size
      const totalPopulation = locationData.trees.reduce((sum, tree) => sum + (tree.population || 1), 0)
      
      // Get color for the marker
      // If showStats is false (All Trees filter), use a special color
      // Otherwise, use the species-specific color
      let markerColor
      if (!showStats) {
        // Special color for "All Trees" filter - use a distinct color like teal/cyan
        markerColor = "#17a2b8" // Bootstrap info color (teal/cyan)
      } else {
        // Use species-specific color when filtering by specific species
        const primarySpecies = locationData.trees.length > 0 ? locationData.trees[0].common_name : 'Unknown'
        markerColor = getColorForSpecies(primarySpecies)
      }
      
      // Create marker with size based on number of trees at this location
      const marker = L.circleMarker(latlng, {
        radius: Math.min(15, Math.max(8, Math.sqrt(locationData.trees.length) * 2)),
        fillColor: markerColor,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
      
      // Create popup content showing individual tree information (not aggregated)
      let treeSections = ''
      locationData.trees.forEach((tree, index) => {
        const treeStatus = tree.is_planted ? 'Planted' : 'Existing'
        const healthStatus = tree.is_healthy !== undefined 
          ? (tree.is_healthy ? '✓ Healthy' : '✗ Not Healthy')
          : 'Status Unknown'
        const healthColor = tree.is_healthy ? '#4CAF50' : '#F44336'
        const imageHtml = tree.image_url 
          ? `<div style="margin:8px 0"><img src="${tree.image_url}" alt="${tree.common_name}" style="max-width:220px;border-radius:6px"></div>` 
          : ''
        
        treeSections += `
          <div style="margin-bottom: ${index < locationData.trees.length - 1 ? '20px' : '0'}; padding-bottom: ${index < locationData.trees.length - 1 ? '20px' : '0'}; border-bottom: ${index < locationData.trees.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'};">
            <h3 style="margin: 0 0 8px 0;">${tree.common_name}</h3>
            <p style="margin: 0 0 8px 0;"><em>${tree.scientific_name}</em></p>
            ${imageHtml}
            <table class="popup-table" style="width: 100%; margin-top: 8px;">
              <tr><td>Family:</td><td>${tree.family}</td></tr>
              <tr><td>Genus:</td><td>${tree.genus}</td></tr>
              <tr><td>Health Status:</td><td>
                <div class="health-status-indicator" style="display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; background-color: ${healthColor}; color: white;">
                  ${healthStatus}
                </div>
              </td></tr>
              <tr><td>Status:</td><td>${treeStatus}</td></tr>
              <tr><td>Year:</td><td>${tree.year || 'N/A'}</td></tr>
              <tr><td>Address:</td><td>${locationData.address || 'N/A'}</td></tr>
            </table>
          </div>
        `
      })
      
      const popupContent = `
        <div class="tree-popup">
          ${treeSections}
        </div>
      `
      
      marker.bindPopup(popupContent)
      markers.push(marker)
    })

    // Add all markers to the tree layer
    markers.forEach(marker => {
      marker.addTo(treeLayer)
    })

    // Fit bounds to show all markers
    if (markers.length > 0) {
      try {
        const group = new L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))
      } catch (e) {
        console.error('Error fitting bounds:', e)
      }
    }
    
    updateLegend()
  }

  // Function to update heatmap
  // Based on coordinates: one tree = one point with equal intensity
  function updateHeatmap(geojson) {
    console.log("🔥 Updating heatmap with data:", geojson)
    
    // Clear existing heatmap
    additionalLayers.heatmap.clearLayers()

    // Check if we have valid data
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      console.log("No data available for heatmap")
      return
    }

    // Extract points for heatmap - one tree = one point with equal intensity
    // Each tree contributes equally regardless of population
    const heatPoints = []
    geojson.features.forEach((feature) => {
      if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length >= 2) {
        const coords = feature.geometry.coordinates
        const lat = coords[1]  // Latitude
        const lng = coords[0]  // Longitude
        
        // Validate coordinates
        if (typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          // Each tree contributes equally with intensity 1.0
          // One pin = one tree, based on coordinates
          heatPoints.push([lat, lng, 1.0])
        }
      }
    })

    console.log(`Creating heatmap with ${heatPoints.length} tree points (one point per tree)`)

    // Create heatmap layer based on coordinate density
    if (heatPoints.length > 0) {
      const heat = L.heatLayer(heatPoints, {
        radius: 30,           // Radius for each point's influence
        blur: 20,             // Blur for smooth transitions
        maxZoom: 18,
        max: 1.0,             // Maximum intensity
        minOpacity: 0.2,      // Minimum opacity to show lower density areas
        gradient: { 
          0.0: "rgba(0,0,255,0)",      // Transparent blue at low density
          0.2: "rgba(0,128,255,0.4)", // Light blue
          0.4: "rgba(0,255,255,0.6)",  // Cyan
          0.6: "rgba(0,255,128,0.8)",  // Green-cyan
          0.8: "rgba(255,255,0,0.9)",  // Yellow
          1.0: "rgba(255,0,0,1.0)"     // Red at high density
        },
      })
      additionalLayers.heatmap.addLayer(heat)
      console.log(`✅ Heatmap layer created with ${heatPoints.length} points based on tree coordinates`)
    } else {
      console.log("❌ No valid points found for heatmap")
    }
  }

  // Create a legend for tree species
  const legend = L.control({ position: "bottomleft" })

  legend.onAdd = (map) => {
    const div = L.DomUtil.create("div", "info legend")
    div.innerHTML = ""

    // We'll populate this dynamically as trees are added
    div.setAttribute("id", "species-legend")
    // Hide legend initially - it will be shown when trees are loaded
    div.style.display = 'none'
    return div
  }

  legend.addTo(map)

  // Add window resize listener to ensure map updates properly
  window.addEventListener('resize', () => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize()
        console.log("✅ Map size invalidated on window resize")
      }, 100)
    }
  })

  // Function to update the legend
  function updateLegend() {
    const legendDiv = document.getElementById("species-legend")
    if (!legendDiv) return

    // Only show species that are actually on the map (in colorMap)
    // This ensures the legend reflects only trees that exist, not all taxonomy entries
    const speciesInMap = Object.keys(colorMap)
    
    if (speciesInMap.length === 0) {
      // Hide the legend completely when there are no trees
      legendDiv.style.display = 'none'
      legendDiv.innerHTML = ''
    } else {
      // Show the legend and populate it with species
      legendDiv.style.display = 'block'
    let legendContent = "<h4>Tree Species</h4>"

      // Sort species alphabetically for consistent display
      const sortedSpecies = speciesInMap.sort()
      
      sortedSpecies.forEach(species => {
        const color = colorMap[species]
      legendContent += `
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${color}"></span>
          <span class="legend-label">${species}</span>
        </div>
      `
      })

    legendDiv.innerHTML = legendContent
  }
  }
  
  // Initialize legend after trees are loaded (will be called by loadTrees function)
  // Don't initialize with all taxonomy species - wait for actual tree data

  // Entity type control change event (only if elements exist)
  const showTreesCheckbox = document.getElementById("showTrees")
  if (showTreesCheckbox) {
    showTreesCheckbox.addEventListener("change", function () {
    if (this.checked) {
      map.addLayer(treeLayer)
    } else {
      map.removeLayer(treeLayer)
    }
  })
  }

  const showSeedsCheckbox = document.getElementById("showSeeds")
  if (showSeedsCheckbox) {
    showSeedsCheckbox.addEventListener("change", function () {
    console.log("Show seeds checkbox changed:", this.checked)
    if (this.checked) {
      map.addLayer(seedLayer)
      console.log("Seed layer added to map")
    } else {
      map.removeLayer(seedLayer)
      console.log("Seed layer removed from map")
    }
  })
  }
})

