// Global chart instances
let populationByAddressChart = null
let totalPopulationByAddressChart = null
let healthBySpeciesChart = null
let scatterChart = null

document.addEventListener("DOMContentLoaded", () => {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded!")
    alert("Error: Chart.js library is not loaded. Please refresh the page.")
    return
  }

  console.log("Chart.js loaded successfully")
  
  // Initialize year filters for all charts
  initializeYearFilters()
  
  const chartCtx = document.getElementById("populationByAddressChart")
  if (!chartCtx) {
    console.error("Chart canvas element not found!")
    // Still initialize other charts even if this one doesn't exist
    initializeHealthBySpeciesChart()
    initializeHistogramChart()
    initializeHealthPieChart()
    initializeScatterPlot()
    initializePopulationByYearChart()
    loadSeedSources()
    initializeLowPopulationYearFilter()
    return
  }

  try {
    // Get data from json_script tag
    const addressSpeciesDataScript = document.getElementById('address-species-data')
    const addressSpeciesData = addressSpeciesDataScript ? JSON.parse(addressSpeciesDataScript.textContent) : []
    console.log("Parsed address species data:", addressSpeciesData)
    
    if (!addressSpeciesData || addressSpeciesData.length === 0) {
      console.log("No address species data, showing no data message")
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
    } else {

    // Sort species within each address from high to low (this affects data structure only)
    addressSpeciesData.forEach(item => {
      item.species.sort((a, b) => b.population - a.population)
    })

    // Get all unique species across all addresses
    const allSpecies = new Set()
    addressSpeciesData.forEach(item => {
      item.species.forEach(s => {
        allSpecies.add(s.species_name)
      })
    })
    const speciesList = Array.from(allSpecies)

    // Generate colors for each species
    const colors = [
      "rgba(0, 184, 148, 0.8)", "rgba(0, 206, 201, 0.8)", "rgba(9, 132, 227, 0.8)",
      "rgba(108, 92, 231, 0.8)", "rgba(253, 121, 168, 0.8)", "rgba(225, 112, 85, 0.8)",
      "rgba(46, 204, 113, 0.8)", "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)",
      "rgba(241, 196, 15, 0.8)", "rgba(231, 76, 60, 0.8)", "rgba(230, 126, 34, 0.8)",
      "rgba(26, 188, 156, 0.8)", "rgba(52, 73, 94, 0.8)", "rgba(149, 165, 166, 0.8)",
      "rgba(192, 57, 43, 0.8)", "rgba(243, 156, 18, 0.8)", "rgba(211, 84, 0, 0.8)",
      "rgba(142, 68, 173, 0.8)", "rgba(39, 174, 96, 0.8)", "rgba(22, 160, 133, 0.8)",
      "rgba(44, 62, 80, 0.8)", "rgba(127, 140, 141, 0.8)", "rgba(236, 240, 241, 0.8)",
      "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)", "rgba(241, 196, 15, 0.8)"
    ]

    // Prepare data for grouped bars per address
    const addresses = addressSpeciesData.map(item => item.address)
    
    // Sort species by their TOTAL population across all addresses (descending)
    // This provides a generally good ordering for all address groups
    const speciesWithTotalPop = speciesList.map(species => {
      const totalPop = addressSpeciesData.reduce((sum, item) => {
        const speciesData = item.species.find(s => s.species_name === species)
        return sum + (speciesData ? speciesData.population : 0)
      }, 0)
      return { species, totalPop }
    })
    speciesWithTotalPop.sort((a, b) => b.totalPop - a.totalPop)
    const sortedSpeciesList = speciesWithTotalPop.map(s => s.species)
    
    console.log("Species sorted by total population:", sortedSpeciesList.slice(0, 10))
    
    // Create datasets in sorted order
    const datasets = sortedSpeciesList.map(species => {
      const data = addressSpeciesData.map(item => {
        const speciesData = item.species.find(s => s.species_name === species)
        return speciesData ? speciesData.population : 0
      })
      const bg = colors[sortedSpeciesList.indexOf(species) % colors.length]
      return {
        label: species,
        data: data,
        backgroundColor: bg,
        borderColor: bg.replace('0.8', '1'),
        borderWidth: 1
      }
    })

    // Hide no data message
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    chartCtx.style.display = "block"

    // Destroy existing chart if it exists
    if (populationByAddressChart) {
      populationByAddressChart.destroy()
    }
    
    // Create the chart - grouped bars per address, colored by species (horizontal bars)
    populationByAddressChart = new Chart(chartCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: addresses,
        datasets: datasets
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Population',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          },
          y: {
            title: {
              display: false
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              autoSkip: false,
              callback: function(value) {
                const label = this.getLabelForValue(value)
                return label.length > 30 ? label.substring(0, 27) + '...' : label
              }
            }
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: "rgba(255, 255, 255, 0.7)",
              boxWidth: 14,
              padding: 10,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function(context) {
                // Show the address as the title
                return 'Address: ' + context[0].label
              },
              label: function(context) {
                // Only show the tree species if it exists at this address (population > 0)
                const value = context.parsed.x
                
                // If population is 0 or null, don't show this species
                if (!value || value === 0) {
                  return null
                }
                
                // Show the tree species name and population
                const species = context.dataset.label || ''
                return `${species}: ${value.toLocaleString()} trees`
              },
              beforeBody: function(context) {
                // Filter out labels that returned null
                // This ensures we only show species that exist at this address
                return null
              }
            },
            filter: function(tooltipItem) {
              // Only show tooltip items where the value is greater than 0
              return tooltipItem.parsed.x > 0
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      },
    });
    } // Close else block

  } catch (error) {
    console.error("Error creating Population by Address Chart:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }

  // Second chart: Total population by address
  const totalChartCtx = document.getElementById("totalPopulationByAddressChart")
  if (!totalChartCtx) return

  try {
    // Get data from json_script tag
    const addressSpeciesDataScript = document.getElementById('address-species-data')
    const addressSpeciesData = addressSpeciesDataScript ? JSON.parse(addressSpeciesDataScript.textContent) : []
    
    if (!addressSpeciesData || addressSpeciesData.length === 0) {
      totalChartCtx.style.display = "none"
      const noDataMsg = totalChartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    // Calculate total population per address
    const addresses = []
    const totalPopulations = []
    
    addressSpeciesData.forEach(item => {
      const total = item.species.reduce((sum, s) => sum + s.population, 0)
      addresses.push(item.address)
      totalPopulations.push(total)
    })

    // Hide no data message
    const noDataMsg = totalChartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    totalChartCtx.style.display = "block"

    // Destroy existing chart if it exists
    if (totalPopulationByAddressChart) {
      totalPopulationByAddressChart.destroy()
    }
    
    // Create the chart - one bar per address showing total population (horizontal bars)
    totalPopulationByAddressChart = new Chart(totalChartCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: addresses,
        datasets: [{
          label: 'Total Population',
          data: totalPopulations,
          backgroundColor: "rgba(0, 184, 148, 0.8)",
          borderColor: "rgba(0, 184, 148, 1)",
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Population',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          },
          y: {
            title: {
              display: true,
              text: 'Address',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              autoSkip: false,
              callback: function(value) {
                const label = this.getLabelForValue(value)
                return label.length > 30 ? label.substring(0, 27) + '...' : label
              }
            }
          },
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label
              },
              label: function(context) {
                const value = context.parsed.x
                return `Total Population: ${value.toLocaleString()}`
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      },
    });

  } catch (error) {
    console.error("Error creating Total Population by Address Chart:", error)
    totalChartCtx.style.display = "none"
    const noDataMsg = totalChartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }

  // Third chart: Pie chart showing percentage of all endemic tree species
  const pieChartCtx = document.getElementById("speciesDistributionPieChart")
  if (!pieChartCtx) return

  try {
    // Get data from json_script tag
    const addressSpeciesDataScript = document.getElementById('address-species-data')
    const addressSpeciesData = addressSpeciesDataScript ? JSON.parse(addressSpeciesDataScript.textContent) : []
    
    if (!addressSpeciesData || addressSpeciesData.length === 0) {
      pieChartCtx.style.display = "none"
      const noDataMsg = pieChartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    // Calculate total population per species across all addresses
    const speciesPopulationMap = {}
    addressSpeciesData.forEach(item => {
      item.species.forEach(s => {
        if (!speciesPopulationMap[s.species_name]) {
          speciesPopulationMap[s.species_name] = 0
        }
        speciesPopulationMap[s.species_name] += s.population
      })
    })

    // Convert to arrays and sort by population (descending)
    const speciesData = Object.entries(speciesPopulationMap)
      .map(([name, population]) => ({ name, population }))
      .sort((a, b) => b.population - a.population)

    // Calculate total for percentage calculation
    const totalPopulation = speciesData.reduce((sum, s) => sum + s.population, 0)
    
    // Create labels with percentages
    const speciesLabels = speciesData.map(s => {
      const percentage = totalPopulation > 0 ? ((s.population / totalPopulation) * 100).toFixed(1) : 0
      return `${s.name} (${percentage}%)`
    })
    const speciesPopulations = speciesData.map(s => s.population)

    // Generate colors for pie chart
    const pieColors = [
      "rgba(0, 184, 148, 0.8)", "rgba(0, 206, 201, 0.8)", "rgba(9, 132, 227, 0.8)",
      "rgba(108, 92, 231, 0.8)", "rgba(253, 121, 168, 0.8)", "rgba(225, 112, 85, 0.8)",
      "rgba(46, 204, 113, 0.8)", "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)",
      "rgba(241, 196, 15, 0.8)", "rgba(231, 76, 60, 0.8)", "rgba(230, 126, 34, 0.8)",
      "rgba(26, 188, 156, 0.8)", "rgba(52, 73, 94, 0.8)", "rgba(149, 165, 166, 0.8)",
      "rgba(192, 57, 43, 0.8)", "rgba(243, 156, 18, 0.8)", "rgba(211, 84, 0, 0.8)",
      "rgba(142, 68, 173, 0.8)", "rgba(39, 174, 96, 0.8)", "rgba(22, 160, 133, 0.8)",
      "rgba(44, 62, 80, 0.8)", "rgba(127, 140, 141, 0.8)", "rgba(236, 240, 241, 0.8)",
      "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)", "rgba(241, 196, 15, 0.8)"
    ]

    const pieBackgroundColors = speciesLabels.map((_, index) => 
      pieColors[index % pieColors.length]
    )
    const pieBorderColors = pieBackgroundColors.map(color => color.replace('0.8', '1'))

    // Hide no data message
    const noDataMsg = pieChartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    pieChartCtx.style.display = "block"

    // Create the pie chart
    const pieChart = new Chart(pieChartCtx.getContext("2d"), {
      type: "pie",
      data: {
        labels: speciesLabels,
        datasets: [{
          data: speciesPopulations,
          backgroundColor: pieBackgroundColors,
          borderColor: pieBorderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: "rgba(255, 255, 255, 0.7)",
              boxWidth: 14,
              padding: 10,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const percentage = totalPopulation > 0 ? ((value / totalPopulation) * 100).toFixed(1) : 0
                return `${label}: ${value.toLocaleString()} (${percentage}%)`
              }
            }
          }
        }
      },
    });

  } catch (error) {
    console.error("Error creating Species Distribution Pie Chart:", error)
    pieChartCtx.style.display = "none"
    const noDataMsg = pieChartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }

  // Load and display Seed Sources
  loadSeedSources()
  
  // Initialize Year filter for Low Population Trees
  initializeLowPopulationYearFilter()

  // Initialize charts with initial data (all years) - use template data
  // Note: The first two charts are already created inline above, so we skip them
  initializeHealthBySpeciesChart('all')
  initializeHistogramChart('all')
  initializeHealthPieChart()
  initializeScatterPlot('all')
  initializePopulationByYearChart()
})

// Function to initialize year filters for all charts
function initializeYearFilters() {
  // Get data from json_script tag
  const uniqueYearsScript = document.getElementById('unique-years-data')
  let uniqueYears = []
  
  try {
    if (uniqueYearsScript) {
      uniqueYears = JSON.parse(uniqueYearsScript.textContent)
    }
  } catch (error) {
    console.error("Error parsing unique years:", error)
  }
  
  // Populate all year filter dropdowns
  const yearFilterIds = [
    'addressSpeciesYearFilter',
    'totalPopulationYearFilter',
    'healthBySpeciesYearFilter',
    'histogramYearFilter',
    'scatterYearFilter'
  ]
  
  yearFilterIds.forEach(filterId => {
    const select = document.getElementById(filterId)
    if (select) {
      uniqueYears.forEach(year => {
        if (year) {
          const option = document.createElement('option')
          option.value = year
          option.textContent = year
          select.appendChild(option)
        }
      })
      
      // Add event listener
      select.addEventListener('change', function() {
        const selectedYear = this.value
        handleYearFilterChange(filterId, selectedYear)
      })
    }
  })
}

// Function to handle year filter changes
function handleYearFilterChange(filterId, year) {
  switch(filterId) {
    case 'addressSpeciesYearFilter':
      loadAddressSpeciesChart(year)
      break
    case 'totalPopulationYearFilter':
      loadTotalPopulationChart(year)
      break
    case 'healthBySpeciesYearFilter':
      initializeHealthBySpeciesChart(year)
      break
    case 'histogramYearFilter':
      initializeHistogramChart(year)
      break
    case 'scatterYearFilter':
      initializeScatterPlot(year)
      break
  }
}

// Function to load address-species chart with year filter
function loadAddressSpeciesChart(yearFilter = 'all') {
  const chartCtx = document.getElementById("populationByAddressChart")
  if (!chartCtx) return
  
  if (yearFilter !== 'all') {
    fetch(`/api/analytics/address-species/?year=${yearFilter}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data) {
          updateAddressSpeciesChart(data.data)
        } else {
          chartCtx.style.display = "none"
          const noDataMsg = chartCtx.nextElementSibling
          if (noDataMsg) noDataMsg.style.display = "block"
        }
      })
      .catch(error => {
        console.error("Error fetching address-species data:", error)
        chartCtx.style.display = "none"
        const noDataMsg = chartCtx.nextElementSibling
        if (noDataMsg) noDataMsg.style.display = "block"
      })
    return
  }
  
  // Use initial data from template
  const addressSpeciesDataScript = document.getElementById('address-species-data')
  const addressSpeciesData = addressSpeciesDataScript ? JSON.parse(addressSpeciesDataScript.textContent) : []
  if (addressSpeciesData && addressSpeciesData.length > 0) {
    updateAddressSpeciesChart(addressSpeciesData)
  }
}

// Function to update address-species chart
function updateAddressSpeciesChart(addressSpeciesData) {
  const chartCtx = document.getElementById("populationByAddressChart")
  if (!chartCtx) return
  
  // Sort species within each address
  addressSpeciesData.forEach(item => {
    item.species.sort((a, b) => b.population - a.population)
  })

  // Get all unique species across all addresses
  const allSpecies = new Set()
  addressSpeciesData.forEach(item => {
    item.species.forEach(s => {
      allSpecies.add(s.species_name)
    })
  })
  const speciesList = Array.from(allSpecies)

  // Generate colors for each species
  const colors = [
    "rgba(0, 184, 148, 0.8)", "rgba(0, 206, 201, 0.8)", "rgba(9, 132, 227, 0.8)",
    "rgba(108, 92, 231, 0.8)", "rgba(253, 121, 168, 0.8)", "rgba(225, 112, 85, 0.8)",
    "rgba(46, 204, 113, 0.8)", "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)",
    "rgba(241, 196, 15, 0.8)", "rgba(231, 76, 60, 0.8)", "rgba(230, 126, 34, 0.8)",
    "rgba(26, 188, 156, 0.8)", "rgba(52, 73, 94, 0.8)", "rgba(149, 165, 166, 0.8)",
    "rgba(192, 57, 43, 0.8)", "rgba(243, 156, 18, 0.8)", "rgba(211, 84, 0, 0.8)",
    "rgba(142, 68, 173, 0.8)", "rgba(39, 174, 96, 0.8)", "rgba(22, 160, 133, 0.8)",
    "rgba(44, 62, 80, 0.8)", "rgba(127, 140, 141, 0.8)", "rgba(236, 240, 241, 0.8)",
    "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)", "rgba(241, 196, 15, 0.8)"
  ]

  // Prepare data for grouped bars per address
  const addresses = addressSpeciesData.map(item => item.address)
  
  // Sort species by their TOTAL population across all addresses (descending)
  const speciesWithTotalPop = speciesList.map(species => {
    const totalPop = addressSpeciesData.reduce((sum, item) => {
      const speciesData = item.species.find(s => s.species_name === species)
      return sum + (speciesData ? speciesData.population : 0)
    }, 0)
    return { species, totalPop }
  })
  speciesWithTotalPop.sort((a, b) => b.totalPop - a.totalPop)
  const sortedSpeciesList = speciesWithTotalPop.map(s => s.species)
  
  // Create datasets in sorted order
  const datasets = sortedSpeciesList.map(species => {
    const data = addressSpeciesData.map(item => {
      const speciesData = item.species.find(s => s.species_name === species)
      return speciesData ? speciesData.population : 0
    })
    const bg = colors[sortedSpeciesList.indexOf(species) % colors.length]
    return {
      label: species,
      data: data,
      backgroundColor: bg,
      borderColor: bg.replace('0.8', '1'),
      borderWidth: 1
    }
  })

  // Hide no data message
  const noDataMsg = chartCtx.nextElementSibling
  if (noDataMsg) noDataMsg.style.display = "none"
  chartCtx.style.display = "block"

  // Destroy existing chart if it exists
  if (populationByAddressChart) {
    populationByAddressChart.destroy()
  }

  // Create the chart
  populationByAddressChart = new Chart(chartCtx.getContext("2d"), {
    type: "bar",
    data: {
      labels: addresses,
      datasets: datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Population',
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        y: {
          title: {
            display: false
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
            autoSkip: false,
            callback: function(value) {
              const label = this.getLabelForValue(value)
              return label.length > 30 ? label.substring(0, 27) + '...' : label
            }
          }
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
            boxWidth: 14,
            padding: 10,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return 'Address: ' + context[0].label
            },
            label: function(context) {
              const value = context.parsed.x
              if (!value || value === 0) {
                return null
              }
              const species = context.dataset.label || ''
              return `${species}: ${value.toLocaleString()} trees`
            },
            beforeBody: function(context) {
              return null
            }
          },
          filter: function(tooltipItem) {
            return tooltipItem.parsed.x > 0
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    },
  });
}

// Function to load total population chart with year filter
function loadTotalPopulationChart(yearFilter = 'all') {
  const totalChartCtx = document.getElementById("totalPopulationByAddressChart")
  if (!totalChartCtx) return
  
  if (yearFilter !== 'all') {
    // Fetch from API when a specific year is selected
    fetch(`/api/analytics/address-species/?year=${yearFilter}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data) {
          updateTotalPopulationChart(data.data)
        } else {
          totalChartCtx.style.display = "none"
          const noDataMsg = totalChartCtx.nextElementSibling
          if (noDataMsg) noDataMsg.style.display = "block"
        }
      })
      .catch(error => {
        console.error("Error fetching address-species data:", error)
        totalChartCtx.style.display = "none"
        const noDataMsg = totalChartCtx.nextElementSibling
        if (noDataMsg) noDataMsg.style.display = "block"
      })
  } else {
    // Use initial data from template when 'all' is selected
    const addressSpeciesDataScript = document.getElementById('address-species-data')
    try {
      const addressSpeciesData = addressSpeciesDataScript ? JSON.parse(addressSpeciesDataScript.textContent) : []
      if (addressSpeciesData && addressSpeciesData.length > 0) {
        updateTotalPopulationChart(addressSpeciesData)
      } else {
        totalChartCtx.style.display = "none"
        const noDataMsg = totalChartCtx.nextElementSibling
        if (noDataMsg) noDataMsg.style.display = "block"
      }
    } catch (error) {
      console.error("Error parsing address-species data:", error)
      totalChartCtx.style.display = "none"
      const noDataMsg = totalChartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
    }
  }
}

// Function to update total population chart
function updateTotalPopulationChart(addressSpeciesData) {
  const totalChartCtx = document.getElementById("totalPopulationByAddressChart")
  if (!totalChartCtx) return
  
  // Calculate total population per address
  const addresses = []
  const totalPopulations = []
  
  addressSpeciesData.forEach(item => {
    const total = item.species.reduce((sum, s) => sum + s.population, 0)
    addresses.push(item.address)
    totalPopulations.push(total)
  })

  // Hide no data message
  const noDataMsg = totalChartCtx.nextElementSibling
  if (noDataMsg) noDataMsg.style.display = "none"
  totalChartCtx.style.display = "block"

  // Destroy existing chart if it exists
  if (totalPopulationByAddressChart) {
    totalPopulationByAddressChart.destroy()
  }

  // Create the chart
  totalPopulationByAddressChart = new Chart(totalChartCtx.getContext("2d"), {
    type: "bar",
    data: {
      labels: addresses,
      datasets: [{
        label: 'Total Population',
        data: totalPopulations,
        backgroundColor: "rgba(0, 184, 148, 0.8)",
        borderColor: "rgba(0, 184, 148, 1)",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Population',
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        y: {
          title: {
            display: true,
            text: 'Address',
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
            autoSkip: false,
            callback: function(value) {
              const label = this.getLabelForValue(value)
              return label.length > 30 ? label.substring(0, 27) + '...' : label
            }
          }
        },
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label
            },
            label: function(context) {
              const value = context.parsed.x
              return `Total Population: ${value.toLocaleString()}`
            }
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    },
  });
}

// 1. Stacked Bar Chart: Healthy vs Not Healthy Trees by Species
function initializeHealthBySpeciesChart(yearFilter = 'all') {
  const chartCtx = document.getElementById("healthBySpeciesChart")
  if (!chartCtx) return

  try {
    // If year filter is provided, fetch from API
    if (yearFilter !== 'all') {
      fetch(`/api/analytics/health-by-species/?year=${yearFilter}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            updateHealthBySpeciesChart(data.data)
          } else {
            console.error("Error fetching health by species data:", data.error)
            chartCtx.style.display = "none"
            const noDataMsg = chartCtx.nextElementSibling
            if (noDataMsg) noDataMsg.style.display = "block"
          }
        })
        .catch(error => {
          console.error("Error fetching health by species data:", error)
          chartCtx.style.display = "none"
          const noDataMsg = chartCtx.nextElementSibling
          if (noDataMsg) noDataMsg.style.display = "block"
        })
      return
    }
    
    // Otherwise use initial data from template
    const healthDataScript = document.getElementById('health-by-species-data')
    const healthData = healthDataScript ? JSON.parse(healthDataScript.textContent) : []
    
    if (!healthData || healthData.length === 0) {
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    updateHealthBySpeciesChart(healthData)
  } catch (error) {
    console.error("Error creating Health by Species Chart:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }
}

function updateHealthBySpeciesChart(healthData) {
  const chartCtx = document.getElementById("healthBySpeciesChart")
  if (!chartCtx) return
  
  try {
    const species = healthData.map(item => item.species)
    const healthy = healthData.map(item => item.healthy)
    const notHealthy = healthData.map(item => item.not_healthy)

    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    chartCtx.style.display = "block"

    // Destroy existing chart if it exists
    if (healthBySpeciesChart) {
      healthBySpeciesChart.destroy()
    }

    healthBySpeciesChart = new Chart(chartCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: species,
        datasets: [
          {
            label: "Healthy",
            data: healthy,
            backgroundColor: "rgba(76, 175, 80, 0.8)",
            borderColor: "rgba(76, 175, 80, 1)",
            borderWidth: 1
          },
          {
            label: "Not Healthy",
            data: notHealthy,
            backgroundColor: "rgba(244, 67, 54, 0.8)",
            borderColor: "rgba(244, 67, 54, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Species',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Trees',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: "rgba(255, 255, 255, 0.9)"
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating Health by Species Chart:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }
}

// 2. Histogram: Tree Height or Diameter Distribution
let histogramChart = null

function createHistogram(type, heights, diameters) {
  const chartCtx = document.getElementById("histogramChart")
  if (!chartCtx) return
  
  const data = type === 'height' ? heights : diameters
  const label = type === 'height' ? 'Height (meters)' : 'Diameter (cm)'
  
  if (!data || data.length === 0) {
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
    return
  }

  // Calculate bins
  const min = Math.min(...data)
  const max = Math.max(...data)
  const binCount = Math.min(20, Math.ceil(Math.sqrt(data.length)))
  const binWidth = (max - min) / binCount
  
  const bins = Array(binCount).fill(0)
  const binLabels = []
  
  for (let i = 0; i < binCount; i++) {
    binLabels.push((min + i * binWidth).toFixed(2))
  }
  
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1)
    bins[binIndex]++
  })

  const noDataMsg = chartCtx.nextElementSibling
  if (noDataMsg) noDataMsg.style.display = "none"
  chartCtx.style.display = "block"

  if (histogramChart) {
    histogramChart.destroy()
  }

  histogramChart = new Chart(chartCtx.getContext("2d"), {
    type: "bar",
    data: {
      labels: binLabels,
      datasets: [{
        label: `Frequency`,
        data: bins,
        backgroundColor: "rgba(52, 152, 219, 0.6)",
        borderColor: "rgba(52, 152, 219, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: label,
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency',
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)"
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function initializeHistogramChart(yearFilter = 'all') {
  const chartCtx = document.getElementById("histogramChart")
  if (!chartCtx) return

  // If year filter is provided, fetch from API
  if (yearFilter !== 'all') {
    fetch(`/api/analytics/height-diameter/?year=${yearFilter}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const heights = data.heights || []
          const diameters = data.diameters || []
          const selectedType = document.querySelector('input[name="histogramType"]:checked')?.value || 'height'
          createHistogram(selectedType, heights, diameters)
        } else {
          console.error("Error fetching height/diameter data:", data.error)
          chartCtx.style.display = "none"
          const noDataMsg = chartCtx.nextElementSibling
          if (noDataMsg) noDataMsg.style.display = "block"
        }
      })
      .catch(error => {
        console.error("Error fetching height/diameter data:", error)
        chartCtx.style.display = "none"
        const noDataMsg = chartCtx.nextElementSibling
        if (noDataMsg) noDataMsg.style.display = "block"
      })
    return
  }
  
  // Otherwise use initial data from template
  try {
    const heightsScript = document.getElementById('heights-data')
    const diametersScript = document.getElementById('diameters-data')
    const heights = heightsScript ? JSON.parse(heightsScript.textContent) : []
    const diameters = diametersScript ? JSON.parse(diametersScript.textContent) : []
    
    const selectedType = document.querySelector('input[name="histogramType"]:checked')?.value || 'height'
    createHistogram(selectedType, heights, diameters)
  } catch (error) {
    console.error("Error parsing height/diameter data:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }

  // Radio button change handler (only set up once)
  const radios = document.querySelectorAll('input[name="histogramType"]')
  radios.forEach(radio => {
    // Remove existing listeners to avoid duplicates
    const newRadio = radio.cloneNode(true)
    radio.parentNode.replaceChild(newRadio, radio)
    
    newRadio.addEventListener('change', function() {
      const yearFilter = document.getElementById('histogramYearFilter')?.value || 'all'
      if (yearFilter !== 'all') {
        fetch(`/api/analytics/height-diameter/?year=${yearFilter}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              createHistogram(this.value, data.heights || [], data.diameters || [])
            }
          })
          .catch(error => console.error("Error fetching height/diameter data:", error))
      } else {
        const heightsScript = document.getElementById('heights-data')
        const diametersScript = document.getElementById('diameters-data')
        const heights = heightsScript ? JSON.parse(heightsScript.textContent) : []
        const diameters = diametersScript ? JSON.parse(diametersScript.textContent) : []
        createHistogram(this.value, heights, diameters)
      }
    })
  })
}

// 3. Pie Chart: Healthy vs Not Healthy Percentage
function initializeHealthPieChart() {
  const chartCtx = document.getElementById("healthPieChart")
  if (!chartCtx) return

  try {
    const totalHealthy = parseInt(chartCtx.getAttribute("data-total-healthy") || "0")
    const totalNotHealthy = parseInt(chartCtx.getAttribute("data-total-not-healthy") || "0")
    
    if (totalHealthy === 0 && totalNotHealthy === 0) {
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    const total = totalHealthy + totalNotHealthy
    const healthyPercent = ((totalHealthy / total) * 100).toFixed(1)
    const notHealthyPercent = ((totalNotHealthy / total) * 100).toFixed(1)

    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    chartCtx.style.display = "block"

    new Chart(chartCtx.getContext("2d"), {
      type: "pie",
      data: {
        labels: [`Healthy (${healthyPercent}%)`, `Not Healthy (${notHealthyPercent}%)`],
        datasets: [{
          data: [totalHealthy, totalNotHealthy],
          backgroundColor: [
            "rgba(76, 175, 80, 0.8)",
            "rgba(244, 67, 54, 0.8)"
          ],
          borderColor: [
            "rgba(76, 175, 80, 1)",
            "rgba(244, 67, 54, 1)"
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: "rgba(255, 255, 255, 0.9)",
              padding: 15,
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating Health Pie Chart:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }
}

// 4. Scatter Plot: Tree Distribution by Coordinates
function initializeScatterPlot(yearFilter = 'all') {
  const chartCtx = document.getElementById("scatterPlotChart")
  if (!chartCtx) return

  // If year filter is provided, fetch from API
  if (yearFilter !== 'all') {
    fetch(`/api/analytics/tree-coordinates/?year=${yearFilter}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateScatterPlot(data.data)
        } else {
          console.error("Error fetching tree coordinates data:", data.error)
          chartCtx.style.display = "none"
          const noDataMsg = chartCtx.nextElementSibling
          if (noDataMsg) noDataMsg.style.display = "block"
        }
      })
      .catch(error => {
        console.error("Error fetching tree coordinates data:", error)
        chartCtx.style.display = "none"
        const noDataMsg = chartCtx.nextElementSibling
        if (noDataMsg) noDataMsg.style.display = "block"
      })
    return
  }
  
  // Otherwise use initial data from template
  const treeCoordinatesScript = document.getElementById('tree-coordinates-data')
  try {
    const treeCoordinates = treeCoordinatesScript ? JSON.parse(treeCoordinatesScript.textContent) : []
    
    if (!treeCoordinates || treeCoordinates.length === 0) {
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }
    
    updateScatterPlot(treeCoordinates)
  } catch (error) {
    console.error("Error parsing tree-coordinates data:", error)
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }
}

// Store tree coordinates globally for scatter plot filters
let globalTreeCoordinates = []

function updateScatterPlot(treeCoordinates) {
  const chartCtx = document.getElementById("scatterPlotChart")
  if (!chartCtx) return

  // Store coordinates globally for filter updates
  globalTreeCoordinates = treeCoordinates

  // Get unique species and health statuses
  const speciesSet = new Set()
  const healthSet = new Set()
  treeCoordinates.forEach(tree => {
    speciesSet.add(tree.species)
    healthSet.add(tree.health_status)
  })
  const speciesList = Array.from(speciesSet).sort()
  const healthList = Array.from(healthSet).sort()

  // Populate filter dropdown
  const filterTypeSelect = document.getElementById("scatterFilterType")
  const filterValueSelect = document.getElementById("scatterFilterValue")

  function updateFilterOptions() {
    const filterType = filterTypeSelect.value
    filterValueSelect.innerHTML = '<option value="all">All</option>'
    
    const options = filterType === 'species' ? speciesList : healthList
    options.forEach(option => {
      const optionEl = document.createElement('option')
      optionEl.value = option
      optionEl.textContent = option
      filterValueSelect.appendChild(optionEl)
    })
    
    renderScatterPlot()
  }

  function renderScatterPlot() {
    const filterType = filterTypeSelect.value
    const filterValue = filterValueSelect.value

    let filteredData = globalTreeCoordinates
    if (filterValue !== 'all') {
      filteredData = treeCoordinates.filter(tree => {
        return filterType === 'species' 
          ? tree.species === filterValue
          : tree.health_status === filterValue
      })
    }

    if (filteredData.length === 0) {
      if (scatterChart) scatterChart.destroy()
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    // Group by filter type for coloring
    const datasets = []
    if (filterType === 'species') {
      speciesList.forEach(species => {
        const speciesData = filteredData.filter(t => t.species === species)
        if (speciesData.length > 0) {
          datasets.push({
            label: species,
            data: speciesData.map(t => ({ x: t.longitude, y: t.latitude })),
            backgroundColor: getColorForSpecies(species),
            borderColor: getColorForSpecies(species),
            pointRadius: 4,
            pointHoverRadius: 6
          })
        }
      })
    } else {
      healthList.forEach(health => {
        const healthData = filteredData.filter(t => t.health_status === health)
        if (healthData.length > 0) {
          datasets.push({
            label: health,
            data: healthData.map(t => ({ x: t.longitude, y: t.latitude })),
            backgroundColor: health === 'Healthy' 
              ? "rgba(76, 175, 80, 0.6)" 
              : "rgba(244, 67, 54, 0.6)",
            borderColor: health === 'Healthy' 
              ? "rgba(76, 175, 80, 1)" 
              : "rgba(244, 67, 54, 1)",
            pointRadius: 4,
            pointHoverRadius: 6
          })
        }
      })
    }

    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    chartCtx.style.display = "block"

    if (scatterChart) {
      scatterChart.destroy()
    }

    scatterChart = new Chart(chartCtx.getContext("2d"), {
      type: "scatter",
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Longitude',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          },
          y: {
            title: {
              display: true,
              text: 'Latitude',
              color: "rgba(255, 255, 255, 0.7)"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: "rgba(255, 255, 255, 0.9)",
              usePointStyle: true,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `Tree Location`
              },
              label: function(context) {
                const point = context.raw
                const tree = filteredData.find(t => 
                  Math.abs(t.longitude - point.x) < 0.0001 && 
                  Math.abs(t.latitude - point.y) < 0.0001
                )
                if (tree) {
                  return [
                    `Species: ${tree.species}`,
                    `Health: ${tree.health_status}`,
                    `Lat: ${point.y.toFixed(6)}`,
                    `Lng: ${point.x.toFixed(6)}`
                  ]
                }
                return [`Lat: ${point.y.toFixed(6)}`, `Lng: ${point.x.toFixed(6)}`]
              }
            }
          }
        }
      }
    });
  }

  // Helper function to get color for species (reuse from existing code)
  function getColorForSpecies(species) {
    const colors = [
      "rgba(0, 184, 148, 0.8)", "rgba(0, 206, 201, 0.8)", "rgba(9, 132, 227, 0.8)",
      "rgba(108, 92, 231, 0.8)", "rgba(253, 121, 168, 0.8)", "rgba(225, 112, 85, 0.8)",
      "rgba(46, 204, 113, 0.8)", "rgba(52, 152, 219, 0.8)", "rgba(155, 89, 182, 0.8)",
      "rgba(241, 196, 15, 0.8)", "rgba(231, 76, 60, 0.8)", "rgba(230, 126, 34, 0.8)"
    ]
    const index = speciesList.indexOf(species)
    return colors[index % colors.length]
  }

  filterTypeSelect.addEventListener('change', updateFilterOptions)
  filterValueSelect.addEventListener('change', renderScatterPlot)
  
  updateFilterOptions()
}

// Function to load and display Seed Sources
function loadSeedSources(yearFilter = 'all') {
  try {
    // Fetch from API if year filter is specified or if we want to use API
    if (yearFilter !== 'all') {
      fetchLowPopulationTrees(yearFilter)
      return
    }
    
    // Get seed sources data from the template (for initial load with all years)
    const seedSourcesScript = document.getElementById('seed-sources-data')
    if (!seedSourcesScript) {
      console.error("Seed sources data element not found")
      return
    }
    
    const seedSources = JSON.parse(seedSourcesScript.textContent)
    console.log("Parsed seed sources:", seedSources)
    console.log("Number of seed sources:", seedSources.length)
    updateSeedSources(seedSources)
  } catch (error) {
    console.error("Error loading seed sources:", error)
    console.error("Error details:", error.stack)
  }
}

// Function to fetch low population trees from API
function fetchLowPopulationTrees(yearFilter = 'all') {
  const url = `/api/low-population-trees/?year=${yearFilter}`
  
  fetch(url, {
    credentials: 'same-origin'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      if (data.success) {
        updateSeedSources(data.trees)
      } else {
        console.error("Error fetching low population trees:", data.error)
        updateSeedSources([])
      }
    })
    .catch(error => {
      console.error("Error fetching low population trees:", error)
      updateSeedSources([])
    })
}

// Function to update Low Population Trees Table
function updateSeedSources(lowPopulationTrees) {
  const tbody = document.getElementById("seedSourcesBody")
  if (!tbody) return

  if (!lowPopulationTrees || lowPopulationTrees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No trees with low population found. All species have adequate population levels.</td></tr>'
    return
  }

  // Function to get color class based on IUCN status
  function getIUCNColorClass(iucnCode) {
    switch(iucnCode) {
      case 'CR':
        return 'iucn-cr'; // Critically Endangered - red
      case 'EN':
        return 'iucn-en'; // Endangered - orange
      case 'VU':
        return 'iucn-vu'; // Vulnerable - yellow
      case 'NT':
        return 'iucn-nt'; // Near Threatened - light yellow
      default:
        return '';
    }
  }

  tbody.innerHTML = lowPopulationTrees.map(tree => {
    const iucnClass = getIUCNColorClass(tree.iucn_code || '')
    return `
      <tr>
        <td><strong>${tree.common_name || 'Unknown'}</strong></td>
        <td><em>${tree.scientific_name || 'Unknown'}</em></td>
        <td>${tree.total_population.toLocaleString()}</td>
        <td>${tree.locations_count || 0}</td>
        <td>${tree.addresses || 'Unknown'}</td>
        <td><span class="iucn-badge ${iucnClass}">${tree.iucn_status || 'Unknown'}</span></td>
      </tr>
    `
  }).join('')
}

// Initialize Year filter for Low Population Trees
function initializeLowPopulationYearFilter() {
  const yearFilterSelect = document.getElementById('lowPopulationYearFilter')
  if (!yearFilterSelect) return
  
  // Get unique years from template
  const uniqueYearsScript = document.getElementById('unique-years-data')
  let uniqueYears = []
  
  try {
    if (uniqueYearsScript) {
      uniqueYears = JSON.parse(uniqueYearsScript.textContent)
    }
  } catch (error) {
    console.error("Error parsing unique years:", error)
  }
  
  // Populate year dropdown
  uniqueYears.forEach(year => {
    if (year) {
      const option = document.createElement('option')
      option.value = year
      option.textContent = year
      yearFilterSelect.appendChild(option)
    }
  })
  
  // Add event listener for year filter change
  yearFilterSelect.addEventListener('change', function() {
    const selectedYear = this.value
    loadSeedSources(selectedYear)
  })
}

// Population by Year Chart with Filters
let populationByYearChart = null

function initializePopulationByYearChart() {
  const canvas = document.getElementById('populationByYearChart')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const noDataMsg = document.getElementById('populationYearNoData')
  
  // Get filter elements
  const speciesFilter = document.getElementById('populationYearSpeciesFilter')
  const statusFilter = document.getElementById('populationYearStatusFilter')
  const healthFilter = document.getElementById('populationYearHealthFilter')
  
  if (!speciesFilter || !statusFilter || !healthFilter) return

  // Populate species dropdown
  async function populateSpeciesDropdown() {
    const uniqueSpeciesScript = document.getElementById('unique-species-data')
    if (uniqueSpeciesScript) {
      try {
        const speciesList = JSON.parse(uniqueSpeciesScript.textContent)
        
        // Populate dropdown
        if (Array.isArray(speciesList) && speciesList.length > 0) {
          speciesList.forEach(species => {
            if (species && species !== 'all') {
              const option = document.createElement('option')
              option.value = species
              option.textContent = species
              speciesFilter.appendChild(option)
            }
          })
          console.log('Populated species dropdown with', speciesList.length, 'species')
          return
        }
      } catch (error) {
        console.error('Error parsing species list:', error)
      }
    }
    
    // Fallback: fetch from API
    await fetchSpeciesList()
  }

  // Function to fetch species list from API
  async function fetchSpeciesList() {
    try {
      const response = await fetch('/api/population-by-year/?species=list')
      const data = await response.json()
      if (data.success && data.species) {
        data.species.forEach(species => {
          const option = document.createElement('option')
          option.value = species
          option.textContent = species
          speciesFilter.appendChild(option)
        })
      }
    } catch (error) {
      console.error('Error fetching species list:', error)
    }
  }

  // Function to load and update chart
  async function loadChartData() {
    try {
      const species = speciesFilter.value || 'all'
      const status = statusFilter.value || 'all'
      const health = healthFilter.value || 'all'
      
      const response = await fetch(`/api/population-by-year/?species=${species}&status=${status}&health=${health}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load data')
      }
      
      const years = data.years || []
      const populations = data.populations || []
      
      if (years.length === 0 || populations.length === 0) {
        if (populationByYearChart) {
          populationByYearChart.destroy()
          populationByYearChart = null
        }
        canvas.style.display = 'none'
        if (noDataMsg) noDataMsg.style.display = 'block'
        return
      }
      
      // Hide no data message
      if (noDataMsg) noDataMsg.style.display = 'none'
      canvas.style.display = 'block'
      
      // Destroy existing chart if it exists
      if (populationByYearChart) {
        populationByYearChart.destroy()
      }
      
      // Create new chart
      populationByYearChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: years.map(y => String(y)),
          datasets: [{
            label: 'Tree Population',
            data: populations,
            backgroundColor: 'rgba(78, 115, 223, 0.2)',
            borderColor: 'rgba(78, 115, 223, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'rgba(255, 255, 255, 0.9)',
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'rgba(255, 255, 255, 0.9)',
              bodyColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Population: ${context.parsed.y.toLocaleString()}`
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                callback: function(value) {
                  return value.toLocaleString()
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: true,
                text: 'Population',
                color: 'rgba(255, 255, 255, 0.9)'
              }
            },
            x: {
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: true,
                text: 'Year',
                color: 'rgba(255, 255, 255, 0.9)'
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('Error loading population by year data:', error)
      if (populationByYearChart) {
        populationByYearChart.destroy()
        populationByYearChart = null
      }
      canvas.style.display = 'none'
      if (noDataMsg) noDataMsg.style.display = 'block'
    }
  }
  
  // Add event listeners to filters
  speciesFilter.addEventListener('change', loadChartData)
  statusFilter.addEventListener('change', loadChartData)
  healthFilter.addEventListener('change', loadChartData)
  
  // Populate dropdown and then load chart
  populateSpeciesDropdown().then(() => {
    loadChartData()
  })
}

// Initialize population by year chart when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopulationByYearChart)
} else {
  initializePopulationByYearChart()
}
