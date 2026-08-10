import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import {columnKeyMap} from "../../Helperfunc.js";
import { useState, useEffect } from 'react';
const LeaderBoardMetricsTable = ({ headers, formattedData, setFormattedData }) => {

const [sortConfig, setSortConfig] = useState({
  key: null,
  direction: "asc",
});

const visibleHeaders = headers
  .filter(header => header !== "Status")
  .map(header => header === "Submitted at" ? "Submitted" : header);

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
useEffect(() => {
  handleSort("Weighted Error");
}, []);
  console.log(formattedData)
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <Table style={{ textAlign: 'center' }} striped bordered hover>
          <thead>
<tr>
  {visibleHeaders.map((col) => (
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
          {formattedData.length === 0 ? (
            // If no data exists, show empty row
            <tr>
              {visibleHeaders.map((col) => (
                <td key={col}>--</td>
              ))}
            </tr>
          ) : (
            // Render each SOC submission as its own row
            formattedData.map((row, index) => (
            <tr key={index}>
              {visibleHeaders.map((col) => (
                <td key={col}>
                  {col === "Submitted"
                    ? row["Submitted at"]?.split(",")[0]
                    : row[col] ?? "-"}
                </td>
              ))}
            </tr>
          ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default LeaderBoardMetricsTable;
