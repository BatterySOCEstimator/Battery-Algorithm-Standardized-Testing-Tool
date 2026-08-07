// imports for chart.js and react-chartjs-2 for rendering bar charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register the necessary components for bar charts with ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const ModelCharts = ({ data, isHidden, modelA, modelB }) => {
  // hide the chart if no data is provided or if the isHidden prop is true
  if (!data || isHidden) return null;

  // X-axis: category labels e.g. '0C', '10C', '25C',
  const chartData = {
    labels: data.map((d) => d.metric),
    datasets: [
      {
        // series name falling back to "Model A" if no name is provided
        label: modelA["Model Name"] || "Model A",
        // Y-axis values: map one value per category label
        data: data.map((d) => d.modelA),
        backgroundColor: "rgba(136, 132, 216, 0.6)"
      },
      {
        label: modelB["Model Name"] || "Model B",
        data: data.map((d) => d.modelB),
        backgroundColor: "rgba(130, 202, 157, 0.6)"
      }
    ]
  };

  // configuration option for the bar chart
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default ModelCharts;