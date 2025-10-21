document.addEventListener("DOMContentLoaded", () => {
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // View and Edit button handlers
    const viewButtons = document.querySelectorAll('.action-view');
    const editButtons = document.querySelectorAll('.action-edit');
    const deleteButtons = document.querySelectorAll('.action-delete');

    // Initialize Bootstrap modals
    const treeDetailsModal = new bootstrap.Modal(document.getElementById('treeDetailsModal'));
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

    // Edit button click handler
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            const treeId = button.dataset.id;
            
            // Populate edit form with data from the row
            document.getElementById('edit-tree-id').value = treeId;
            document.getElementById('edit-species').value = row.querySelector('[data-species]').dataset.species;
            document.getElementById('edit-population').value = row.querySelector('[data-population]').dataset.population;
            document.getElementById('edit-health-status').value = row.querySelector('[data-health_status]').dataset.health_status;
            document.getElementById('edit-year').value = row.querySelector('[data-year]').dataset.year;
            
            const coordinates = row.querySelector('[data-coordinates]').dataset.coordinates.split(',');
            document.getElementById('edit-latitude').value = coordinates[0];
            document.getElementById('edit-longitude').value = coordinates[1];
            
            document.getElementById('edit-notes').value = row.querySelector('[data-notes]').dataset.notes || '';

            // Show the edit modal
            editTreeModal.show();
        });
    });

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
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                editTreeModal.hide();
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
      const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr")
  
      searchInput.addEventListener("keyup", () => {
        const searchTerm = searchInput.value.toLowerCase()
  
        for (let i = 0; i < rows.length; i++) {
          const rowText = rows[i].textContent.toLowerCase()
          if (rowText.indexOf(searchTerm) > -1) {
            rows[i].style.display = ""
          } else {
            rows[i].style.display = "none"
          }
        }
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
  