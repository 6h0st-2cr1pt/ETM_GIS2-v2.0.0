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
  const generateReportBtn = document.getElementById("generateReportBtn")
  const downloadReportBtn = document.getElementById("downloadReportBtn")
  const reportPreviewContent = document.getElementById("reportPreviewContent")
  const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]')
  const csrfToken = csrfTokenElement ? csrfTokenElement.value : ''
  
  // Select all/deselect all buttons
  const selectAllTreesBtn = document.getElementById("selectAllTreesBtn")
  const deselectAllTreesBtn = document.getElementById("deselectAllTreesBtn")
  
  // Debug: Log element availability
  console.log('Reports.js loaded. Elements found:', {
    reportForm: !!reportForm,
    generateReportBtn: !!generateReportBtn,
    reportPreviewContent: !!reportPreviewContent,
    csrfToken: !!csrfToken,
    csrfTokenLength: csrfToken ? csrfToken.length : 0
  });
  
  // Select all/deselect all functionality for trees (only visible trees)
  if (selectAllTreesBtn) {
    selectAllTreesBtn.addEventListener('click', () => {
      const treeItems = document.querySelectorAll('.tree-item');
      treeItems.forEach(item => {
        if (item.style.display !== 'none') {
          const checkbox = item.querySelector('.tree-checkbox');
          if (checkbox) checkbox.checked = true;
        }
      });
    });
  }
  
  if (deselectAllTreesBtn) {
    deselectAllTreesBtn.addEventListener('click', () => {
      const treeItems = document.querySelectorAll('.tree-item');
      treeItems.forEach(item => {
        if (item.style.display !== 'none') {
          const checkbox = item.querySelector('.tree-checkbox');
          if (checkbox) checkbox.checked = false;
        }
      });
    });
  }
  
  // Address filtering functionality - using dropdown
  let selectedAddress = '';

  // Function to normalize address for comparison (trim whitespace and handle empty)
  function normalizeAddress(address) {
    if (!address) return '';
    return String(address).trim();
  }

  // Function to filter trees by selected address
  function filterTreesByAddress() {
    const treeItems = document.querySelectorAll('.tree-item');
    let visibleCount = 0;
    const normalizedSelected = normalizeAddress(selectedAddress);

    console.log('Filtering trees. Selected address:', selectedAddress);

    treeItems.forEach((item, index) => {
      const treeAddressesStr = item.getAttribute('data-address') || '';
      
      // Show tree if no address selected OR if tree exists at selected address
      if (!selectedAddress || selectedAddress === '') {
        item.style.display = '';
        item.style.visibility = 'visible';
        visibleCount++;
      } else {
        // Check if any of the tree's addresses match the selected address
        // Tree addresses are stored as pipe-separated values (|)
        let matches = false;
        
        if (treeAddressesStr) {
          // Split addresses by | separator
          const treeAddresses = treeAddressesStr.split('|').map(addr => normalizeAddress(addr));
          
          // Check if any tree address matches the selected address
          for (const treeAddr of treeAddresses) {
            if (normalizedSelected === treeAddr && treeAddr !== '') {
              matches = true;
              break;
            }
          }
        }
        
        if (matches) {
          item.style.display = '';
          item.style.visibility = 'visible';
          visibleCount++;
        } else {
          item.style.display = 'none';
          item.style.visibility = 'hidden';
        }
      }
    });

    console.log(`Filtered: ${visibleCount} trees visible out of ${treeItems.length} total`);

    // Show message if no trees match
    const treeContainer = document.querySelector('.tree-list-container');
    if (!treeContainer) return;
    
    let noMatchMessage = treeContainer.querySelector('.no-match-message');
    if (visibleCount === 0 && selectedAddress && selectedAddress !== '') {
      if (!noMatchMessage) {
        noMatchMessage = document.createElement('p');
        noMatchMessage.className = 'no-match-message';
        noMatchMessage.style.color = 'rgba(255, 255, 255, 0.7)';
        noMatchMessage.style.margin = '10px 0';
        noMatchMessage.style.textAlign = 'center';
        noMatchMessage.textContent = 'No trees found for the selected address.';
        treeContainer.appendChild(noMatchMessage);
      }
    } else if (noMatchMessage) {
      noMatchMessage.remove();
  }
  }

  // Initialize address filtering with dropdown
  function initializeAddressFiltering() {
    const addressDropdown = document.getElementById('addressDropdown');
    if (!addressDropdown) return;
    
    // Handle dropdown change
    addressDropdown.addEventListener('change', function(e) {
      selectedAddress = this.value || '';
      console.log('Address dropdown changed to:', selectedAddress);
      filterTreesByAddress();
    });
  }
  
  // Function to toggle address filter (kept for backward compatibility)
  function toggleAddressFilter(normalizedAddress, label, item) {
    const checkbox = item.querySelector('.address-checkbox');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      updateAddressFilterFromCheckbox(normalizedAddress, label, checkbox);
    }
  }
  
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(initializeAddressFiltering, 200);

  
  // Function to update species dropdown (removed - no longer needed)
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
  

  // Generate report button click handler
  if (generateReportBtn) {
    console.log('Attaching click handler to generate report button');
    generateReportBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Generate report button clicked!');
      
      // Get form element - try multiple ways
      const form = document.getElementById("reportForm");
      if (!form) {
        console.error('Report form not found!');
        alert('Error: Report form not found. Please refresh the page.');
        return;
      }
      
      // Get form data
      const formData = new FormData(form);
      const selectedTrees = formData.getAll("selected_trees");
      const addressDropdown = document.getElementById('addressDropdown');
      const selectedAddressValue = addressDropdown ? addressDropdown.value : '';
      
      console.log('Selected trees:', selectedTrees);
      console.log('Selected address:', selectedAddressValue);

      if (!selectedTrees || selectedTrees.length === 0) {
        alert("Please select at least one tree.");
        return;
      }
      
      // Address is optional - if empty, it means "All Addresses"
      // No need to validate address selection

      // Get CSRF token - try multiple ways
      let token = csrfToken;
      if (!token) {
        const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
        if (tokenElement) {
          token = tokenElement.value;
        } else {
          // Try to get from cookie
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
              token = value;
              break;
            }
          }
        }
      }
      
      console.log('CSRF Token available:', !!token);

      // Show loading state
      const previewContent = document.getElementById("reportPreviewContent");
      if (previewContent) {
        previewContent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center h-100">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        `;
      }

      try {
        console.log('Sending request to /generate-report/');
        
        // Send form data to server
        const response = await fetch('/generate-report/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': token || '',
          },
          body: formData,
          credentials: 'same-origin'
        });
        
        console.log('Response received:', response.status);

        let data;
        try {
          const responseText = await response.text();
          console.log('Response status:', response.status);
          console.log('Response text (first 500 chars):', responseText.substring(0, 500));
          
          if (!response.ok) {
            console.error('Response not OK:', response.status, responseText);
            throw new Error(`Server error (${response.status}): ${responseText.substring(0, 200)}`);
          }
          
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError, 'Response:', responseText.substring(0, 500));
            throw new Error(`Invalid JSON response from server. Response: ${responseText.substring(0, 200)}`);
          }
        } catch (parseError) {
          if (parseError.message.includes('Server error') || parseError.message.includes('Invalid JSON')) {
            throw parseError;
          }
          throw new Error(`Error reading response: ${parseError.message}`);
        }
        
        if (!data.success) {
          console.error('Report generation failed:', data.error);
          throw new Error(data.error || 'Failed to generate report');
        }

        // Update preview with server response
        const previewContent = document.getElementById("reportPreviewContent");
        if (previewContent) {
          previewContent.innerHTML = data.reportContent;
        } else {
          console.error('Report preview content element not found!');
        }


        // Enable download button
        if (downloadReportBtn) {
          downloadReportBtn.disabled = false;
        }

      } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'An error occurred while generating the report. Please try again.';
        if (error.message) {
          errorMessage = error.message;
        }
        const previewContent = document.getElementById("reportPreviewContent");
        if (previewContent) {
          previewContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
              <strong>Error:</strong> ${errorMessage}
              <br><small>Check the browser console for more details.</small>
            </div>
          `;
        } else {
          alert('Error generating report: ' + errorMessage);
        }
      }
    })
  } else {
    console.error('Generate report button not found!');
    // Try to attach handler after a delay in case DOM isn't ready
    setTimeout(() => {
      const btn = document.getElementById("generateReportBtn");
      if (btn) {
        console.log('Found button after delay, attaching handler');
        btn.addEventListener("click", function() {
          alert('Please refresh the page to enable report generation.');
        });
      }
    }, 1000);
  }

  // Download report button click handler
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", async () => {
      let btn = document.getElementById("downloadReportBtn");
      if (!btn) return; // Button no longer exists
      
      try {
        const reportElement = document.querySelector('.report-document');
        if (!reportElement) {
          alert('No report to download. Please generate a report first.');
          return;
        }

        // Show loading indicator
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';

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
            // Adjust to start the new page at the map top position
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
        const restoreBtn = document.getElementById("downloadReportBtn");
        if (restoreBtn) {
          restoreBtn.disabled = false;
          restoreBtn.innerHTML = originalText;
        }

      } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report. Please try again.');
        const errorBtn = document.getElementById("downloadReportBtn");
        if (errorBtn) {
          errorBtn.disabled = false;
          errorBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        }
      }
    })
  }

  // Function to initialize report charts
  function initReportCharts(reportType, yearData, healthData, speciesData) {
    const ctx1 = document.getElementById('reportChart1')?.getContext('2d');
    const ctx2 = document.getElementById('reportChart2')?.getContext('2d');

    // Process year data for charts
    let yearLabels = [];
    let yearPopulations = [];
    let yearCounts = [];
    
    if (yearData && yearData.length > 0) {
      yearLabels = yearData.map(item => String(item.year || 'Unknown'));
      yearPopulations = yearData.map(item => item.population || 0);
      yearCounts = yearData.map(item => item.count || 0);
    } else {
      // Fallback if no data
      yearLabels = ['No Data'];
      yearPopulations = [0];
      yearCounts = [0];
    }

    if (ctx1) {
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: yearLabels,
          datasets: [{
            label: 'Total Population by Year',
            data: yearPopulations,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Population Trends by Year'
            },
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Population'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            }
          }
        }
      });
    }

    if (ctx2) {
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels: yearLabels,
          datasets: [{
            label: 'Number of Records by Year',
            data: yearCounts,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Record Count Trends by Year'
            },
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Records'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            }
          }
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
});

