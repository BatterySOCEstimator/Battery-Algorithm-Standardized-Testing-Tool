import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const ModelCharts = ({ data, isHidden, modelA, modelB }) => {
  if (!data || isHidden) return null;

  const chartData = {
    labels: data.map((d) => d.metric),
    datasets: [
      {
        label: modelA.name,
        data: data.map((d) => d.modelA),
        borderColor: "rgb(136, 132, 216)",
        backgroundColor: "rgba(136, 132, 216, 0.2)",
        tension: 0.3
      },
      {
        label: modelB.name,
        data: data.map((d) => d.modelB),
        borderColor: "rgb(130, 202, 157)",
        backgroundColor: "rgba(130, 202, 157, 0.2)",
        tension: 0.3
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

  return <Line data={chartData} options={options} />;
};

export default ModelCharts;