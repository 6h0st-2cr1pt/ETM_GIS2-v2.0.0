document.addEventListener("DOMContentLoaded", () => {
  // Store chart instances
  const charts = {
    speciesTreemap: null
  }

  // Fetch and update dashboard data
  async function updateDashboard() {
    try {
      const response = await fetch(`/api/dashboard-data/`)
      const result = await response.json()

      if (!result.success) {
        console.error("Error fetching dashboard data:", result.error)
        return
      }

      // Update KPIs
      updateKPIs(result.kpis)

      // Update charts
      updateSpeciesTreemapChart(result.species_distribution)

    } catch (error) {
      console.error("Error updating dashboard:", error)
    }
  }

  // Update KPI cards
  function updateKPIs(kpis) {
    if (!kpis) return

    const totalTreesEl = document.getElementById("kpi-total-trees")
    const totalHealthyEl = document.getElementById("kpi-total-healthy")
    const totalUnhealthyEl = document.getElementById("kpi-total-unhealthy")
    const plantedExistingEl = document.getElementById("kpi-planted-existing")

    if (totalTreesEl) totalTreesEl.textContent = kpis.total_trees.toLocaleString()
    
    // Calculate percentages for healthy and unhealthy trees
    const total_health_count = kpis.total_healthy + kpis.total_not_healthy
    if (total_health_count > 0) {
      const healthyPercentage = (kpis.total_healthy / total_health_count) * 100
      const unhealthyPercentage = (kpis.total_not_healthy / total_health_count) * 100
      if (totalHealthyEl) totalHealthyEl.textContent = `${healthyPercentage.toFixed(1)}%`
      if (totalUnhealthyEl) totalUnhealthyEl.textContent = `${unhealthyPercentage.toFixed(1)}%`
    } else {
      if (totalHealthyEl) totalHealthyEl.textContent = "0%"
      if (totalUnhealthyEl) totalUnhealthyEl.textContent = "0%"
    }
    
    if (plantedExistingEl) plantedExistingEl.textContent = `${kpis.total_planted.toLocaleString()} / ${kpis.total_existing.toLocaleString()}`
  }


  // Update Species Treemap Chart (using bar chart as treemap alternative)
  function updateSpeciesTreemapChart(speciesData) {
    const ctx = document.getElementById("speciesTreemapChart")
    if (!ctx) return

    if (!speciesData || speciesData.length === 0) {
      ctx.style.display = "none"
      if (ctx.nextElementSibling) ctx.nextElementSibling.style.display = "block"
      if (charts.speciesTreemap) {
        charts.speciesTreemap.destroy()
        charts.speciesTreemap = null
      }
      return
    }

    const topSpecies = speciesData.slice(0, 20)
    const colors = [
      "rgba(0, 184, 148, 0.7)", "rgba(0, 206, 201, 0.7)", "rgba(9, 132, 227, 0.7)",
      "rgba(108, 92, 231, 0.7)", "rgba(253, 121, 168, 0.7)", "rgba(225, 112, 85, 0.7)",
      "rgba(46, 204, 113, 0.7)", "rgba(52, 152, 219, 0.7)", "rgba(155, 89, 182, 0.7)",
      "rgba(241, 196, 15, 0.7)", "rgba(231, 76, 60, 0.7)", "rgba(230, 126, 34, 0.7)",
      "rgba(26, 188, 156, 0.7)", "rgba(52, 73, 94, 0.7)", "rgba(149, 165, 166, 0.7)",
      "rgba(192, 57, 43, 0.7)", "rgba(243, 156, 18, 0.7)", "rgba(211, 84, 0, 0.7)",
      "rgba(142, 68, 173, 0.7)", "rgba(39, 174, 96, 0.7)"
    ]

    ctx.style.display = "block"
    if (ctx.nextElementSibling) ctx.nextElementSibling.style.display = "none"

    if (charts.speciesTreemap) charts.speciesTreemap.destroy()

    charts.speciesTreemap = new Chart(ctx.getContext("2d"), {
      type: "bar",
    data: {
        labels: topSpecies.map(s => s.name),
        datasets: [{
          label: "Tree Count",
          data: topSpecies.map(s => s.count),
          backgroundColor: topSpecies.map((s, i) => colors[i % colors.length]),
          borderColor: topSpecies.map((s, i) => colors[i % colors.length].replace('0.7', '1')),
          borderWidth: 1,
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
              text: 'Number of Trees',
              color: "rgba(255, 255, 255, 0.7)"
            },
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
            display: false
        },
              tooltip: {
                callbacks: {
              afterLabel: function(context) {
                const species = topSpecies[context.dataIndex]
                return `Scientific: ${species.scientific_name}`
                  }
                }
              }
      },
    },
  })
  }


  // Initial load
  updateDashboard()
})
