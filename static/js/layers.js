document.addEventListener("DOMContentLoaded", () => {
    // Initialize the preview map
    const previewMap = L.map("previewMap", {
      center: [10.0, 123.0],
      zoom: 8,
    })
  
    // Add OpenStreetMap dark theme from CartoDB as the base layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(previewMap)
  
    // Layer preview functionality
    const previewLayerSelect = document.getElementById("previewLayerSelect")
    let currentPreviewLayer = null
  
    if (previewLayerSelect) {
      previewLayerSelect.addEventListener("change", function () {
        const layerId = this.value
  
        // Remove current preview layer if exists
        if (currentPreviewLayer) {
          previewMap.removeLayer(currentPreviewLayer)
          currentPreviewLayer = null
        }
  
        if (layerId) {
          // Fetch layer details
          fetch(`/api/layers/${layerId}/`)
            .then((response) => response.json())
            .then((layer) => {
              // Map backend field to expected keys
              const type = layer.layer.layer_type
              let url = layer.layer.url
              const attribution = layer.layer.attribution || ''

              // Auto-convert ArcGIS MapServer URLs to tile format
              if (url && url.includes('MapServer') && !url.includes('{z}')) {
                // Convert ArcGIS REST URL to tile URL
                url = url.replace(/\/MapServer.*$/, '/MapServer/tile/{z}/{y}/{x}');
                console.log('Converted ArcGIS URL to:', url);
              }

              // Add the layer to the preview map based on its type
              switch (type) {
                case "topographic":
                case "satellite":
                case "street":
                case "heatmap":
                case "protected":
                case "landuse":
                case "soil":
                case "custom":
                  // For most layer types, treat as tile layers
                  if (url && url.includes('{z}') && url.includes('{x}') && url.includes('{y}')) {
                    currentPreviewLayer = L.tileLayer(url, { 
                      attribution,
                      maxZoom: 19 
                    }).addTo(previewMap)
                  } else {
                    // Try to auto-detect if it's a GeoJSON URL
                    if (url && (url.endsWith('.json') || url.endsWith('.geojson'))) {
                      fetch(url)
                        .then((response) => response.json())
                        .then((geojson) => {
                          currentPreviewLayer = L.geoJSON(geojson, {
                            style: {
                              color: "#ff7800",
                              weight: 2,
                              opacity: 0.65,
                            },
                          }).addTo(previewMap)
                          try { 
                            previewMap.fitBounds(currentPreviewLayer.getBounds()) 
                          } catch(e) {
                            console.warn('Could not fit bounds for layer')
                          }
                        })
                        .catch((error) => {
                          console.error('Error loading GeoJSON layer:', error)
                        })
                    } else {
                      // Fallback to basic tile layer
                      currentPreviewLayer = L.tileLayer(url, { 
                        attribution,
                        maxZoom: 19 
                      }).addTo(previewMap)
                    }
                  }
                  break
                default:
                  // Auto-detect tile vs geojson by URL pattern
                  if (url && url.includes('{z}') && url.includes('{x}') && url.includes('{y}')) {
                    currentPreviewLayer = L.tileLayer(url, { 
                      attribution,
                      maxZoom: 19 
                    }).addTo(previewMap)
                  } else if (url && (url.endsWith('.json') || url.endsWith('.geojson'))) {
                    fetch(url)
                      .then(r=>r.json())
                      .then(g=>{
                        currentPreviewLayer = L.geoJSON(g).addTo(previewMap)
                        try { 
                          previewMap.fitBounds(currentPreviewLayer.getBounds()) 
                        } catch(e) {
                          console.warn('Could not fit bounds for layer')
                        }
                      })
                      .catch((error) => {
                        console.error('Error loading GeoJSON layer:', error)
                      })
                  }
              }
            })
            .catch((error) => console.error("Error loading layer for preview:", error))
        }
      })
    }
  
    // Source type - URL only (local file upload removed)

    // Add Layer button functionality
    const addLayerBtn = document.getElementById("addLayerBtn")
    const layerFormModal = new bootstrap.Modal(document.getElementById("layerFormModal"))
    const layerForm = document.getElementById("layerForm")
    const saveLayerBtn = document.getElementById("saveLayerBtn")
  
    if (addLayerBtn) {
      addLayerBtn.addEventListener("click", () => {
        // Reset form for new layer
        layerForm.reset()
        document.getElementById("layerId").value = ""
        document.getElementById("layerFormModalLabel").textContent = "Add New Layer"
        layerFormModal.show()
      })
    }
  
    // Edit Layer button functionality (using event delegation)
    const layersList = document.querySelector('.layers-list');
    if (layersList) {
      layersList.addEventListener('click', function(e) {
      const editBtn = e.target.closest('.edit-layer-btn');
      if (editBtn) {
        e.preventDefault();
        const layerId = editBtn.getAttribute("data-id");
        
        // Fetch layer details
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch(`/api/layers/${layerId}/`, {
          headers: {
            'X-CSRFToken': csrfToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then((layer) => {
            // Populate form with layer data
            document.getElementById("layerId").value = layer.layer.id;
            document.getElementById("layerName").value = layer.layer.name;
            document.getElementById("layerDescription").value = layer.layer.description || "";
            document.getElementById("layerType").value = layer.layer.layer_type;
            document.getElementById("layerUrl").value = layer.layer.url;
            document.getElementById("layerAttribution").value = layer.layer.attribution || "";
            document.getElementById("layerIsActive").checked = layer.layer.is_active;
            document.getElementById("layerIsDefault").checked = layer.layer.is_default;
  
            document.getElementById("layerFormModalLabel").textContent = "Edit Layer";
            layerFormModal.show();
          })
          .catch((error) => {
            console.error("Error fetching layer details:", error);
            alert("Error loading layer details. Please try again.");
          });
      }
    });
    }
  
    // Save Layer functionality
    function getCookie(name) {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop().split(';').shift()
      return null
    }

    if (saveLayerBtn) {
      saveLayerBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get all form inputs
        const inputs = document.querySelectorAll('#layerForm input, #layerForm select, #layerForm textarea');
        console.log("All form inputs:", inputs);
        inputs.forEach(input => {
          console.log(`Field ${input.id || input.name}: "${input.value}"`);
        });
        
        // Get CSRF token (prefer cookie, fallback to hidden input)
        let csrfToken = getCookie('csrftoken');
        if (!csrfToken) {
          const csrfEl = document.querySelector('[name=csrfmiddlewaretoken]')
          csrfToken = csrfEl ? csrfEl.value : ''
        }
        
        // Get URL field specifically
        const layerUrlInput = document.getElementById("layerUrl");
        console.log("URL input element:", layerUrlInput);
        console.log("URL value:", layerUrlInput ? layerUrlInput.value : "ELEMENT NOT FOUND");
        
        if (!layerUrlInput) {
          alert("ERROR: URL input field not found!");
          return false;
        }
        
        // Build data object
        const data = {
          name: document.getElementById("layerName").value.trim(),
          description: document.getElementById("layerDescription").value.trim(),
          layer_type: document.getElementById("layerType").value,
          url: document.getElementById("layerUrl").value.trim(),
          attribution: document.getElementById("layerAttribution").value.trim(),
          is_active: document.getElementById("layerIsActive").checked,
          is_default: document.getElementById("layerIsDefault").checked
        };
        
        console.log("Data object:", data);
        console.log("URL in data object:", data.url);
        console.log("URL length:", data.url ? data.url.length : 0);
        
        // Validate
        // Validate URL
        if (!data.url) {
          alert("ERROR: URL is empty!\n\nPlease type a URL in the Layer URL field.");
          console.error("URL field is empty");
          return false;
        }

        // Helper to perform the actual save
        function doSave(finalData) {
          // Determine method and endpoint
          const layerId = document.getElementById("layerId").value;
          const apiUrl = layerId ? `/api/layers/${layerId}/` : "/api/layers/";
          const method = layerId ? "PUT" : "POST";

          console.log("Sending to:", apiUrl);
          console.log("Method:", method);
          console.log("Payload:", JSON.stringify(finalData, null, 2));

          fetch(apiUrl, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest"
            },
            credentials: 'same-origin',
            body: JSON.stringify(finalData),
          })
            .then(async (response) => {
              console.log("Response status:", response.status);
              console.log("Response ok:", response.ok);
              const contentType = response.headers.get('content-type') || ''
              if (response.redirected) {
                const redirectedTo = response.url || '(unknown)'
                throw new Error(`Redirected to ${redirectedTo}. You may need to log in again.`)
              }
              if (!response.ok) {
                if (contentType.includes('application/json')) {
                  const data = await response.json()
                  console.log("Error response data:", data)
                  throw new Error(data.error || "Failed to save layer")
                } else {
                  const text = await response.text()
                  console.log("Error response text:", text)
                  const snippet = (text || '').slice(0, 200)
                  throw new Error('Failed to save layer (non-JSON). Snippet: ' + snippet)
                }
              }
              if (contentType.includes('application/json')) {
                return response.json()
              } else {
                return { success: true }
              }
            })
            .then((resp) => {
              console.log("Response received:", resp);
              // Check for success in response
              if (resp.success || resp.layer) {
                alert("Layer saved successfully!")
                window.location.reload()
              } else {
                throw new Error(resp.error || "Failed to save layer")
              }
            })
            .catch((error) => {
              console.error("Error saving layer:", error)
              alert("Error saving layer: " + error.message)
            })
        }

        // Save with URL
        doSave(data)
      })
    }
  
    // Delete Layer functionality (using event delegation)
    const deleteLayerModal = new bootstrap.Modal(document.getElementById("deleteLayerModal"));
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    let layerToDelete = null;
  
    // Handle delete button clicks
    if (layersList) {
      layersList.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-layer-btn');
        if (deleteBtn) {
          e.preventDefault();
          e.stopPropagation();
          layerToDelete = deleteBtn.getAttribute("data-id");
          deleteLayerModal.show();
        }
      });
    }
  
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", () => {
        if (layerToDelete) {
          const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
          
          fetch(`/api/layers/${layerToDelete}/`, {
            method: "DELETE",
            headers: {
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest"
            },
            credentials: 'same-origin'
          })
          .then((response) => {
            if (!response.ok) {
              return response.json().then(err => {
                throw new Error(err.error || 'Failed to delete layer');
              });
            }
            return response.json();
          })
          .then(data => {
            if (data.success) {
              deleteLayerModal.hide();
              // Reload page to show updated layers
              window.location.reload();
            } else {
              throw new Error(data.error || 'Failed to delete layer');
            }
          })
          .catch((error) => {
            console.error("Error deleting layer:", error);
            alert("Error deleting layer: " + error.message);
          });
        }
      });
    }
  })
  