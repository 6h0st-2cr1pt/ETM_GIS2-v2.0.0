document.addEventListener("DOMContentLoaded", () => {
    // Get CSRF token
    const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!csrfTokenElement) {
        console.error('CSRF token not found on page');
        return;
    }
    const csrfToken = csrfTokenElement.value;

    // ========== PAGINATION FUNCTIONALITY ==========
    const itemsPerPage = 10;
    let currentPage = 1;
    const table = document.getElementById("datasetsTable");
    const tbody = table ? table.getElementsByTagName("tbody")[0] : null;
    let allRows = tbody ? Array.from(tbody.getElementsByTagName("tr")) : [];
    let filteredRows = allRows;
    let totalRows = allRows.length;
    
    // ========== FILTER FUNCTIONALITY ==========
    const filterCommonName = document.getElementById('filterCommonName');
    const filterAddress = document.getElementById('filterAddress');
    const filterYear = document.getElementById('filterYear');
    
    function applyFilters() {
        const commonNameValue = filterCommonName ? filterCommonName.value : '';
        const addressValue = filterAddress ? filterAddress.value : '';
        const yearValue = filterYear ? filterYear.value : '';
        
        filteredRows = allRows.filter(row => {
            // Get cells by their data attributes
            const commonNameCell = row.querySelector('td[data-common_name]');
            const addressCell = row.querySelector('td[data-address]');
            const yearCell = row.querySelector('td[data-year]');
            
            // Extract values from data attributes or text content
            const rowCommonName = commonNameCell ? (commonNameCell.getAttribute('data-common_name') || commonNameCell.textContent.trim()) : '';
            const rowAddress = addressCell ? (addressCell.getAttribute('data-address') || (addressCell.textContent.trim() === '-' ? '' : addressCell.textContent.trim())) : '';
            const rowYear = yearCell ? (yearCell.getAttribute('data-year') || yearCell.textContent.trim()) : '';
            
            // Match logic: empty filter means show all
            const matchesCommonName = !commonNameValue || rowCommonName === commonNameValue;
            const matchesAddress = !addressValue || rowAddress === addressValue;
            const matchesYear = !yearValue || String(rowYear) === String(yearValue);
            
            return matchesCommonName && matchesAddress && matchesYear;
        });
        
        totalRows = filteredRows.length;
        currentPage = 1;
        
        // Re-initialize pagination with filtered rows
        if (totalRows >= itemsPerPage) {
            initializePagination();
        } else {
            // Show all filtered rows if less than itemsPerPage
            allRows.forEach(row => row.style.display = 'none');
            filteredRows.forEach(row => row.style.display = '');
            const paginationContainer = document.querySelector('.datasets-pagination');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            updatePaginationInfo();
        }
    }
    
    // Add event listeners for filters
    if (filterCommonName) {
        filterCommonName.addEventListener('change', applyFilters);
    }
    if (filterAddress) {
        filterAddress.addEventListener('change', applyFilters);
    }
    if (filterYear) {
        filterYear.addEventListener('change', applyFilters);
    }
    
    // Only enable pagination if there are 10 or more rows
    if (totalRows >= itemsPerPage) {
        initializePagination();
    } else {
        // Hide pagination controls if less than 10 rows
        const paginationContainer = document.querySelector('.datasets-pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }
    
    function initializePagination() {
        const totalPages = Math.ceil(totalRows / itemsPerPage);
        
        // Update pagination info
        updatePaginationInfo();
        
        // Create page buttons
        createPageButtons(totalPages);
        
        // Show first page
        showPage(1);
        
        // Event listeners for navigation
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    showPage(currentPage - 1);
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    showPage(currentPage + 1);
                }
            });
        }
    }
    
    function showPage(page) {
        currentPage = page;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Hide all rows first
        allRows.forEach(row => row.style.display = 'none');
        
        // Show only filtered rows for current page
        filteredRows.forEach((row, index) => {
            if (index >= startIndex && index < endIndex) {
                row.style.display = '';
            }
        });
        
        // Update pagination info
        updatePaginationInfo();
        
        // Update page buttons
        updatePageButtons();
        
        // Update navigation buttons
        updateNavigationButtons();
    }
    
    function updatePaginationInfo() {
        const startIndex = totalRows > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
        const endIndex = Math.min(currentPage * itemsPerPage, totalRows);
        
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalEntries = document.getElementById('total-entries');
        
        if (showingStart) showingStart.textContent = startIndex;
        if (showingEnd) showingEnd.textContent = endIndex;
        if (totalEntries) totalEntries.textContent = totalRows;
    }
    
    function createPageButtons(totalPages) {
        const paginationControls = document.querySelector('.pagination-controls');
        if (!paginationControls) return;
        
        // Clear existing page buttons (keep prev/next)
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        paginationControls.innerHTML = '';
        
        // Re-add prev button
        if (prevButton) {
            paginationControls.appendChild(prevButton);
        } else {
            const prev = document.createElement('button');
            prev.className = 'pagination-button';
            prev.id = 'prev-page';
            prev.textContent = '« Previous';
            prev.disabled = true;
            prev.addEventListener('click', () => {
                if (currentPage > 1) {
                    showPage(currentPage - 1);
                }
            });
            paginationControls.appendChild(prev);
        }
        
        // Create only 3 page number buttons (will be updated dynamically)
        for (let i = 1; i <= Math.min(3, totalPages); i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-button';
            pageButton.dataset.pageNum = i;
            pageButton.textContent = i;
            if (i === 1) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                const pageNum = parseInt(pageButton.dataset.pageNum);
                showPage(pageNum);
            });
            paginationControls.appendChild(pageButton);
        }
        
        // Re-add next button
        if (nextButton) {
            paginationControls.appendChild(nextButton);
        } else {
            const next = document.createElement('button');
            next.className = 'pagination-button';
            next.id = 'next-page';
            next.textContent = 'Next »';
            next.disabled = totalPages <= 1;
            next.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    showPage(currentPage + 1);
                }
            });
            paginationControls.appendChild(next);
        }
    }
    
    function updatePageButtons() {
        const totalPages = Math.ceil(totalRows / itemsPerPage);
        const pageButtons = document.querySelectorAll('.pagination-controls .pagination-button:not(#prev-page):not(#next-page)');
        
        // Calculate which 3 pages to show
        let startPage, endPage;
        
        if (totalPages <= 3) {
            // If 3 or fewer pages, show all
            startPage = 1;
            endPage = totalPages;
        } else if (currentPage <= 2) {
            // If on page 1 or 2, show pages 1, 2, 3
            startPage = 1;
            endPage = 3;
        } else if (currentPage >= totalPages - 1) {
            // If on last or second-to-last page, show last 3 pages
            startPage = totalPages - 2;
            endPage = totalPages;
        } else {
            // Otherwise, show current page - 1, current, current + 1
            startPage = currentPage - 1;
            endPage = currentPage + 1;
        }
        
        // Update the page buttons
        pageButtons.forEach((button, index) => {
            const pageNum = startPage + index;
            if (pageNum <= totalPages) {
                button.dataset.pageNum = pageNum;
                button.textContent = pageNum;
                button.style.display = '';
                
                if (pageNum === currentPage) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            } else {
                // Hide extra buttons if not needed
                button.style.display = 'none';
            }
        });
    }
    
    function updateNavigationButtons() {
        const totalPages = Math.ceil(totalRows / itemsPerPage);
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        if (prevButton) {
            prevButton.disabled = currentPage === 1;
        }
        
        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
        }
    }
    
    // Edit button handlers
    const editButtons = document.querySelectorAll('.action-edit');
    
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
    const editTreeModal = new bootstrap.Modal(document.getElementById('editTreeModal'));

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
                    document.getElementById('edit-species-id').value = data.species_id;
                    document.getElementById('edit-common-name').value = data.common_name || '';
                    document.getElementById('edit-scientific-name').value = data.scientific_name || '';
                    document.getElementById('edit-family').value = data.family || '';
                    document.getElementById('edit-genus').value = data.genus || '';
                    document.getElementById('edit-hectares').value = data.hectares || '';
                    document.getElementById('edit-year').value = data.year;
                    document.getElementById('edit-is-healthy').value = data.is_healthy ? 'true' : 'false';
                    document.getElementById('edit-is-planted').value = data.is_planted ? 'true' : 'false';
                    document.getElementById('edit-height').value = data.height_meters || '';
                    document.getElementById('edit-diameter-breast').value = data.diameter_cm || '';
                    document.getElementById('edit-address').value = data.address || '';
                    document.getElementById('edit-latitude').value = data.latitude;
                    document.getElementById('edit-longitude').value = data.longitude;
                } else {
                    // Fallback to row data if API fails
                    populateEditFormFromRow(row, treeId);
                }
            } catch (error) {
                console.error('Error fetching tree details:', error);
                // Fallback to row data
                populateEditFormFromRow(row, treeId);
            }

            // Show the edit modal
            editTreeModal.show();
        });
    });
    
    // Function to populate edit form from row data
    function populateEditFormFromRow(row, treeId) {
        document.getElementById('edit-tree-id').value = treeId;
        const commonName = row.querySelector('[data-common_name]')?.getAttribute('data-common_name') || '';
        const scientificName = row.querySelector('[data-scientific_name]')?.getAttribute('data-scientific_name') || '';
        const family = row.querySelector('[data-family]')?.getAttribute('data-family') || '';
        const genus = row.querySelector('[data-genus]')?.getAttribute('data-genus') || '';
        
        document.getElementById('edit-common-name').value = commonName;
        document.getElementById('edit-scientific-name').value = scientificName;
        document.getElementById('edit-family').value = family;
        document.getElementById('edit-genus').value = genus;
        document.getElementById('edit-hectares').value = row.querySelector('[data-hectars]')?.getAttribute('data-hectars') || '';
        document.getElementById('edit-year').value = row.querySelector('[data-year]')?.getAttribute('data-year') || '';
        document.getElementById('edit-latitude').value = row.querySelector('[data-latitude]')?.getAttribute('data-latitude') || '';
        document.getElementById('edit-longitude').value = row.querySelector('[data-longitude]')?.getAttribute('data-longitude') || '';
        document.getElementById('edit-address').value = row.querySelector('[data-address]')?.getAttribute('data-address') || '';
        const height = row.querySelector('[data-height]')?.getAttribute('data-height') || '';
        document.getElementById('edit-height').value = height;
        const diameter = row.querySelector('[data-diameter_breast]')?.getAttribute('data-diameter_breast') || '';
        document.getElementById('edit-diameter-breast').value = diameter;
        const healthy = row.querySelector('[data-healthy]')?.getAttribute('data-healthy') || '0';
        document.getElementById('edit-is-healthy').value = healthy === '1' ? 'true' : 'false';
        const planted = row.querySelector('[data-planted]')?.getAttribute('data-planted') || '0';
        document.getElementById('edit-is-planted').value = planted === '1' ? 'true' : 'false';
    }
    
    // Initialize autocomplete for edit common name field
    let editAutocompleteSuggestions = [];
    let editSelectedSuggestionIndex = -1;
    let editUserSelectedFromDropdown = false;
    
    function initializeEditAutocomplete() {
        const editCommonNameInput = document.getElementById('edit-common-name');
        const editSuggestionsContainer = document.getElementById('editCommonNameSuggestions');
        
        if (!editCommonNameInput || !editSuggestionsContainer) return;
        
        // Load suggestions
        fetch("/api/endemic-trees-list/")
            .then(response => response.json())
            .then(data => {
                if (data.success && data.trees) {
                    editAutocompleteSuggestions = data.trees;
                }
            })
            .catch(error => {
                console.error("Error loading autocomplete suggestions:", error);
            });
        
        // Handle input
        editCommonNameInput.addEventListener('input', function(e) {
            const value = this.value.trim();
            editUserSelectedFromDropdown = false;
            
            if (value.length === 0) {
                editSuggestionsContainer.style.display = 'none';
                editSelectedSuggestionIndex = -1;
                return;
            }
            
            const filtered = editAutocompleteSuggestions.filter(tree => 
                tree.common_name.toLowerCase().includes(value.toLowerCase())
            );
            
            if (filtered.length > 0) {
                displayEditSuggestions(filtered, editSuggestionsContainer);
            } else {
                editSuggestionsContainer.style.display = 'none';
            }
        });
        
        // Handle blur
        editCommonNameInput.addEventListener('blur', function() {
            setTimeout(() => {
                if (!editUserSelectedFromDropdown && this.value.trim()) {
                    const exactMatch = editAutocompleteSuggestions.find(tree => 
                        tree.common_name.toLowerCase() === this.value.trim().toLowerCase()
                    );
                    
                    if (!exactMatch) {
                        this.value = '';
                        editSuggestionsContainer.style.display = 'none';
                        // Clear auto-filled fields
                        document.getElementById('edit-scientific-name').value = '';
                        document.getElementById('edit-family').value = '';
                        document.getElementById('edit-genus').value = '';
                    }
                }
                editSuggestionsContainer.style.display = 'none';
                editSelectedSuggestionIndex = -1;
                editUserSelectedFromDropdown = false;
            }, 250);
        });
        
        // Handle keyboard navigation
        editCommonNameInput.addEventListener('keydown', function(e) {
            const suggestions = editSuggestionsContainer.querySelectorAll('.autocomplete-suggestion');
            if (suggestions.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                editSelectedSuggestionIndex = Math.min(editSelectedSuggestionIndex + 1, suggestions.length - 1);
                updateEditSelectedSuggestion(suggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                editSelectedSuggestionIndex = Math.max(editSelectedSuggestionIndex - 1, -1);
                updateEditSelectedSuggestion(suggestions);
            } else if (e.key === 'Enter' && editSelectedSuggestionIndex >= 0) {
                e.preventDefault();
                const selected = suggestions[editSelectedSuggestionIndex];
                if (selected) {
                    selectEditSuggestion(selected);
                }
            } else if (e.key === 'Escape') {
                editSuggestionsContainer.style.display = 'none';
                editSelectedSuggestionIndex = -1;
            }
        });
    }
    
    function displayEditSuggestions(suggestions, container) {
        container.innerHTML = '';
        editSelectedSuggestionIndex = -1;
        
        suggestions.slice(0, 10).forEach((tree, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-suggestion';
            div.dataset.index = index;
            div.dataset.commonName = tree.common_name;
            div.dataset.scientificName = tree.scientific_name;
            div.dataset.family = tree.family || '';
            div.dataset.genus = tree.genus || '';
            div.innerHTML = `<strong>${tree.common_name}</strong> <em>(${tree.scientific_name})</em>`;
            
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
            
            div.addEventListener('click', () => {
                selectEditSuggestion(div);
            });
            
            div.addEventListener('mouseenter', () => {
                editSelectedSuggestionIndex = index;
                updateEditSelectedSuggestion(container.querySelectorAll('.autocomplete-suggestion'));
            });
            
            container.appendChild(div);
        });
        
        container.style.display = 'block';
    }
    
    function updateEditSelectedSuggestion(suggestions) {
        suggestions.forEach((suggestion, index) => {
            if (index === editSelectedSuggestionIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }
    
    function selectEditSuggestion(suggestionElement) {
        const commonNameInput = document.getElementById('edit-common-name');
        const suggestionsContainer = document.getElementById('editCommonNameSuggestions');
        
        const treeData = {
            common_name: suggestionElement.dataset.commonName,
            scientific_name: suggestionElement.dataset.scientificName,
            family: suggestionElement.dataset.family,
            genus: suggestionElement.dataset.genus,
        };
        
        commonNameInput.value = treeData.common_name;
        editUserSelectedFromDropdown = true;
        suggestionsContainer.style.display = 'none';
        editSelectedSuggestionIndex = -1;
        
        // Auto-populate taxonomy fields
        document.getElementById('edit-scientific-name').value = treeData.scientific_name;
        document.getElementById('edit-family').value = treeData.family;
        document.getElementById('edit-genus').value = treeData.genus;
    }
    
    // Initialize autocomplete when modal is shown
    const editTreeModalElement = document.getElementById('editTreeModal');
    if (editTreeModalElement) {
        editTreeModalElement.addEventListener('shown.bs.modal', function() {
            initializeEditAutocomplete();
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
  
    if (searchInput && table) {
      searchInput.addEventListener("keyup", () => {
        const searchTerm = searchInput.value.toLowerCase()
        const paginationContainer = document.querySelector('.datasets-pagination')
  
        if (searchTerm.trim() === '') {
          // No search term - re-enable pagination if there are 10+ rows
          if (totalRows >= itemsPerPage) {
            showPage(1)
            if (paginationContainer) {
              paginationContainer.style.display = ''
            }
          }
        } else {
          // Search active - show all matching results, temporarily disable pagination
          if (paginationContainer) {
            paginationContainer.style.display = 'none'
          }
          
          // Show/hide rows based on search
          allRows.forEach((row) => {
            const rowText = row.textContent.toLowerCase()
          if (rowText.indexOf(searchTerm) > -1) {
              row.style.display = ""
          } else {
              row.style.display = "none"
            // Uncheck hidden rows
              const checkbox = row.querySelector('.row-checkbox')
            if (checkbox) {
              checkbox.checked = false
            }
          }
          })
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
        // Export as CSV only
        exportData("csv")
      })
    }
  
    function exportData(format) {
      const table = document.getElementById("datasetsTable")
      if (!table) return
  
      const rows = table.querySelectorAll("tbody tr")
      const allHeaders = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim())
      
      // Define the columns to export (in order)
      const exportColumns = [
        "COMMON NAME",
        "SCIENTIFIC NAME",
        "FAMILY",
        "GENUS",
        "HECTARS",
        "PLANTED",
        "EXISTING",
        "HEIGHT",
        "DIAMETER BREAST",
        "HEALTHY",
        "NOT HEALTHY",
        "LATITUDE",
        "LONGITUDE",
        "ADDRESS",
        "YEAR"
      ]
      
      // Filter headers to only include export columns
      const headers = exportColumns.filter(col => allHeaders.includes(col))
  
      // Prepare data array
      const data = []
      rows.forEach((row) => {
        const rowData = {}
        const cells = row.querySelectorAll("td")
        
        // Map all headers to cell values
        allHeaders.forEach((header, index) => {
          if (cells[index]) {
            const cell = cells[index]
            // Try to get value from data attribute first (more reliable for raw values)
            // Map header to data attribute name
            const dataAttrMap = {
              "COMMON NAME": "common_name",
              "SCIENTIFIC NAME": "scientific_name",
              "FAMILY": "family",
              "GENUS": "genus",
              "HECTARS": "hectars",
              "PLANTED": "planted",
              "EXISTING": "existing",
              "HEIGHT": "height",
              "DIAMETER BREAST": "diameter_breast",
              "HEALTHY": "healthy",
              "NOT HEALTHY": "not_healthy",
              "LATITUDE": "latitude",
              "LONGITUDE": "longitude",
              "ADDRESS": "address",
              "YEAR": "year"
            }
            
            const dataAttr = dataAttrMap[header]
            let value = ""
            
            if (dataAttr) {
              // Try to get value from data attribute (raw value without formatting)
              // Handle both camelCase (data-common-name) and underscore (data-common_name) formats
              const dataAttrValue = cell.getAttribute(`data-${dataAttr}`)
              if (dataAttrValue !== null) {
                value = dataAttrValue
              } else {
                // Fall back to text content
                value = cell.textContent.trim()
              }
            } else {
              // Fall back to text content
              value = cell.textContent.trim()
            }
            
            rowData[header] = value
          }
        })
        
        // Only include export columns in the data
        const filteredRowData = {}
        headers.forEach(header => {
          filteredRowData[header] = rowData[header] || ""
        })
        
        data.push(filteredRowData)
      })
  
      switch (format) {
        case "csv":
          exportCSV(data, headers)
          break
        case "json":
          exportJSON(data, headers)
          break
        case "excel":
          exportExcel(data, headers)
          break
        default:
          exportCSV(data, headers)
      }
    }
  
    function exportCSV(data, headers) {
      // Create CSV header row
      let csv = headers.join(",") + "\n"
  
      data.forEach((row) => {
        const values = headers.map((header) => {
          let value = row[header] || ""
          // Clean up value - remove HTML tags, extra whitespace
          value = value.replace(/<[^>]*>/g, "").trim()
          // Handle empty values
          if (value === "" || value === "-") {
            value = ""
          }
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (value.includes(",") || value.includes("\n") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csv += values.join(",") + "\n"
      })
  
      downloadFile(csv, "endemic-trees-data.csv", "text/csv")
    }
  
    function exportJSON(data, headers) {
      // Clean up data - remove HTML tags and format properly
      const cleanedData = data.map(row => {
        const cleanedRow = {}
        headers.forEach(header => {
          let value = row[header] || ""
          value = value.replace(/<[^>]*>/g, "").trim()
          if (value === "" || value === "-") {
            cleanedRow[header] = null
          } else {
            cleanedRow[header] = value
          }
        })
        return cleanedRow
      })
      
      const json = JSON.stringify(cleanedData, null, 2)
      downloadFile(json, "endemic-trees-data.json", "application/json")
    }
  
    function exportExcel(data, headers) {
      // Simple Excel export (actually CSV with Excel MIME type)
      let csv = headers.join(",") + "\n"
  
      data.forEach((row) => {
        const values = headers.map((header) => {
          let value = row[header] || ""
          // Clean up value - remove HTML tags, extra whitespace
          value = value.replace(/<[^>]*>/g, "").trim()
          // Handle empty values
          if (value === "" || value === "-") {
            value = ""
          }
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (value.includes(",") || value.includes("\n") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
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
  