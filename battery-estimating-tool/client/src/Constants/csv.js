// Converts an array of row objects into a CSV string using the given
// column keys (also used as the header row, in order).
export function toCsv(rows, columns) {
  const escape = (value) => {
    const str = value === undefined || value === null ? "" : String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [columns.map(escape).join(",")];
  rows.forEach((row) => {
    lines.push(columns.map((col) => escape(row[col])).join(","));
  });
  return lines.join("\r\n");
}

// Triggers a browser download of the given CSV string.
export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
