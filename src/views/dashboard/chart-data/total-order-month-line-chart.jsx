// ==============================|| DASHBOARD - TOTAL ORDER MONTH CHART ||============================== //

const chartData = {
  type: 'line',
  height: 100,
  options: {
    chart: {
      sparkline: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#fff'],
    fill: {
      type: 'solid',
      opacity: 1
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    yaxis: {
      min: 'auto',
      max: 'auto'
    },
    tooltip: {
      theme: 'dark',
      fixed: {
        enabled: false
      },
      x: {
        show: false
      },
      y: {
        title: {
          formatter: () => 'Current'
        }
      },
      marker: {
        show: true
      }
    }
  },
  series: [
    {
      name: 'series1',
      data: []
    }
  ]
};

export default chartData;
