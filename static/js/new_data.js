document.addEventListener("DOMContentLoaded", () => {
    // Initialize modals
    const importModalElement = document.getElementById('importModal');
    const deleteModalElement = document.getElementById('deleteModal');
    
    const importModal = new bootstrap.Modal(importModalElement);
    const deleteModal = new bootstrap.Modal(deleteModalElement);
    
    let currentImportId = null;
    let currentDeleteId = null;
    let currentRecord = null;
    
    // Update stats
    function updateStats() {
        const rows = document.querySelectorAll('#dataTableBody tr:not(.empty-row)');
        const totalRecords = rows.length;
        const availableRecords = document.querySelectorAll('.import-btn').length;
        
        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('availableRecords').textContent = availableRecords;
    }

    // ---------------- Health Distribution Validation (Import Modal) ----------------
    const importPopulation = document.getElementById('importPopulation');
    const importPopulationCount = document.getElementById('import-population-count');
    const importHealthy = document.getElementById('import_healthy_count');
    const importGood = document.getElementById('import_good_count');
    const importBad = document.getElementById('import_bad_count');
    const importDeceased = document.getElementById('import_deceased_count');
    const importProgressBar = document.getElementById('import-health-progress-bar');
    const importStatusMsg = document.getElementById('import-health-status-message');

    function validateImportHealthCounts() {
        if (!(importPopulation && importHealthy && importGood && importBad && importDeceased && importProgressBar && importStatusMsg)) {
            return true; // If UI not present, don't block
        }
        const confirmBtn = document.getElementById('confirmImportBtn');
        const population = parseInt(importPopulation.value || '0');
        const healthy = parseInt(importHealthy.value || '0');
        const good = parseInt(importGood.value || '0');
        const bad = parseInt(importBad.value || '0');
        const deceased = parseInt(importDeceased.value || '0');
        const total = healthy + good + bad + deceased;

        if (importPopulationCount) importPopulationCount.textContent = population;

        const pct = population > 0 ? Math.min(100, Math.round((total / population) * 100)) : 0;
        importProgressBar.style.width = `${pct}%`;
        importProgressBar.textContent = `${pct}%`;
        importProgressBar.setAttribute('aria-valuenow', pct);

        if (total === population) {
            importProgressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            importStatusMsg.textContent = 'Health status counts match the total population!';
            importStatusMsg.style.color = '#4CAF50';
            confirmBtn && (confirmBtn.disabled = false);
            return true;
        } else if (total > population) {
            importProgressBar.style.background = '#F44336';
            importStatusMsg.textContent = `Health status total (${total}) exceeds population (${population})!`;
            importStatusMsg.style.color = '#F44336';
            confirmBtn && (confirmBtn.disabled = true);
            return false;
        } else {
            importProgressBar.style.background = '#FF9800';
            importStatusMsg.textContent = `Health status total (${total}) is less than population (${population})`;
            importStatusMsg.style.color = '#FF9800';
            confirmBtn && (confirmBtn.disabled = true);
            return false;
        }
    }

    // Hook up listeners (input + change)
    function bindImportHealthListeners() {
        if (importPopulation) {
            importPopulation.addEventListener('input', validateImportHealthCounts);
            importPopulation.addEventListener('change', validateImportHealthCounts);
        }
        [importHealthy, importGood, importBad, importDeceased].forEach(el => {
            if (el) {
                el.addEventListener('input', validateImportHealthCounts);
                el.addEventListener('change', validateImportHealthCounts);
            }
        });

        // Event delegation fallback (in case elements are re-rendered)
        document.addEventListener('input', (e) => {
            const id = e.target && e.target.id;
            if (id === 'importPopulation' || id === 'import_healthy_count' || id === 'import_good_count' || id === 'import_bad_count' || id === 'import_deceased_count') {
                validateImportHealthCounts();
            }
        }, true);
        document.addEventListener('change', (e) => {
            const id = e.target && e.target.id;
            if (id === 'importPopulation' || id === 'import_healthy_count' || id === 'import_good_count' || id === 'import_bad_count' || id === 'import_deceased_count') {
                validateImportHealthCounts();
            }
        }, true);
    }

    bindImportHealthListeners();
    // Initialize message once on load
    validateImportHealthCounts();

    // Also re-validate whenever the modal becomes visible
    if (importModalElement) {
        importModalElement.addEventListener('shown.bs.modal', () => {
            // Update the population label in case the input was prefilled
            validateImportHealthCounts();
            // Run a short timed loop to catch late DOM paints/auto-filled values
            let ticks = 0;
            const timer = setInterval(() => {
                validateImportHealthCounts();
                ticks++;
                if (ticks > 10) clearInterval(timer); // ~1s total at 100ms each
            }, 100);
        });
    }
    
    // Initialize stats
    updateStats();
    
    // Refresh data button
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    

    // Import button handlers
    document.querySelectorAll('.import-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentImportId = this.getAttribute('data-id');
            
            // Create record object from data attributes
            currentRecord = {
                id: this.getAttribute('data-id'),
                tree_description: this.getAttribute('data-tree-description'),
                latitude: this.getAttribute('data-latitude'),
                longitude: this.getAttribute('data-longitude'),
                person_name: this.getAttribute('data-person-name')
            };
            
            // Populate the import form with Supabase data
            populateImportForm(currentRecord);
            
            importModal.show();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDeleteId = this.getAttribute('data-id');
            const treeDescription = this.getAttribute('data-tree-description');
            
            // Update modal content
            document.getElementById('deleteSpeciesName').textContent = treeDescription;
            
            deleteModal.show();
        });
    });
    
    // Confirm import
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', () => {
            if (currentImportId) {
                // Run validation before importing
                if (!validateImportHealthCounts()) {
                    alert('Health status total must equal the population before importing.');
                    return;
                }
                importDataWithForm();
            }
        });
    }
    
    // Confirm delete
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (currentDeleteId) {
                deleteData(currentDeleteId);
            }
        });
    }
    
    // Import data function
    function importData(supabaseId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch('/api/supabase-data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                supabase_id: supabaseId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Successfully imported data: ' + data.message);
                // Remove the import button for this row
                const row = document.querySelector(`tr[data-id="${supabaseId}"]`);
                if (row) {
                    const importBtn = row.querySelector('.import-btn');
                    if (importBtn) {
                        importBtn.remove();
                    }
                }
                updateStats();
            } else {
                alert('Error importing data: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error importing data: ' + error.message);
        })
        .finally(() => {
            importModal.hide();
        });
    }
    
    // Delete data function
    function deleteData(supabaseId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch('/api/supabase-data/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                supabase_id: supabaseId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Successfully deleted data: ' + data.message);
                // Remove the row from the table
                const row = document.querySelector(`tr[data-id="${supabaseId}"]`);
                if (row) {
                    row.remove();
                }
                updateStats();
            } else {
                alert('Error deleting data: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting data: ' + error.message);
        })
        .finally(() => {
            deleteModal.hide();
        });
    }
    
    
    // Populate import form function
    function populateImportForm(record) {
        document.getElementById('importSupabaseId').value = record.id;
        
        // Extract common name from tree description if possible
        const treeDescription = record.tree_description || '';
        const commonName = treeDescription.split(' ')[0] || ''; // Use first word as common name
        
        document.getElementById('importCommonName').value = commonName;
        document.getElementById('importScientificName').value = ''; // User needs to fill this
        document.getElementById('importFamily').value = ''; // User needs to fill this
        document.getElementById('importGenus').value = ''; // User needs to fill this
        document.getElementById('importLatitude').value = record.latitude || '';
        document.getElementById('importLongitude').value = record.longitude || '';
        document.getElementById('importPopulation').value = '1'; // Default population
        document.getElementById('importYear').value = new Date().getFullYear();
        document.getElementById('importHealthStatus').value = 'good'; // Default health status
        document.getElementById('importLocationName').value = `Location for ${commonName}`;
        document.getElementById('importNotes').value = `Imported from Supabase. Original description: ${treeDescription}. Reported by: ${record.person_name || 'Unknown'}`;

        // Initialize health distribution defaults
        const popInput = document.getElementById('importPopulation');
        const healthy = document.getElementById('import_healthy_count');
        const good = document.getElementById('import_good_count');
        const bad = document.getElementById('import_bad_count');
        const deceased = document.getElementById('import_deceased_count');
        if (popInput && healthy && good && bad && deceased) {
            document.getElementById('import-population-count').textContent = Number(popInput.value || 0);
            healthy.value = 0; good.value = 0; bad.value = 0; deceased.value = 0;
            validateImportHealthCounts();
        }
    }
    
    // Import data with form function
    function importDataWithForm() {
        const form = document.getElementById('importForm');
        const formData = new FormData(form);
        
        // Convert FormData to JSON
        const data = {
            supabase_id: formData.get('supabase_id'),
            common_name: formData.get('common_name'),
            scientific_name: formData.get('scientific_name'),
            family: formData.get('family'),
            genus: formData.get('genus'),
            latitude: parseFloat(formData.get('latitude')),
            longitude: parseFloat(formData.get('longitude')),
            population: parseInt(formData.get('population')),
            year: parseInt(formData.get('year')),
            health_status: formData.get('health_status'),
            location_name: formData.get('location_name'),
            notes: formData.get('notes')
        };

        // Include health distribution counts in payload for server-side validation (even if not stored)
        const healthy = document.getElementById('import_healthy_count');
        const good = document.getElementById('import_good_count');
        const bad = document.getElementById('import_bad_count');
        const deceased = document.getElementById('import_deceased_count');
        if (healthy && good && bad && deceased) {
            data.healthy_count = parseInt(healthy.value || '0');
            data.good_count = parseInt(good.value || '0');
            data.bad_count = parseInt(bad.value || '0');
            data.deceased_count = parseInt(deceased.value || '0');
        }
        
        const csrfToken = formData.get('csrfmiddlewaretoken');
        
        fetch('/api/supabase-data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Successfully imported data: ' + data.message);
                // Remove the import button for this row
                const row = document.querySelector(`tr[data-id="${currentImportId}"]`);
                if (row) {
                    const importBtn = row.querySelector('.import-btn');
                    if (importBtn) {
                        importBtn.remove();
                    }
                }
                updateStats();
            } else {
                alert('Error importing data: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error importing data: ' + error.message);
        })
        .finally(() => {
            importModal.hide();
        });
    }
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
        // Only refresh if no modals are open
        if (!importModal._isShown && !deleteModal._isShown) {
            // You can add auto-refresh logic here if needed
        }
    }, 30000);
});
