document.addEventListener("DOMContentLoaded", () => {
  // Define health status categories and colors
  const healthCategories = {
    very_poor: {
      label: "Very Poor",
      color: "rgba(231, 76, 60, 0.7)",
      borderColor: "rgba(231, 76, 60, 1)"
    },
    poor: {
      label: "Poor",
      color: "rgba(241, 196, 15, 0.7)",
      borderColor: "rgba(241, 196, 15, 1)"
    },
    good: {
      label: "Good",
      color: "rgba(46, 204, 113, 0.7)",
      borderColor: "rgba(46, 204, 113, 1)"
    },
    very_good: {
      label: "Very Good",
      color: "rgba(52, 152, 219, 0.7)",
      borderColor: "rgba(52, 152, 219, 1)"
    },
    excellent: {
      label: "Excellent",
      color: "rgba(155, 89, 182, 0.7)",
      borderColor: "rgba(155, 89, 182, 1)"
    }
  }

  // Population Time Chart
  const populationTimeChartCtx = document.getElementById("populationTimeChart")
  if (populationTimeChartCtx) {
    try {
      const populationData = JSON.parse(populationTimeChartCtx.getAttribute("data-population") || "[]")
      if (populationData && populationData.length > 0) {
        new Chart(populationTimeChartCtx.getContext("2d"), {
    type: "line",
    data: {
      labels: populationData.map((item) => item.year),
      datasets: [
        {
                label: "Total Population",
          data: populationData.map((item) => item.total),
          backgroundColor: "rgba(0, 184, 148, 0.2)",
          borderColor: "rgba(0, 184, 148, 1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
      },
    },
  })
      } else {
        populationTimeChartCtx.style.display = "none"
        populationTimeChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Population Time Chart:", error)
      populationTimeChartCtx.style.display = "none"
      populationTimeChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Health Distribution Chart
  const healthDistributionChartCtx = document.getElementById("healthDistributionChart")
  if (healthDistributionChartCtx) {
    try {
      const healthData = JSON.parse(healthDistributionChartCtx.getAttribute("data-health") || "[]")
      if (healthData && healthData.length > 0) {
        const healthChartData = {
          labels: healthData.map(item => healthCategories[item.health_status]?.label || item.health_status),
          datasets: [{
            data: healthData.map(item => item.count),
            backgroundColor: healthData.map(item => healthCategories[item.health_status]?.color || "rgba(0, 0, 0, 0.7)"),
            borderColor: healthData.map(item => healthCategories[item.health_status]?.borderColor || "rgba(0, 0, 0, 1)"),
            borderWidth: 1
          }]
        }

        new Chart(healthDistributionChartCtx.getContext("2d"), {
          type: "pie",
          data: healthChartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
                position: "right",
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = ((context.raw / total) * 100).toFixed(1)
                    return `${context.label}: ${context.raw} (${percentage}%)`
                  }
                }
              }
      },
    },
  })
      } else {
        healthDistributionChartCtx.style.display = "none"
        healthDistributionChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Health Distribution Chart:", error)
      healthDistributionChartCtx.style.display = "none"
      healthDistributionChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Family Distribution Chart
  const familyDistributionChartCtx = document.getElementById("familyDistributionChart")
  if (familyDistributionChartCtx) {
    try {
      const familyData = JSON.parse(familyDistributionChartCtx.getAttribute("data-family") || "[]")
      if (familyData && familyData.length > 0) {
        new Chart(familyDistributionChartCtx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: familyData.map((item) => item.name),
      datasets: [
        {
                data: familyData.map((item) => item.total_population),
          backgroundColor: [
            "rgba(0, 184, 148, 0.7)",
            "rgba(0, 206, 201, 0.7)",
            "rgba(9, 132, 227, 0.7)",
            "rgba(108, 92, 231, 0.7)",
            "rgba(253, 121, 168, 0.7)",
            "rgba(225, 112, 85, 0.7)",
            "rgba(46, 204, 113, 0.7)",
            "rgba(52, 152, 219, 0.7)",
            "rgba(155, 89, 182, 0.7)",
            "rgba(241, 196, 15, 0.7)",
          ],
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = ((context.raw / total) * 100).toFixed(1)
                    return `${context.label}: ${context.raw} (${percentage}%)`
            }
          }
        }
      },
    },
  })
      } else {
        familyDistributionChartCtx.style.display = "none"
        familyDistributionChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Family Distribution Chart:", error)
      familyDistributionChartCtx.style.display = "none"
      familyDistributionChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Genus Distribution Chart
  const genusDistributionChartCtx = document.getElementById("genusDistributionChart")
  if (genusDistributionChartCtx) {
    try {
      const genusData = JSON.parse(genusDistributionChartCtx.getAttribute("data-genus") || "[]")
      if (genusData && genusData.length > 0) {
        new Chart(genusDistributionChartCtx.getContext("2d"), {
    type: "bar",
    data: {
            labels: genusData.map((item) => `${item.name} (${item.family__name})`),
      datasets: [
        {
                label: "Population",
                data: genusData.map((item) => item.total_population),
                backgroundColor: "rgba(46, 204, 113, 0.7)",
                borderColor: "rgba(46, 204, 113, 1)",
          borderWidth: 1,
        },
              {
                label: "Species Count",
                data: genusData.map((item) => item.species_count),
                backgroundColor: "rgba(52, 152, 219, 0.7)",
                borderColor: "rgba(52, 152, 219, 1)",
                borderWidth: 1,
              }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
        },
      },
    },
  })
      } else {
        genusDistributionChartCtx.style.display = "none"
        genusDistributionChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Genus Distribution Chart:", error)
      genusDistributionChartCtx.style.display = "none"
      genusDistributionChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Species Population Chart
  const speciesPopulationChartCtx = document.getElementById("speciesPopulationChart")
  if (speciesPopulationChartCtx) {
    try {
      const speciesData = JSON.parse(speciesPopulationChartCtx.getAttribute("data-species") || "[]")
      console.debug('Species data for chart:', speciesData)
      const renderSpeciesChart = (dataset) => {
        if (!Array.isArray(dataset) || dataset.length === 0) {
          speciesPopulationChartCtx.style.display = "none"
          speciesPopulationChartCtx.nextElementSibling.style.display = "block"
          return
        }
        new Chart(speciesPopulationChartCtx.getContext("2d"), {
          type: "bar",
          data: {
            labels: dataset.map((item) => `${item.common_name} (${item.scientific_name})`),
            datasets: [
              {
                label: "Population",
                data: dataset.map((item) => item.total_population || 0),
                backgroundColor: "rgba(46, 204, 113, 0.7)",
                borderColor: "rgba(46, 204, 113, 1)",
                borderWidth: 1,
              }
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
              },
              y: {
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const item = speciesData[context.dataIndex]
                    return [
                      `Population: ${item.total_population}`,
                      `Locations: ${item.locations_count}`
                    ]
                  }
                }
              }
            },
          },
        })
      }

      if (Array.isArray(speciesData) && speciesData.length > 0) {
        renderSpeciesChart(speciesData)
      } else {
        // Fallback: fetch from API
        fetch('/api/analytics-data/')
          .then(r => r.json())
          .then(json => {
            console.debug('Fetched species data from API:', json.species_data)
            renderSpeciesChart(json.species_data || [])
          })
          .catch(err => {
            console.error('Error fetching analytics-data:', err)
            speciesPopulationChartCtx.style.display = "none"
            speciesPopulationChartCtx.nextElementSibling.style.display = "block"
          })
      }
    } catch (error) {
      console.error("Error creating Species Population Chart:", error)
      speciesPopulationChartCtx.style.display = "none"
      speciesPopulationChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Health Status by Year Chart
  const healthByYearChartCtx = document.getElementById("healthByYearChart")
  if (healthByYearChartCtx) {
    try {
      const healthYearData = JSON.parse(healthByYearChartCtx.getAttribute("data-health-year") || "[]")
      if (healthYearData && healthYearData.length > 0) {
        // Get unique years and health statuses
        const years = [...new Set(healthYearData.map(item => item.year))]
        const statuses = [...new Set(healthYearData.map(item => item.health_status))]

        // Create datasets for each health status
        const datasets = statuses.map(status => ({
          label: healthCategories[status]?.label || status,
          data: years.map(year => {
            const entry = healthYearData.find(item => item.year === year && item.health_status === status)
            return entry ? entry.population : 0
          }),
          backgroundColor: healthCategories[status]?.color || "rgba(0, 0, 0, 0.7)",
          borderColor: healthCategories[status]?.borderColor || "rgba(0, 0, 0, 1)",
          borderWidth: 1,
          stack: 'Stack 0',
        }))

        new Chart(healthByYearChartCtx.getContext("2d"), {
          type: "bar",
          data: {
            labels: years,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
              },
              y: {
                stacked: true,
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.raw}`
                  }
                }
              }
            },
          },
        })
      } else {
        healthByYearChartCtx.style.display = "none"
        healthByYearChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Health by Year Chart:", error)
      healthByYearChartCtx.style.display = "none"
      healthByYearChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Growth Rate Chart
  const growthRateChartCtx = document.getElementById("growthRateChart")
  if (growthRateChartCtx) {
    try {
      const growthData = JSON.parse(growthRateChartCtx.getAttribute("data-growth") || "[]")
      if (growthData && growthData.length > 0) {
        new Chart(growthRateChartCtx.getContext("2d"), {
    type: "line",
    data: {
            labels: growthData.map((item) => item.year),
      datasets: [
        {
                label: "Annual Growth Rate (%)",
                data: growthData.map((item) => item.growth_rate),
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
      },
    },
  })
      } else {
        growthRateChartCtx.style.display = "none"
        growthRateChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Growth Rate Chart:", error)
      growthRateChartCtx.style.display = "none"
      growthRateChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Initialize the distribution map if Leaflet is available
  const distributionMapDiv = document.getElementById("distributionMap")
  if (distributionMapDiv && window.L) {
    try {
      // Try to use location data from template first
      const locationData = JSON.parse(distributionMapDiv.getAttribute("data-locations") || "[]")
      
      // If location data is available and has coordinates, use it
      if (locationData && locationData.length > 0 && locationData.some(loc => loc.latitude && loc.longitude)) {
        const map = L.map(distributionMapDiv).setView([0, 0], 2)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        const bounds = []
        locationData.forEach(location => {
          if (location.latitude && location.longitude) {
            L.circleMarker([location.latitude, location.longitude], {
              radius: Math.min(Math.sqrt(location.total_trees || 1) * 2, 20),
              fillColor: "#2ecc71",
              color: "#fff",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.7
            })
            .bindPopup(`
              <strong>${location.name || 'Unknown Location'}</strong><br>
              Total Trees: ${location.total_trees || 0}<br>
              Species Count: ${location.species_count || 0}
            `)
            .addTo(map)
            bounds.push([location.latitude, location.longitude])
          }
        })

        if (bounds.length > 0) {
          map.fitBounds(bounds)
        } else {
          // Fallback: fetch tree data from API
          loadTreeDataForMap(distributionMapDiv)
        }
      } else {
        // Fallback: fetch tree data from API
        loadTreeDataForMap(distributionMapDiv)
      }
    } catch (error) {
      console.error("Error creating Distribution Map:", error)
      // Fallback: fetch tree data from API
      loadTreeDataForMap(distributionMapDiv)
    }
  }

  // Function to load tree data from API for the map
  async function loadTreeDataForMap(mapDiv) {
    try {
      // Determine if we're in head portal or app portal
      const isHeadPortal = window.location.pathname.includes('/head/')
      const apiUrl = isHeadPortal ? '/head/api/tree-data/' : '/api/tree-data/'
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const geojson = await response.json()
      
      if (!geojson.features || geojson.features.length === 0) {
        mapDiv.innerHTML = '<div class="no-data-message">No tree data available to display on the map.</div>'
        return
      }

      // Initialize map
      const map = L.map(mapDiv).setView([10.3157, 123.8854], 10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Add markers for each tree
      const bounds = []
      const markers = L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => {
          const p = feature.properties
          return L.circleMarker(latlng, {
            radius: Math.min(Math.sqrt(p.population || 1) * 2, 15),
            fillColor: "#2ecc71",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
          })
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties
          const popupContent = `
            <div class="tree-popup">
              <h4>${p.common_name || 'Unknown'}</h4>
              <p><em>${p.scientific_name || 'Unknown'}</em></p>
              <p><strong>Location:</strong> ${p.location || 'Unknown'}</p>
              <p><strong>Population:</strong> ${p.population || 0}</p>
              <p><strong>Health Status:</strong> ${(p.health_status || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              ${p.user ? `<p><strong>User:</strong> ${p.user}</p>` : ''}
            </div>
          `
          layer.bindPopup(popupContent)
          bounds.push(feature.geometry.coordinates.reverse()) // Leaflet uses [lat, lng]
        }
      }).addTo(map)

      // Fit map bounds to show all markers
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    } catch (error) {
      console.error("Error loading tree data for map:", error)
      mapDiv.innerHTML = '<div class="no-data-message">Error loading tree data. Please try again.</div>'
    }
  }
})
