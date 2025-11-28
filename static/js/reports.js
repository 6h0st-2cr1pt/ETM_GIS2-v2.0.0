// Import jsPDF
const { jsPDF } = window.jspdf;

// Import Leaflet library
var L = L || {}

// Import html2canvas library
var html2canvas = html2canvas || {}

// Function to force dropdown option styling
function forceDropdownStyling() {
  // Force styling for all select elements in the reports page
  const selects = document.querySelectorAll('.reports-container select, .reports-container .form-select');
  
  selects.forEach(select => {
    // Style the select element itself
    select.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    select.style.color = '#ffffff';
    select.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    
    // Style all options with black background and white text
    const options = select.querySelectorAll('option');
    options.forEach(option => {
      option.style.backgroundColor = '#000000';
      option.style.color = '#ffffff';
      option.style.padding = '8px';
      option.style.fontWeight = '500';
      option.style.border = 'none';
      option.style.margin = '2px 0';
    });
    
    // Add event listeners to maintain styling
    select.addEventListener('focus', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.style.borderColor = '#4e73df';
    });
    
    select.addEventListener('blur', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    select.addEventListener('change', function() {
      // Re-apply styling to options after change
      const options = this.querySelectorAll('option');
      options.forEach(option => {
        option.style.backgroundColor = '#000000';
        option.style.color = '#ffffff';
        option.style.padding = '8px';
        option.style.fontWeight = '500';
        option.style.border = 'none';
        option.style.margin = '2px 0';
      });
    });
  });
  
  // Also style any form controls
  const formControls = document.querySelectorAll('.reports-container .form-control');
  formControls.forEach(control => {
    control.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    control.style.color = '#ffffff';
    control.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    
    control.addEventListener('focus', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.style.borderColor = '#4e73df';
    });
    
    control.addEventListener('blur', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
  });
  
  // Style checkboxes and labels
  const checkboxes = document.querySelectorAll('.reports-container .form-check-input');
  checkboxes.forEach(checkbox => {
    checkbox.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    checkbox.style.border = '1px solid rgba(255, 255, 255, 0.4)';
  });
  
  const labels = document.querySelectorAll('.reports-container .form-group label, .reports-container .form-check-label');
  labels.forEach(label => {
    label.style.color = '#ffffff';
    label.style.fontWeight = '600';
    label.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Force dropdown styling immediately
  forceDropdownStyling();
  
  // Also apply styling after a short delay to ensure all elements are loaded
  setTimeout(forceDropdownStyling, 100);
  
  // Get DOM elements
  const reportForm = document.getElementById("reportForm")
  const timeRange = document.getElementById("timeRange")
  const customTimeRange = document.querySelector(".custom-time-range")
  const generateReportBtn = document.getElementById("generateReportBtn")
  const downloadReportBtn = document.getElementById("downloadReportBtn")
  const reportPreviewContent = document.getElementById("reportPreviewContent")
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value
  const speciesFilter = document.getElementById("speciesFilter")
  const locationFilter = document.getElementById("locationFilter")
  
  // Function to update species dropdown
  async function updateSpeciesDropdown() {
    if (!speciesFilter) {
      console.warn('Species filter element not found');
      return Promise.resolve();
    }
    
    try {
      console.log('Fetching species list from API...');
      // Add timestamp to URL to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/species-list/?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Failed to fetch species list: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Species data received:', data);
      
      if (data.success && data.species) {
        // Store the currently selected value
        const currentValue = speciesFilter.value;
        console.log('Current selected value:', currentValue);
        console.log('Number of species to add:', data.species.length);
        
        // Clear ALL existing options completely - multiple methods to ensure it works
        speciesFilter.innerHTML = '';
        while (speciesFilter.options.length > 0) {
          speciesFilter.remove(0);
        }
        
        // Add "All Species" option first
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Species';
        allOption.setAttribute('style', 'background-color: #000000; color: #ffffff; padding: 8px;');
        speciesFilter.appendChild(allOption);
        
        // Add new species options from fresh database data
        data.species.forEach(species => {
          const option = document.createElement('option');
          option.value = species.id;
          option.textContent = species.common_name;
          option.setAttribute('style', 'background-color: #000000; color: #ffffff; padding: 8px;');
          speciesFilter.appendChild(option);
        });
        
        console.log('Dropdown updated. Total options:', speciesFilter.options.length);
        
        // Restore the previously selected value if it still exists
        if (currentValue && currentValue !== 'all') {
          const optionExists = Array.from(speciesFilter.options).some(opt => opt.value === currentValue);
          if (optionExists) {
            speciesFilter.value = currentValue;
            console.log('Restored previous selection:', currentValue);
          } else {
            speciesFilter.value = 'all';
            console.log('Previous selection no longer exists, reset to "all"');
          }
        } else {
          speciesFilter.value = 'all';
        }
        
        // Re-apply styling
        forceDropdownStyling();
        
        // Trigger change event to notify any listeners
        speciesFilter.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.error('Invalid response data:', data);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating species dropdown:', error);
      alert('Failed to update species list. Please refresh the page.');
      return Promise.reject(error);
    }
  }
  
  // Function to update location dropdown
  async function updateLocationDropdown() {
    if (!locationFilter) {
      console.warn('Location filter element not found');
      return Promise.resolve();
    }
    
    try {
      console.log('Fetching locations list from API...');
      // Add timestamp to URL to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/locations-list/?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Failed to fetch locations list: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Location data received:', data);
      
      if (data.success && data.locations) {
        // Store the currently selected value
        const currentValue = locationFilter.value;
        console.log('Current selected value:', currentValue);
        console.log('Number of locations to add:', data.locations.length);
        
        // Clear ALL existing options completely - multiple methods to ensure it works
        locationFilter.innerHTML = '';
        while (locationFilter.options.length > 0) {
          locationFilter.remove(0);
        }
        
        // Add "All Locations" option first
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Locations';
        allOption.setAttribute('style', 'background-color: #000000; color: #ffffff; padding: 8px;');
        locationFilter.appendChild(allOption);
        
        // Add new location options with latitude and longitude from fresh database data
        data.locations.forEach(location => {
          const option = document.createElement('option');
          option.value = location.id;
          // Display name with coordinates
          const lat = location.latitude ? parseFloat(location.latitude).toFixed(6) : 'N/A';
          const lng = location.longitude ? parseFloat(location.longitude).toFixed(6) : 'N/A';
          option.textContent = `${location.name} (${lat}, ${lng})`;
          option.setAttribute('style', 'background-color: #000000; color: #ffffff; padding: 8px;');
          locationFilter.appendChild(option);
        });
        
        console.log('Dropdown updated. Total options:', locationFilter.options.length);
        
        // Restore the previously selected value if it still exists
        if (currentValue && currentValue !== 'all') {
          const optionExists = Array.from(locationFilter.options).some(opt => opt.value === currentValue);
          if (optionExists) {
            locationFilter.value = currentValue;
            console.log('Restored previous selection:', currentValue);
          } else {
            locationFilter.value = 'all';
            console.log('Previous selection no longer exists, reset to "all"');
          }
        } else {
          locationFilter.value = 'all';
        }
        
        // Re-apply styling
        forceDropdownStyling();
        
        // Trigger change event to notify any listeners
        locationFilter.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.error('Invalid response data:', data);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating location dropdown:', error);
      alert('Failed to update location list. Please refresh the page.');
      return Promise.reject(error);
    }
  }
  
  // Update dropdowns when page loads (with a small delay to ensure DOM is ready)
  setTimeout(() => {
    console.log('Initializing dropdown updates...');
    updateSpeciesDropdown();
    updateLocationDropdown();
  }, 200);
  
  // Add refresh button handlers
  const refreshSpeciesBtn = document.getElementById("refreshSpeciesBtn");
  const refreshLocationBtn = document.getElementById("refreshLocationBtn");
  
  if (refreshSpeciesBtn) {
    refreshSpeciesBtn.addEventListener("click", async () => {
      console.log('Refresh species button clicked');
      refreshSpeciesBtn.disabled = true;
      const icon = refreshSpeciesBtn.querySelector('i');
      if (icon) {
        icon.classList.add('fa-spin');
        icon.style.opacity = '0.6';
      }
      try {
        await updateSpeciesDropdown();
        console.log('Species dropdown refreshed successfully');
        // Show brief success feedback
        const originalTitle = refreshSpeciesBtn.title;
        refreshSpeciesBtn.title = 'Refreshed!';
        setTimeout(() => {
          refreshSpeciesBtn.title = originalTitle;
        }, 2000);
      } catch (error) {
        console.error('Error refreshing species dropdown:', error);
        alert('Failed to refresh species list. Check console for details.');
      } finally {
        refreshSpeciesBtn.disabled = false;
        if (icon) {
          icon.classList.remove('fa-spin');
          icon.style.opacity = '1';
        }
      }
    });
  }
  
  if (refreshLocationBtn) {
    refreshLocationBtn.addEventListener("click", async () => {
      console.log('Refresh location button clicked');
      refreshLocationBtn.disabled = true;
      const icon = refreshLocationBtn.querySelector('i');
      if (icon) {
        icon.classList.add('fa-spin');
        icon.style.opacity = '0.6';
      }
      try {
        await updateLocationDropdown();
        console.log('Location dropdown refreshed successfully');
        // Show brief success feedback
        const originalTitle = refreshLocationBtn.title;
        refreshLocationBtn.title = 'Refreshed!';
        setTimeout(() => {
          refreshLocationBtn.title = originalTitle;
        }, 2000);
      } catch (error) {
        console.error('Error refreshing location dropdown:', error);
        alert('Failed to refresh location list. Check console for details.');
      } finally {
        refreshLocationBtn.disabled = false;
        if (icon) {
          icon.classList.remove('fa-spin');
          icon.style.opacity = '1';
        }
      }
    });
  }

  // Show/hide custom time range based on selection
  if (timeRange) {
    timeRange.addEventListener("change", function () {
      if (this.value === "custom") {
        customTimeRange.classList.remove("d-none")
      } else {
        customTimeRange.classList.add("d-none")
      }
      // Re-apply styling after change
      forceDropdownStyling();
    })
  }

  // Generate report button click handler
  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", async () => {
      // Get form data
      const formData = new FormData(reportForm)
      const reportType = formData.get("report_type")

      if (!reportType) {
        alert("Please select a report type.")
        return
      }

      // Show loading state
      reportPreviewContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `

      try {
        // Send form data to server
        const response = await fetch('/generate-report/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken,
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate report');
        }

        // Update preview with server response
        reportPreviewContent.innerHTML = data.reportContent;

        // Initialize charts and map if needed
        if (formData.get("include_charts") === "on") {
          initReportCharts(reportType);
        }
        
        if (formData.get("include_map") === "on") {
          const speciesFilter = formData.get("species_filter");
          const locationFilter = formData.get("location_filter");
          initReportMap(speciesFilter, locationFilter);
        }

        // Enable download button
        downloadReportBtn.disabled = false;

      } catch (error) {
        console.error('Error:', error);
        reportPreviewContent.innerHTML = `
          <div class="alert alert-danger" role="alert">
            An error occurred while generating the report. Please try again.
          </div>
        `;
      }
    })
  }

  // Download report button click handler
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", async () => {
      try {
        const reportElement = document.querySelector('.report-document');
        if (!reportElement) {
          alert('No report to download. Please generate a report first.');
          return;
        }

        // Show loading indicator
        downloadReportBtn.disabled = true;
        const originalText = downloadReportBtn.innerHTML;
        downloadReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';

        // Convert canvas charts to images before capturing
        const canvases = reportElement.querySelectorAll('canvas');
        const canvasImages = [];
        for (const canvas of canvases) {
          try {
            const imgData = canvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = imgData;
            img.style.width = canvas.style.width || '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            const parent = canvas.parentNode;
            canvasImages.push({ element: canvas, replacement: img, parent: parent });
          } catch (error) {
            console.error('Error converting canvas to image:', error);
          }
        }

        // Temporarily replace canvas elements with images
        canvasImages.forEach(({ element, replacement, parent }) => {
          parent.replaceChild(replacement, element);
        });

        // Add CSS to prevent page breaks inside map containers and chart containers
        const style = document.createElement('style');
        style.textContent = `
          .report-map-container,
          .report-chart-container,
          .report-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        `;
        document.head.appendChild(style);

        // Get positions of map containers to avoid splitting them
        const mapContainers = reportElement.querySelectorAll('.report-map-container');
        const mapPositions = [];
        mapContainers.forEach(mapContainer => {
          const rect = mapContainer.getBoundingClientRect();
          const reportRect = reportElement.getBoundingClientRect();
          const relativeTop = rect.top - reportRect.top;
          const relativeBottom = rect.bottom - reportRect.top;
          mapPositions.push({
            top: relativeTop,
            bottom: relativeBottom,
            height: rect.height
          });
        });

        // Create canvas from the report content with better options
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          height: reportElement.scrollHeight,
          width: reportElement.scrollWidth,
          windowWidth: reportElement.scrollWidth,
          windowHeight: reportElement.scrollHeight
        });

        // Remove the temporary style
        document.head.removeChild(style);

        // Restore canvas elements
        canvasImages.forEach(({ element, replacement, parent }) => {
          parent.replaceChild(element, replacement);
        });

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // 20mm margin (top, bottom, left, right)
        const contentWidth = pdfWidth - (2 * margin);
        const contentHeight = pdfHeight - (2 * margin);
        
        // Calculate image dimensions
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Calculate how many pages we need
        // Convert map positions from pixels to PDF image coordinates
        const pixelToImageRatio = imgHeight / canvas.height;
        const mapPositionsInImage = mapPositions.map(pos => ({
          top: pos.top * pixelToImageRatio,
          bottom: pos.bottom * pixelToImageRatio,
          height: pos.height * pixelToImageRatio
        }));

        let heightLeft = imgHeight;
        let yPosition = margin; // Start position with top margin
        let currentPageImageTop = 0; // Track position in the source image

        // Add first page
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        heightLeft -= contentHeight;
        currentPageImageTop += contentHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          // Check if any map would be split at the current page break
          let mapSplitDetected = false;
          let mapToProtect = null;
          
          for (const mapPos of mapPositionsInImage) {
            const mapStartRelative = mapPos.top - (currentPageImageTop - contentHeight);
            const mapEndRelative = mapPos.bottom - (currentPageImageTop - contentHeight);
            
            // If map starts on current page but extends beyond page boundary
            if (mapStartRelative >= 0 && mapStartRelative < contentHeight && mapEndRelative > contentHeight) {
              // Map would be split - check if it fits on next page
              if (mapPos.height <= contentHeight) {
                mapSplitDetected = true;
                mapToProtect = mapPos;
                break;
              }
            }
          }

          pdf.addPage();
          
          if (mapSplitDetected && mapToProtect) {
            // Adjust to start the new page at the map's top position
            // This ensures the map starts at the top of the new page
            const mapTopInImage = mapToProtect.top;
            const offsetFromPageTop = mapTopInImage - (currentPageImageTop - contentHeight);
            
            // Position the image so the map starts at the top margin
            yPosition = margin - offsetFromPageTop;
            currentPageImageTop = mapToProtect.top;
          } else {
            // Normal page break - continue from where we left off
            yPosition = margin - (imgHeight - heightLeft);
            currentPageImageTop += contentHeight;
          }
          
          pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          heightLeft -= contentHeight;
        }

        pdf.save('endemic_trees_report.pdf');

        // Restore button
        downloadReportBtn.disabled = false;
        downloadReportBtn.innerHTML = originalText;

      } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report. Please try again.');
        downloadReportBtn.disabled = false;
        downloadReportBtn.innerHTML = '<i class="fas fa-download"></i> Download';
      }
    })
  }

  // Function to initialize report charts
  function initReportCharts(reportType) {
    const ctx1 = document.getElementById('reportChart1')?.getContext('2d');
    const ctx2 = document.getElementById('reportChart2')?.getContext('2d');

    if (ctx1) {
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Sample Data',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    if (ctx2) {
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Trend',
            data: [65, 59, 80, 81, 56, 55],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true
        }
      });
    }
  }

  // Function to initialize report map
  async function initReportMap(speciesFilter, locationFilter) {
    const mapContainer = document.getElementById('reportMap');
    if (!mapContainer) return;

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      mapContainer.innerHTML = '<div class="alert alert-warning">Map functionality is currently unavailable.</div>';
      return;
    }

    // Initialize map with default view (will be adjusted based on data)
    // Use setTimeout to ensure container is fully rendered
    const map = L.map(mapContainer, {
      preferCanvas: false
    }).setView([10.3157, 123.8854], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Invalidate size to ensure proper rendering in dynamically created container
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    try {
      // Fetch tree data from API
      const response = await fetch('/api/tree-data/');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const geojson = await response.json();
      
      if (!geojson.features || geojson.features.length === 0) {
        mapContainer.innerHTML = '<div class="alert alert-info">No tree data available to display on the map.</div>';
        return;
      }

      // Filter features based on form filters
      let filteredFeatures = geojson.features;
      
      if (speciesFilter && speciesFilter !== 'all') {
        filteredFeatures = filteredFeatures.filter(feature => 
          feature.properties.species_id === speciesFilter
        );
      }
      
      if (locationFilter && locationFilter !== 'all') {
        filteredFeatures = filteredFeatures.filter(feature => 
          feature.properties.location_id === locationFilter
        );
      }

      // Create filtered GeoJSON
      const filteredGeoJson = {
        type: 'FeatureCollection',
        features: filteredFeatures
      };

      // Add markers to map
      const bounds = [];
      const markers = L.geoJSON(filteredGeoJson, {
        pointToLayer: (feature, latlng) => {
          bounds.push([latlng.lat, latlng.lng]);
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#2ecc71',
            color: '#fff',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.8,
          });
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const imageHtml = p.image_url ? 
            `<div style="margin:8px 0"><img src="${p.image_url}" alt="${p.common_name}" style="max-width:220px;border-radius:6px"></div>` : '';
          
          let hectaresDisplay = 'N/A';
          if (p.hectares !== null && p.hectares !== undefined && p.hectares !== '') {
            const hectaresNum = Number(p.hectares);
            if (!isNaN(hectaresNum) && hectaresNum >= 0) {
              hectaresDisplay = `${hectaresNum.toFixed(2)} ha`;
            }
          }

          const popupContent = `
            <div class="tree-popup">
              <h3>${p.common_name}</h3>
              <p><em>${p.scientific_name}</em></p>
              ${imageHtml}
              <table class="popup-table">
                <tr><td>Family:</td><td>${p.family}</td></tr>
                <tr><td>Genus:</td><td>${p.genus}</td></tr>
                <tr><td>Location:</td><td>${p.location}</td></tr>
                <tr><td>Population:</td><td>${p.population}</td></tr>
                <tr><td><strong>Hectares:</strong></td><td>${hectaresDisplay}</td></tr>
                <tr><td>Health Status:</td><td>${p.health_status.replace(/_/g, " ")}</td></tr>
                <tr><td>Year:</td><td>${p.year}</td></tr>
              </table>
            </div>
          `;
          layer.bindPopup(popupContent);
        }
      }).addTo(map);

      // Fit map bounds to show all markers
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
        // Invalidate size again after fitting bounds
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } else {
        // If no markers after filtering, show message
        mapContainer.innerHTML = '<div class="alert alert-info">No tree data matches the selected filters.</div>';
      }

    } catch (error) {
      console.error('Error loading tree data for map:', error);
      mapContainer.innerHTML = '<div class="alert alert-danger">Error loading tree data. Please try again.</div>';
    }
  }
})
