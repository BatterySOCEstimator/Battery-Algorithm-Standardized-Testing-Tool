import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import {columnKeyMap} from "../../Helperfunc.js";
import { useState } from 'react';
const MetricsTable = ({ headers, estimatedSOC, formattedData, setFormattedData }) => {
//   const formattedData = estimatedSOC.map((row) => {
//   const obj = {};

//   headers.forEach((col) => {
//     const key = columnKeyMap[col];
//     let value = row[key];

//     if (key === "isPrivate") {
//       value = value ? "Private" : "Public";
//     }

//     if (key === "createdAt" || key === "updatedAt") {
//       value = new Date(value).toLocaleString();
//     }

//     obj[col] = value ?? "-";
//   });

//   return obj;
// });
// const [sortedData, setSortedData] = useState(formattedData);
const [sortConfig, setSortConfig] = useState({
  key: null,
  direction: "asc",
});

const handleSort = (col) => {
  let direction = "asc";

  if (sortConfig.key === col && sortConfig.direction === "asc") {
    direction = "desc";
  }

  const sorted = [...formattedData].sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === "asc" ? numA - numB : numB - numA;
    }

    return direction === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  setSortConfig({ key: col, direction });
  setFormattedData(sorted);
};
  console.log(formattedData)
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <Table style={{ textAlign: 'center' }} striped bordered hover>
          <thead>
<tr>
  {headers.map((col) => (
    <th
      key={col}
      onClick={() => handleSort(col)}
      style={{ cursor: "pointer", textAlign: "center" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        <span style={{ width: "12px", display: "inline-block" }} />
        {col}
        <span style={{ width: "12px", display: "inline-block" }}>
          {sortConfig.key === col
            ? sortConfig.direction === "asc"
              ? "▲"
              : "▼"
            : ""}
        </span>
      </span>
    </th>
  ))}
</tr>
</thead>

        <tbody>
          {estimatedSOC.length === 0 ? (
            // If no data exists, show empty row
            <tr>
              {headers.map((col) => (
                <td key={col}>--</td>
              ))}
            </tr>
          ) : (
            // Render each SOC submission as its own row
            formattedData.map((row, index) => (
            <tr key={index}>
              {headers.map((col) => (
                <td key={col}>{row[col] ?? "-"}</td>
              ))}
            </tr>
          ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default MetricsTable;
