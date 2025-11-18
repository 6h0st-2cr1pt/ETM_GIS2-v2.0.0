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
  const printReportBtn = document.getElementById("printReportBtn")
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
          initReportMap();
        }

        // Enable print and download buttons
        printReportBtn.disabled = false;
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

  // Print report button click handler
  if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
      const content = document.getElementById('reportPreviewContent');
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = content.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      
      // Reinitialize the page
      location.reload();
    })
  }

  // Download report button click handler
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", async () => {
      try {
        const reportElement = document.querySelector('.report-document');
        if (!reportElement) return;

        // Create canvas from the report content
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('endemic_trees_report.pdf');

      } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report. Please try again.');
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
  function initReportMap() {
    const mapContainer = document.getElementById('reportMap');
    if (!mapContainer) return;

    // Check if Leaflet is available
    if (typeof L !== 'undefined') {
      const map = L.map(mapContainer).setView([10.3157, 123.8854], 10);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add sample markers
      L.marker([10.3157, 123.8854])
        .bindPopup('Sample Location 1')
        .addTo(map);
    } else {
      mapContainer.innerHTML = '<div class="alert alert-warning">Map functionality is currently unavailable.</div>';
    }
  }
})
