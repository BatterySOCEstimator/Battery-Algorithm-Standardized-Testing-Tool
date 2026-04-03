import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const ModelCharts = ({ data, isHidden, modelA, modelB }) => {
  console.log("ModelCharts data:", modelA, modelB);
  if (!data || isHidden) return null;

  const chartData = {
    labels: data.map((d) => d.metric),
    datasets: [
      {
        label: modelA["Model Name"] || "Model A",
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