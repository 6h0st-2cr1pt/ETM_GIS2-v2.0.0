document.addEventListener("DOMContentLoaded", () => {
  const chartCtx = document.getElementById("populationByAddressChart")
  if (!chartCtx) return

  try {
    const addressSpeciesData = JSON.parse(chartCtx.getAttribute("data-address-species") || "[]")
    
    if (!addressSpeciesData || addressSpeciesData.length === 0) {
      chartCtx.style.display = "none"
      const noDataMsg = chartCtx.nextElementSibling
      if (noDataMsg) noDataMsg.style.display = "block"
      return
    }

    // Sort species within each address from high to low
    addressSpeciesData.forEach(item => {
      item.species.sort((a, b) => b.population - a.population)
    })

    // Get all unique species across all addresses (for per-address grouped bars)
    const allSpecies = new Set()
    addressSpeciesData.forEach(item => {
      item.species.forEach(s => {
        allSpecies.add(s.species_name)
      })
    })
    const speciesList = Array.from(allSpecies).sort()

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
    
    // Sort species by their maximum population across all addresses (descending)
    // This ensures bars are ordered from high to low within each address group
    const speciesWithMaxPop = speciesList.map(species => {
      const maxPop = Math.max(...addressSpeciesData.map(item => {
        const speciesData = item.species.find(s => s.species_name === species)
        return speciesData ? speciesData.population : 0
      }))
      return { species, maxPop }
    })
    speciesWithMaxPop.sort((a, b) => b.maxPop - a.maxPop)
    const sortedSpeciesList = speciesWithMaxPop.map(s => s.species)
    
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
            callbacks: {
              title: function(context) {
                return context[0].label
              },
              label: function(context) {
                const species = context.dataset.label || ''
                const value = context.parsed.x
                return `${species}: ${value.toLocaleString()}`
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      },
    })

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
    })

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
    })

  } catch (error) {
    console.error("Error creating Species Distribution Pie Chart:", error)
    pieChartCtx.style.display = "none"
    const noDataMsg = pieChartCtx.nextElementSibling
    if (noDataMsg) noDataMsg.style.display = "block"
  }

  // Load and display Seed Sources
  loadSeedSources()
})

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
