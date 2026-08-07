import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import {columnKeyMap} from "../../Constants/Helperfunc.js";
import { useState } from 'react';
import styled from 'styled-components';

// Metrics table component for comparison page
const SelectableMetricsTable = ({ headers, formattedData, setFormattedData, selectedModel, setSelectedModel }) => {

  // Scrollable container for the metrics table
  const TableContainer = styled.div`
    max-height: 400px;
    overflow-y: auto;
    overflow-x: auto;
    width: 100%;
    border: 1px solid #ddd;
  `;

// initialize ascending sort and no column selected
const [sortConfig, setSortConfig] = useState({
  key: null,
  direction: "asc",
});

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
  console.log(formattedData)
  return (
    <TableContainer>
      <Table style={{ textAlign: 'center' }} striped bordered hover>
        {/* Table header with clickable columns for sorting */}
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
                  {/* Show sort direction indicator (▲/▼) for the active column */}
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
              {headers.map((col) => (
                <td key={col}>--</td>
              ))}
            </tr>
          ) : (
            // Render each SOC submission as its own row
            formattedData.map((row, index) => (
            <tr key={index}>
              {headers.map((col) => {
                return (
                  // Clicking a row selects that model; highlight with teal background
                  <td onClick={() => setSelectedModel(row)} style={{ cursor: 'pointer', backgroundColor: selectedModel && selectedModel.Submission === row.Submission ? '#359daa' : 'transparent' }} key={col}>{row[col] ?? "-"}</td> 
                )  
              })}
            </tr>
          ))
          )}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default SelectableMetricsTable;


