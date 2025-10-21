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
              const url = layer.layer.url
              const attribution = layer.layer.attribution || ''

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
    document.querySelector('.layers-list').addEventListener('click', function(e) {
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
  
    // Save Layer functionality
    if (saveLayerBtn) {
      saveLayerBtn.addEventListener("click", () => {
        const formData = new FormData(layerForm);
        const layerId = formData.get("layer_id");
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  
        const url = layerId ? `/api/layers/${layerId}/` : "/api/layers/";
        const method = layerId ? "PUT" : "POST";

        // Convert FormData to JSON for proper API communication
        const data = {
          name: formData.get("name"),
          description: formData.get("description"),
          layer_type: formData.get("layer_type"),
          url: formData.get("layerUrl"),
          attribution: formData.get("layerAttribution"),
          is_active: document.getElementById("layerIsActive").checked,
          is_default: document.getElementById("layerIsDefault").checked
        };

        fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);
            if (!response.ok) {
              return response.json().then(data => {
                console.log("Error response data:", data);
                throw new Error(data.error || "Failed to save layer")
              })
            }
            return response.json()
          })
          .then((data) => {
            // Show success message
            if (data.success) {
              alert("Layer saved successfully!")
              // Reload page to show updated layers
              window.location.reload()
            } else {
              throw new Error(data.error || "Failed to save layer")
            }
          })
          .catch((error) => {
            console.error("Error saving layer:", error)
            alert("Error saving layer: " + error.message)
          })
      })
    }
  
    // Delete Layer functionality (using event delegation)
    const deleteLayerModal = new bootstrap.Modal(document.getElementById("deleteLayerModal"));
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    let layerToDelete = null;
  
    // Handle delete button clicks
    document.querySelector('.layers-list').addEventListener('click', function(e) {
      const deleteBtn = e.target.closest('.delete-layer-btn');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        layerToDelete = deleteBtn.getAttribute("data-id");
        deleteLayerModal.show();
      }
    });
  
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
  