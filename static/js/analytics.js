document.addEventListener("DOMContentLoaded", () => {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded!")
    alert("Error: Chart.js library is not loaded. Please refresh the page.")
    return
  }

  console.log("Chart.js loaded successfully")
  
  const chartCtx = document.getElementById("populationByAddressChart")
  if (!chartCtx) {
    console.error("Chart canvas element not found!")
    // Still initialize other charts even if this one doesn't exist
    initializeHealthBySpeciesChart()
    initializeHistogramChart()
    initializeHealthPieChart()
    initializeScatterPlot()
    loadSeedSources()
    return
  }

  try {
    const addressSpeciesDataAttr = chartCtx.getAttribute("data-address-species") || "[]"
    console.log("Raw address species data:", addressSpeciesDataAttr.substring(0, 100))
    const addressSpeciesData = JSON.parse(addressSpeciesDataAttr)
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

    // Create the chart - grouped bars per address, colored by species (horizontal bars)
    new Chart(chartCtx.getContext("2d"), {
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
    const addressSpeciesData = JSON.parse(totalChartCtx.getAttribute("data-address-species") || "[]")
    
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

    // Create the chart - one bar per address showing total population (horizontal bars)
    new Chart(totalChartCtx.getContext("2d"), {
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
    const addressSpeciesData = JSON.parse(pieChartCtx.getAttribute("data-address-species") || "[]")
    
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

  // Initialize new charts (always initialize, even if address_species_data is empty)
  initializeHealthBySpeciesChart()
  initializeHistogramChart()
  initializeHealthPieChart()
  initializeScatterPlot()
})

// 1. Stacked Bar Chart: Healthy vs Not Healthy Trees by Species
function initializeHealthBySpeciesChart() {
  const chartCtx = document.getElementById("healthBySpeciesChart")
  if (!chartCtx) return

  try {
    const healthData = JSON.parse(chartCtx.getAttribute("data-health-by-species") || "[]")
    
    if (!healthData || healthData.length === 0) {
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    const species = healthData.map(item => item.species)
    const healthy = healthData.map(item => item.healthy)
    const notHealthy = healthData.map(item => item.not_healthy)

    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "none"
    chartCtx.style.display = "block"

    new Chart(chartCtx.getContext("2d"), {
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
function initializeHistogramChart() {
  const chartCtx = document.getElementById("histogramChart")
  if (!chartCtx) return

  const heights = JSON.parse(chartCtx.getAttribute("data-heights") || "[]")
  const diameters = JSON.parse(chartCtx.getAttribute("data-diameters") || "[]")

  function createHistogram(type) {
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

  // Initial chart
  createHistogram('height')

  // Radio button change handler
  document.querySelectorAll('input[name="histogramType"]').forEach(radio => {
    radio.addEventListener('change', function() {
      createHistogram(this.value)
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
let scatterChart = null
function initializeScatterPlot() {
  const chartCtx = document.getElementById("scatterPlotChart")
  if (!chartCtx) return

  const treeCoordinates = JSON.parse(chartCtx.getAttribute("data-tree-coordinates") || "[]")
  
  if (!treeCoordinates || treeCoordinates.length === 0) {
    chartCtx.style.display = "none"
    const noDataMsg = chartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
    return
  }

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
    
    updateScatterPlot()
  }

  function updateScatterPlot() {
    const filterType = filterTypeSelect.value
    const filterValue = filterValueSelect.value

    let filteredData = treeCoordinates
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
  filterValueSelect.addEventListener('change', updateScatterPlot)
  
  updateFilterOptions()
}

// Function to load and display Seed Sources
function loadSeedSources() {
  try {
    // Get seed sources data from the template
    const seedSourcesDataElement = document.querySelector('[data-seed-sources]')
    if (!seedSourcesDataElement) {
      console.error("Seed sources data element not found")
      return
    }
    
    const seedSourcesJson = seedSourcesDataElement.getAttribute("data-seed-sources") || "[]"
    console.log("Seed sources JSON:", seedSourcesJson)
    const seedSources = JSON.parse(seedSourcesJson)
    console.log("Parsed seed sources:", seedSources)
    console.log("Number of seed sources:", seedSources.length)
    updateSeedSources(seedSources)
  } catch (error) {
    console.error("Error loading seed sources:", error)
    console.error("Error details:", error.stack)
  }
}

// Function to update Seed Sources Table
function updateSeedSources(seedSources) {
  const tbody = document.getElementById("seedSourcesBody")
  if (!tbody) return

  if (!seedSources || seedSources.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">No seed sources found (outliers with Z-Score ≥ 2)</td></tr>'
    return
  }

  tbody.innerHTML = seedSources.map(source => {
    return `
      <tr>
        <td>${source.address || 'Unknown'}</td>
        <td>${source.species || 'Unknown'}</td>
        <td>${source.population.toLocaleString()}</td>
      </tr>
    `
  }).join('')
}
