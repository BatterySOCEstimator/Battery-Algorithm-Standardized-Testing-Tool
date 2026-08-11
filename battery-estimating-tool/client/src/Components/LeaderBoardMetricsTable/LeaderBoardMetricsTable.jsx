import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import {columnKeyMap} from "../../Constants/Helperfunc.js";
import { useState, useEffect } from 'react';

// Metrics table component for leaderboard page
const LeaderBoardMetricsTable = ({ headers, formattedData, setFormattedData }) => {

// initialize ascending sort and no column selected
const [sortConfig, setSortConfig] = useState({
  key: null,
  direction: "asc",
});

  // Filter out 'Status' column from display; keep all other headers visible
  const visibleHeaders = headers
  .filter(header => header !== "Status")
  .map(header => header === "Submitted at" ? "Submitted" : header);

// toggles sort for their on click handling, ascending or descending.
  const handleSort = (col) => {
    let direction = "asc";

    if (sortConfig.key === col && sortConfig.direction === "asc") {
      direction = "desc";
  }

  // Sort rows by the clicked column; handle numeric vs string values
  const sorted = [...formattedData].sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    // Try numeric sort first
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === "asc" ? numA - numB : numB - numA;
    }

    // Fall back to lexicographic sort
    return direction === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
  // Update sort configuration and formatted data state
  setSortConfig({ key: col, direction });
  setFormattedData(sorted);
};
useEffect(() => {
  handleSort("Weighted Error");
}, []);
  // Render the table with horizontally scrollable container for mobile
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <Table style={{ textAlign: 'center' }} striped bordered hover>
          <thead>
<tr>
  {/* Go through each header and give it a key, click handler and style*/}
  {visibleHeaders.map((col) => (
    <th
      key={col}
      onClick={() => handleSort(col)}
      style={{ cursor: "pointer", textAlign: "center" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        <span style={{ width: "12px", display: "inline-block" }} />
        {col}
         {/* Show sort direction indicator (▲/▼) for the selected column */}

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

        {/* Table body: render placeholder if empty */}
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
