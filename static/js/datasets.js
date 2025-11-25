document.addEventListener("DOMContentLoaded", () => {
    // Get CSRF token
    const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!csrfTokenElement) {
        console.error('CSRF token not found on page');
        return;
    }
    const csrfToken = csrfTokenElement.value;

    // View and Edit button handlers
    const viewButtons = document.querySelectorAll('.action-view');
    const imageButtons = document.querySelectorAll('.action-image');
    const editButtons = document.querySelectorAll('.action-edit');
    const deleteButtons = document.querySelectorAll('.action-delete');
    
    // Bulk delete functionality
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const bulkActions = document.getElementById('bulkActions');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    
    // Function to update bulk actions visibility
    function updateBulkActionsVisibility() {
        const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
        if (checkedBoxes.length > 0) {
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    // Function to update select all checkbox state
    function updateSelectAllState() {
        const allChecked = rowCheckboxes.length > 0 && 
                          document.querySelectorAll('.row-checkbox:checked').length === rowCheckboxes.length;
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = !allChecked && 
                                         document.querySelectorAll('.row-checkbox:checked').length > 0;
    }
    
    // Select all checkbox handler
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBulkActionsVisibility();
        });
    }
    
    // Individual row checkbox handlers
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateBulkActionsVisibility();
            updateSelectAllState();
        });
    });
    
    // Delete selected button handler
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select at least one record to delete.');
                return;
            }
            
            const treeIds = Array.from(checkedBoxes).map(cb => cb.dataset.treeId);
            const confirmMessage = `Are you sure you want to delete ${treeIds.length} record(s)?`;
            
            if (confirm(confirmMessage)) {
                try {
                    const response = await fetch('/delete-trees-bulk/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ tree_ids: treeIds })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        // Remove deleted rows from the table
                        checkedBoxes.forEach(checkbox => {
                            const row = checkbox.closest('tr');
                            row.remove();
                        });
                        
                        // Reset select all checkbox
                        selectAllCheckbox.checked = false;
                        selectAllCheckbox.indeterminate = false;
                        updateBulkActionsVisibility();
                        
                        alert(`Successfully deleted ${data.deleted_count} record(s).`);
                        // Reload page to refresh the table
                        window.location.reload();
                    } else {
                        throw new Error(data.error || 'Failed to delete selected records');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert(error.message || 'Error deleting selected records. Please try again.');
                }
            }
        });
    }
    
    // Delete all button handler
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', async () => {
            const totalRows = rowCheckboxes.length;
            if (totalRows === 0) {
                alert('No records to delete.');
                return;
            }
            
            const confirmMessage = `Are you sure you want to delete ALL ${totalRows} record(s)? This action cannot be undone!`;
            
            if (confirm(confirmMessage)) {
                // Double confirmation for delete all
                if (confirm('This will permanently delete all records. Are you absolutely sure?')) {
                    try {
                        const response = await fetch('/delete-all-trees/', {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrfToken,
                                'Accept': 'application/json'
                            }
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok && data.success) {
                            alert(`Successfully deleted all ${data.deleted_count} record(s).`);
                            // Reload page to refresh the table
                            window.location.reload();
                        } else {
                            throw new Error(data.error || 'Failed to delete all records');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert(error.message || 'Error deleting all records. Please try again.');
                    }
                }
            }
        });
    }

    // Initialize Bootstrap modals
    const treeDetailsModal = new bootstrap.Modal(document.getElementById('treeDetailsModal'));
    const imagePreviewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    const editTreeModal = new bootstrap.Modal(document.getElementById('editTreeModal'));

    // View button click handler
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            
            // Populate view modal with data from the row
            document.getElementById('view-common-name').textContent = row.querySelector('[data-common_name]').dataset.common_name;
            document.getElementById('view-scientific-name').textContent = row.querySelector('[data-scientific_name]').dataset.scientific_name;
            document.getElementById('view-family').textContent = row.querySelector('[data-family]').dataset.family;
            document.getElementById('view-genus').textContent = row.querySelector('[data-genus]').dataset.genus;
            document.getElementById('view-population').textContent = row.querySelector('[data-population]').dataset.population;
            const hectares = row.querySelector('[data-hectares]')?.dataset.hectares || 'N/A';
            document.getElementById('view-hectares').textContent = hectares !== 'N/A' ? parseFloat(hectares).toFixed(2) + ' ha' : 'N/A';
            document.getElementById('view-health-status').textContent = row.querySelector('[data-health_status]').dataset.health_status;
            document.getElementById('view-year').textContent = row.querySelector('[data-year]').dataset.year;
            
            const coordinates = row.querySelector('[data-coordinates]').dataset.coordinates.split(',');
            document.getElementById('view-latitude').textContent = coordinates[0];
            document.getElementById('view-longitude').textContent = coordinates[1];
            
            const notes = row.querySelector('[data-notes]').dataset.notes;
            document.getElementById('view-notes').textContent = notes || 'No notes available';

            // Show the view modal
            treeDetailsModal.show();
        });
    });

    // Image preview button click handler
    imageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const imageUrl = button.dataset.imageUrl;
            const placeholder = document.getElementById('image-preview-placeholder');
            const image = document.getElementById('image-preview-img');
            
            if (imageUrl && imageUrl.trim() !== '') {
                image.src = imageUrl;
                image.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                image.style.display = 'none';
                placeholder.style.display = 'block';
            }
            
            imagePreviewModal.show();
        });
    });

    // Edit button click handler
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const row = button.closest('tr');
            const treeId = button.dataset.id;
            
            // Fetch tree details including image
            try {
                const response = await fetch(`/edit-tree/${treeId}/`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Populate edit form with data
                    document.getElementById('edit-tree-id').value = treeId;
                    document.getElementById('edit-species').value = data.species_id;
                    document.getElementById('edit-population').value = data.population;
                    document.getElementById('edit-hectares').value = data.hectares || '';
                    document.getElementById('edit-health-status').value = data.health_status;
                    document.getElementById('edit-year').value = data.year;
                    document.getElementById('edit-latitude').value = data.latitude;
                    document.getElementById('edit-longitude').value = data.longitude;
                    document.getElementById('edit-notes').value = data.notes || '';
                    
                    // Handle image preview
                    const currentImagePreview = document.getElementById('edit-image-preview');
                    const currentImageContainer = document.getElementById('edit-image-preview-container');
                    if (data.image_url) {
                        currentImagePreview.src = data.image_url;
                        currentImageContainer.style.display = 'block';
                    } else {
                        currentImageContainer.style.display = 'none';
                    }
                    
                    // Reset new image preview
                    document.getElementById('edit-image-new-preview-container').style.display = 'none';
                    document.getElementById('edit-tree-image').value = '';
                } else {
                    // Fallback to row data if API fails
                    document.getElementById('edit-tree-id').value = treeId;
                    document.getElementById('edit-species').value = row.querySelector('[data-species]').dataset.species;
                    document.getElementById('edit-population').value = row.querySelector('[data-population]').dataset.population;
                    const hectares = row.querySelector('[data-hectares]')?.dataset.hectares || '';
                    document.getElementById('edit-hectares').value = hectares;
                    document.getElementById('edit-health-status').value = row.querySelector('[data-health_status]').dataset.health_status;
                    document.getElementById('edit-year').value = row.querySelector('[data-year]').dataset.year;
                    
                    const coordinates = row.querySelector('[data-coordinates]').dataset.coordinates.split(',');
                    document.getElementById('edit-latitude').value = coordinates[0];
                    document.getElementById('edit-longitude').value = coordinates[1];
                    
                    document.getElementById('edit-notes').value = row.querySelector('[data-notes]').dataset.notes || '';
                }
            } catch (error) {
                console.error('Error fetching tree details:', error);
                // Fallback to row data
                document.getElementById('edit-tree-id').value = treeId;
                document.getElementById('edit-species').value = row.querySelector('[data-species]').dataset.species;
                document.getElementById('edit-population').value = row.querySelector('[data-population]').dataset.population;
                const hectares = row.querySelector('[data-hectares]')?.dataset.hectares || '';
                document.getElementById('edit-hectares').value = hectares;
                document.getElementById('edit-health-status').value = row.querySelector('[data-health_status]').dataset.health_status;
                document.getElementById('edit-year').value = row.querySelector('[data-year]').dataset.year;
                
                const coordinates = row.querySelector('[data-coordinates]').dataset.coordinates.split(',');
                document.getElementById('edit-latitude').value = coordinates[0];
                document.getElementById('edit-longitude').value = coordinates[1];
                
                document.getElementById('edit-notes').value = row.querySelector('[data-notes]').dataset.notes || '';
            }

            // Show the edit modal
            editTreeModal.show();
        });
    });
    
    // Image preview for new image upload in edit form
    const editImageInput = document.getElementById('edit-tree-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const newPreviewContainer = document.getElementById('edit-image-new-preview-container');
            const newPreview = document.getElementById('edit-image-new-preview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    newPreview.src = e.target.result;
                    newPreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                newPreviewContainer.style.display = 'none';
            }
        });
    }

    // Save changes button click handler
    document.getElementById('saveTreeChanges').addEventListener('click', async () => {
        const form = document.getElementById('editTreeForm');
        const formData = new FormData(form);
        const treeId = formData.get('tree_id');

        try {
            const response = await fetch(`/edit-tree/${treeId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                    // Don't set Content-Type header - let browser set it with boundary for FormData
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                editTreeModal.hide();
                alert('Tree record updated successfully!');
                window.location.reload();
            } else {
                throw new Error(data.error || 'Failed to update tree record');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error updating tree record. Please try again.');
        }
    });

    // Delete button click handler
    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const treeId = button.dataset.id;
            if (confirm('Are you sure you want to delete this tree record?')) {
                try {
                    const response = await fetch(`/delete-tree/${treeId}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Accept': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const row = button.closest('tr');
                        row.remove();
                        alert('Tree record deleted successfully');
                    } else {
                        throw new Error(data.error || 'Failed to delete tree record');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert(error.message || 'Error deleting tree record. Please try again.');
                }
            }
        });
    });

    // Simple table search functionality
    const searchInput = document.getElementById("datasetSearch")
    const table = document.getElementById("datasetsTable")
  
    if (searchInput && table) {
      const tbody = table.getElementsByTagName("tbody")[0]
      const rows = tbody.getElementsByTagName("tr")
  
      searchInput.addEventListener("keyup", () => {
        const searchTerm = searchInput.value.toLowerCase()
  
        for (let i = 0; i < rows.length; i++) {
          const rowText = rows[i].textContent.toLowerCase()
          if (rowText.indexOf(searchTerm) > -1) {
            rows[i].style.display = ""
          } else {
            rows[i].style.display = "none"
            // Uncheck hidden rows
            const checkbox = rows[i].querySelector('.row-checkbox')
            if (checkbox) {
              checkbox.checked = false
            }
          }
        }
        // Update bulk actions visibility and select all state after search
        updateBulkActionsVisibility()
        updateSelectAllState()
      })
    }
  
    // Table sorting functionality
    const tableHeaders = document.querySelectorAll("#datasetsTable th[data-sort]")
  
    tableHeaders.forEach((header) => {
      header.addEventListener("click", function () {
        const sortBy = this.dataset.sort
        const sortDirection = this.classList.contains("sort-asc") ? "desc" : "asc"
  
        // Remove sort classes from all headers
        tableHeaders.forEach((h) => {
          h.classList.remove("sort-asc", "sort-desc")
        })
  
        // Add sort class to current header
        this.classList.add(`sort-${sortDirection}`)
  
        // Sort the table
        sortTable(sortBy, sortDirection)
      })
    })
  
    function sortTable(sortBy, direction) {
      const tbody = document.querySelector("#datasetsTable tbody")
      const rows = Array.from(tbody.querySelectorAll("tr"))
  
      // Sort the rows
      rows.sort((a, b) => {
        const aValue =
          a.querySelector(`td[data-${sortBy}]`).dataset[sortBy] ||
          a.querySelector(`td[data-${sortBy}]`).textContent.trim()
        const bValue =
          b.querySelector(`td[data-${sortBy}]`).dataset[sortBy] ||
          b.querySelector(`td[data-${sortBy}]`).textContent.trim()
  
        // Check if values are numbers
        const aNum = Number.parseFloat(aValue)
        const bNum = Number.parseFloat(bValue)
  
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === "asc" ? aNum - bNum : bNum - aNum
        }
  
        // Otherwise sort as strings
        return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      })
  
      // Remove all rows from the table
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild)
      }
  
      // Add sorted rows back to the table
      rows.forEach((row) => {
        tbody.appendChild(row)
      })
    }
  
    // Export functionality
    const exportButton = document.getElementById("exportDataBtn")
  
    if (exportButton) {
      exportButton.addEventListener("click", () => {
        const format = document.getElementById("exportFormat").value
        exportData(format)
      })
    }
  
    function exportData(format) {
      const table = document.getElementById("datasetsTable")
      if (!table) return
  
      const rows = table.querySelectorAll("tbody tr")
      const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim())
  
      // Prepare data array
      const data = []
      rows.forEach((row) => {
        const rowData = {}
        const cells = row.querySelectorAll("td")
        cells.forEach((cell, index) => {
          rowData[headers[index]] = cell.textContent.trim()
        })
        data.push(rowData)
      })
  
      switch (format) {
        case "csv":
          exportCSV(data, headers)
          break
        case "json":
          exportJSON(data)
          break
        case "excel":
          exportExcel(data, headers)
          break
        default:
          exportCSV(data, headers)
      }
    }
  
    function exportCSV(data, headers) {
      let csv = headers.join(",") + "\n"
  
      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || ""
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value
        })
        csv += values.join(",") + "\n"
      })
  
      downloadFile(csv, "endemic-trees-data.csv", "text/csv")
    }
  
    function exportJSON(data) {
      const json = JSON.stringify(data, null, 2)
      downloadFile(json, "endemic-trees-data.json", "application/json")
    }
  
    function exportExcel(data, headers) {
      // Simple Excel export (actually CSV with Excel MIME type)
      let csv = headers.join(",") + "\n"
  
      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || ""
          return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value
        })
        csv += values.join(",") + "\n"
      })
  
      downloadFile(csv, "endemic-trees-data.xls", "application/vnd.ms-excel")
    }
  
    function downloadFile(content, fileName, mimeType) {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
  
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
  
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    }
  })

  // ========== TREE SEEDS TABLE FUNCTIONALITY ==========
  
  // Seeds bulk delete functionality
  const selectAllSeedsCheckbox = document.getElementById('selectAllSeedsCheckbox');
  const rowSeedsCheckboxes = document.querySelectorAll('.row-checkbox-seed');
  const bulkActionsSeeds = document.getElementById('bulkActionsSeeds');
  const deleteSelectedSeedsBtn = document.getElementById('deleteSelectedSeedsBtn');
  const deleteAllSeedsBtn = document.getElementById('deleteAllSeedsBtn');
  
  // Function to update bulk actions visibility for seeds
  function updateBulkActionsSeedsVisibility() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox-seed:checked');
    if (checkedBoxes.length > 0) {
      bulkActionsSeeds.style.display = 'flex';
    } else {
      bulkActionsSeeds.style.display = 'none';
    }
  }
  
  // Function to update select all seeds checkbox state
  function updateSelectAllSeedsState() {
    if (selectAllSeedsCheckbox && rowSeedsCheckboxes.length > 0) {
      const allChecked = document.querySelectorAll('.row-checkbox-seed:checked').length === rowSeedsCheckboxes.length;
      selectAllSeedsCheckbox.checked = allChecked;
      selectAllSeedsCheckbox.indeterminate = !allChecked && 
                                           document.querySelectorAll('.row-checkbox-seed:checked').length > 0;
    }
  }
  
  // Select all seeds checkbox handler
  if (selectAllSeedsCheckbox) {
    selectAllSeedsCheckbox.addEventListener('change', () => {
      rowSeedsCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllSeedsCheckbox.checked;
      });
      updateBulkActionsSeedsVisibility();
    });
  }
  
  // Individual seed row checkbox handlers
  rowSeedsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateBulkActionsSeedsVisibility();
      updateSelectAllSeedsState();
    });
  });
  
  // Delete selected seeds button handler
  if (deleteSelectedSeedsBtn) {
    deleteSelectedSeedsBtn.addEventListener('click', async () => {
      // Get CSRF token again to ensure it's available
      const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
      if (!tokenElement) {
        alert('CSRF token not found. Please refresh the page.');
        return;
      }
      const token = tokenElement.value;
      
      const checkedBoxes = document.querySelectorAll('.row-checkbox-seed:checked');
      if (checkedBoxes.length === 0) {
        alert('Please select at least one record to delete.');
        return;
      }
      
      const seedIds = Array.from(checkedBoxes).map(cb => cb.dataset.seedId);
      const confirmMessage = `Are you sure you want to delete ${seedIds.length} seed record(s)?`;
      
      if (confirm(confirmMessage)) {
        try {
          const response = await fetch('/delete-seeds-bulk/', {
            method: 'POST',
            headers: {
              'X-CSRFToken': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ seed_ids: seedIds })
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            checkedBoxes.forEach(checkbox => {
              const row = checkbox.closest('tr');
              row.remove();
            });
            
            selectAllSeedsCheckbox.checked = false;
            selectAllSeedsCheckbox.indeterminate = false;
            updateBulkActionsSeedsVisibility();
            
            alert(`Successfully deleted ${data.deleted_count} seed record(s).`);
            window.location.reload();
          } else {
            throw new Error(data.error || 'Failed to delete selected seed records');
          }
        } catch (error) {
          console.error('Error:', error);
          alert(error.message || 'Error deleting selected seed records. Please try again.');
        }
      }
    });
  }
  
  // Delete all seeds button handler
  if (deleteAllSeedsBtn) {
    deleteAllSeedsBtn.addEventListener('click', async () => {
      // Get CSRF token again to ensure it's available
      const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
      if (!tokenElement) {
        alert('CSRF token not found. Please refresh the page.');
        return;
      }
      const token = tokenElement.value;
      
      const totalRows = rowSeedsCheckboxes.length;
      if (totalRows === 0) {
        alert('No seed records to delete.');
        return;
      }
      
      const confirmMessage = `Are you sure you want to delete ALL ${totalRows} seed record(s)? This action cannot be undone!`;
      
      if (confirm(confirmMessage)) {
        if (confirm('This will permanently delete all seed records. Are you absolutely sure?')) {
          try {
            const response = await fetch('/delete-all-seeds/', {
              method: 'POST',
              headers: {
                'X-CSRFToken': token,
                'Accept': 'application/json'
              }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
              alert(`Successfully deleted all ${data.deleted_count} seed record(s).`);
              window.location.reload();
            } else {
              throw new Error(data.error || 'Failed to delete all seed records');
            }
          } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error deleting all seed records. Please try again.');
          }
        }
      }
    });
  }
  
  // Seeds table search functionality
  const seedsSearchInput = document.getElementById("seedsSearch");
  const seedsTable = document.getElementById("seedsTable");
  
  if (seedsSearchInput && seedsTable) {
    const seedsTbody = seedsTable.getElementsByTagName("tbody")[0];
    const seedsRows = seedsTbody ? seedsTbody.getElementsByTagName("tr") : [];
    
    seedsSearchInput.addEventListener("keyup", () => {
      const searchTerm = seedsSearchInput.value.toLowerCase();
      
      for (let i = 0; i < seedsRows.length; i++) {
        const rowText = seedsRows[i].textContent.toLowerCase();
        if (rowText.indexOf(searchTerm) > -1) {
          seedsRows[i].style.display = "";
        } else {
          seedsRows[i].style.display = "none";
          const checkbox = seedsRows[i].querySelector('.row-checkbox-seed');
          if (checkbox) {
            checkbox.checked = false;
          }
        }
      }
      updateBulkActionsSeedsVisibility();
      updateSelectAllSeedsState();
    });
  }
  
  // Seeds table sorting functionality
  const seedsTableHeaders = document.querySelectorAll("#seedsTable th[data-sort]");
  
  seedsTableHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const sortBy = this.dataset.sort;
      const sortDirection = this.classList.contains("sort-asc") ? "desc" : "asc";
      
      seedsTableHeaders.forEach((h) => {
        h.classList.remove("sort-asc", "sort-desc");
      });
      
      this.classList.add(`sort-${sortDirection}`);
      sortSeedsTable(sortBy, sortDirection);
    });
  });
  
  function sortSeedsTable(sortBy, direction) {
    const tbody = document.querySelector("#seedsTable tbody");
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll("tr"));
    
    rows.sort((a, b) => {
      const aCell = a.querySelector(`td[data-${sortBy}]`);
      const bCell = b.querySelector(`td[data-${sortBy}]`);
      
      if (!aCell || !bCell) return 0;
      
      const aValue = aCell.dataset[sortBy] || aCell.textContent.trim();
      const bValue = bCell.dataset[sortBy] || bCell.textContent.trim();
      
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      
      if (sortBy === 'planting_date' || sortBy === 'germination_date' || sortBy === 'expected_maturity_date') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return direction === "asc" ? aDate - bDate : bDate - aDate;
        }
      }
      
      return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    
    rows.forEach((row) => {
      tbody.appendChild(row);
    });
  }
  
  // Seeds view button handlers
  const viewSeedButtons = document.querySelectorAll('.action-view-seed');
  const seedDetailsModalEl = document.getElementById('seedDetailsModal');
  const seedDetailsModal = seedDetailsModalEl ? new bootstrap.Modal(seedDetailsModalEl) : null;
  
  viewSeedButtons.forEach(button => {
    button.addEventListener('click', () => {
      const row = button.closest('tr');
      if (!row) return;
      
      const commonNameEl = document.getElementById('view-seed-common-name');
      const scientificNameEl = document.getElementById('view-seed-scientific-name');
      const quantityEl = document.getElementById('view-seed-quantity');
      const plantingDateEl = document.getElementById('view-seed-planting-date');
      const germinationStatusEl = document.getElementById('view-seed-germination-status');
      const germinationDateEl = document.getElementById('view-seed-germination-date');
      const survivalRateEl = document.getElementById('view-seed-survival-rate');
      const expectedMaturityDateEl = document.getElementById('view-seed-expected-maturity-date');
      const latitudeEl = document.getElementById('view-seed-latitude');
      const longitudeEl = document.getElementById('view-seed-longitude');
      const notesEl = document.getElementById('view-seed-notes');
      
      if (commonNameEl) commonNameEl.textContent = row.querySelector('[data-common_name]')?.dataset.common_name || '-';
      if (scientificNameEl) scientificNameEl.textContent = row.querySelector('[data-scientific_name]')?.dataset.scientific_name || '-';
      if (quantityEl) quantityEl.textContent = row.querySelector('[data-quantity]')?.dataset.quantity || '-';
      if (plantingDateEl) plantingDateEl.textContent = row.querySelector('[data-planting_date]')?.dataset.planting_date || '-';
      
      const germinationStatus = row.querySelector('[data-germination_status]')?.dataset.germination_status || '';
      if (germinationStatusEl) {
        germinationStatusEl.textContent = germinationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      if (germinationDateEl) germinationDateEl.textContent = row.querySelector('[data-germination_date]')?.dataset.germination_date || '-';
      
      const survivalRate = row.querySelector('[data-survival_rate]')?.dataset.survival_rate;
      if (survivalRateEl) survivalRateEl.textContent = survivalRate ? survivalRate + '%' : '-';
      
      const hectares = row.querySelector('[data-hectares]')?.dataset.hectares || 'N/A';
      const hectaresEl = document.getElementById('view-seed-hectares');
      if (hectaresEl) hectaresEl.textContent = hectares !== 'N/A' ? parseFloat(hectares).toFixed(2) + ' ha' : 'N/A';
      
      if (expectedMaturityDateEl) expectedMaturityDateEl.textContent = row.querySelector('[data-expected_maturity_date]')?.dataset.expected_maturity_date || '-';
      
      const coordinates = row.querySelector('[data-coordinates]')?.dataset.coordinates?.split(',') || ['-', '-'];
      if (latitudeEl) latitudeEl.textContent = coordinates[0];
      if (longitudeEl) longitudeEl.textContent = coordinates[1];
      
      const notes = row.querySelector('[data-notes]')?.dataset.notes;
      if (notesEl) notesEl.textContent = notes || 'No notes available';
      
      if (seedDetailsModal) {
        seedDetailsModal.show();
      }
    });
  });
  
  // Seeds edit button handlers
  const editSeedButtons = document.querySelectorAll('.action-edit-seed');
  const editSeedModalEl = document.getElementById('editSeedModal');
  const editSeedModal = editSeedModalEl ? new bootstrap.Modal(editSeedModalEl) : null;
  
  editSeedButtons.forEach(button => {
    button.addEventListener('click', () => {
      const row = button.closest('tr');
      const seedId = button.dataset.id;
      
      document.getElementById('edit-seed-id').value = seedId;
      const speciesCell = row.querySelector('[data-species]');
      if (speciesCell) {
        document.getElementById('edit-seed-species').value = speciesCell.dataset.species;
      }
      document.getElementById('edit-seed-quantity').value = row.querySelector('[data-quantity]').dataset.quantity;
      document.getElementById('edit-seed-planting-date').value = row.querySelector('[data-planting_date]').dataset.planting_date;
      document.getElementById('edit-seed-germination-status').value = row.querySelector('[data-germination_status]').dataset.germination_status;
      
      const germinationDate = row.querySelector('[data-germination_date]').dataset.germination_date;
      document.getElementById('edit-seed-germination-date').value = germinationDate || '';
      
      const survivalRate = row.querySelector('[data-survival_rate]').dataset.survival_rate;
      document.getElementById('edit-seed-survival-rate').value = survivalRate || '';
      
      const hectares = row.querySelector('[data-hectares]')?.dataset.hectares || '';
      document.getElementById('edit-seed-hectares').value = hectares;
      
      const expectedMaturityDate = row.querySelector('[data-expected_maturity_date]').dataset.expected_maturity_date;
      document.getElementById('edit-seed-expected-maturity-date').value = expectedMaturityDate || '';
      
      const coordinates = row.querySelector('[data-coordinates]').dataset.coordinates.split(',');
      document.getElementById('edit-seed-latitude').value = coordinates[0];
      document.getElementById('edit-seed-longitude').value = coordinates[1];
      
      document.getElementById('edit-seed-notes').value = row.querySelector('[data-notes]').dataset.notes || '';
      
      if (editSeedModal) {
        editSeedModal.show();
      }
    });
  });
  
  // Save seed changes button handler
  const saveSeedChangesBtn = document.getElementById('saveSeedChanges');
  if (saveSeedChangesBtn) {
    saveSeedChangesBtn.addEventListener('click', async () => {
      // Get CSRF token again to ensure it's available
      const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
      if (!tokenElement) {
        alert('CSRF token not found. Please refresh the page.');
        return;
      }
      const token = tokenElement.value;
      
      const form = document.getElementById('editSeedForm');
      if (!form) {
        alert('Edit form not found.');
        return;
      }
      const formData = new FormData(form);
      const seedId = formData.get('seed_id');
      
      if (!seedId) {
        alert('Seed ID not found.');
        return;
      }
      
      try {
        const response = await fetch(`/edit-seed/${seedId}/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': token
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (editSeedModal) {
            editSeedModal.hide();
          }
          window.location.reload();
        } else {
          throw new Error(data.error || 'Failed to update seed record');
        }
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error updating seed record. Please try again.');
      }
    });
  }
  
  // Seeds delete button handlers
  const deleteSeedButtons = document.querySelectorAll('.action-delete-seed');
  
  deleteSeedButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Get CSRF token again to ensure it's available
      const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
      if (!tokenElement) {
        alert('CSRF token not found. Please refresh the page.');
        return;
      }
      const token = tokenElement.value;
      
      const seedId = button.dataset.id;
      if (!seedId) {
        alert('Seed ID not found.');
        return;
      }
      
      if (confirm('Are you sure you want to delete this seed record?')) {
        try {
          const response = await fetch(`/delete-seed/${seedId}/`, {
            method: 'POST',
            headers: {
              'X-CSRFToken': token,
              'Accept': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (response.ok) {
            const row = button.closest('tr');
            row.remove();
            alert('Seed record deleted successfully');
            window.location.reload();
          } else {
            throw new Error(data.error || 'Failed to delete seed record');
          }
        } catch (error) {
          console.error('Error:', error);
          alert(error.message || 'Error deleting seed record. Please try again.');
        }
      }
    });
  });

  // Inline species image upload - submit via fetch to datasets page
  document.querySelectorAll('.species-image-form').forEach((form) => {
    const input = form.querySelector('.species-image-input')
    input.addEventListener('change', async () => {
      const fd = new FormData()
      fd.append('species_id', form.getAttribute('data-species-id'))
      fd.append('image', input.files[0])
      fd.append('csrfmiddlewaretoken', csrfToken)

      try {
        const res = await fetch(window.location.pathname, {
          method: 'POST',
          body: fd
        })
        if (!res.ok) throw new Error('Failed to upload image')
        window.location.reload()
      } catch (e) {
        alert(e.message)
      }
    })
  })
  