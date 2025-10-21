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

  // Population Chart
  const populationChartCtx = document.getElementById("populationChart")
  if (populationChartCtx) {
    try {
      const populationData = JSON.parse(populationChartCtx.getAttribute("data-population") || "[]")
      if (populationData && populationData.length > 0) {
        new Chart(populationChartCtx.getContext("2d"), {
    type: "line",
    data: {
      labels: populationData.map((item) => item.year),
      datasets: [
        {
          label: "Population",
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
        populationChartCtx.style.display = "none"
        populationChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Population Chart:", error)
      populationChartCtx.style.display = "none"
      populationChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Species Distribution Chart
  const speciesChartCtx = document.getElementById("speciesChart")
  if (speciesChartCtx) {
    try {
      const speciesData = JSON.parse(speciesChartCtx.getAttribute("data-species") || "[]")
      if (speciesData && speciesData.length > 0) {
        new Chart(speciesChartCtx.getContext("2d"), {
    type: "doughnut",
    data: {
            labels: speciesData.map((item) => item.name),
      datasets: [
        {
          data: speciesData.map((item) => item.count),
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
        speciesChartCtx.style.display = "none"
        speciesChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Species Chart:", error)
      speciesChartCtx.style.display = "none"
      speciesChartCtx.nextElementSibling.style.display = "block"
    }
  }

  // Health Status Chart
  const healthChartCtx = document.getElementById("healthChart")
  if (healthChartCtx) {
    try {
      const healthData = JSON.parse(healthChartCtx.getAttribute("data-health") || "[]")
      if (healthData && healthData.length > 0) {
        const healthChartData = {
          labels: healthData.map(item => healthCategories[item.status]?.label || item.status),
          datasets: [{
            data: healthData.map(item => item.count),
            backgroundColor: healthData.map(item => healthCategories[item.status]?.color || "rgba(0, 0, 0, 0.7)"),
            borderColor: healthData.map(item => healthCategories[item.status]?.borderColor || "rgba(0, 0, 0, 1)"),
            borderWidth: 1
          }]
        }

        new Chart(healthChartCtx.getContext("2d"), {
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
        healthChartCtx.style.display = "none"
        healthChartCtx.nextElementSibling.style.display = "block"
      }
    } catch (error) {
      console.error("Error creating Health Chart:", error)
      healthChartCtx.style.display = "none"
      healthChartCtx.nextElementSibling.style.display = "block"
    }
  }
})
