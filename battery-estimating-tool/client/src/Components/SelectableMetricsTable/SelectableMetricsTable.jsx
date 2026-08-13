import { useState } from "react";
import { cn } from "#Constants/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "#Components/ui/table";
import { Card } from "#Components/ui/card";
import { IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react";

// Selectable metrics table used on the Model Comparison page: clicking a
// header sorts by that column, clicking a row selects that model (used for
// the comparison chart) and highlights it.
const SelectableMetricsTable = ({ headers, formattedData, setFormattedData, selectedModel, setSelectedModel, filters }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Toggles sort direction on repeat clicks of the same column, ascending
  // by default on a new column. Sorted data is written straight back into
  // the parent's formattedData state, same as before.
  const handleSort = (col) => {
    const direction = sortConfig.key === col && sortConfig.direction === "asc" ? "desc" : "asc";

    const sorted = [...formattedData].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

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

  const getSortIcon = (col) => {
    if (sortConfig.key !== col)
      return <IconArrowsSort className="h-3.5 w-3.5 shrink-0 opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <IconArrowUp className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <IconArrowDown className="h-3.5 w-3.5 shrink-0" />
    );
  };

  return (
    <Card className="w-full gap-3 py-4">
      {filters && (
        <div className="flex flex-wrap items-end gap-4 px-4">{filters}</div>
      )}
      <div className="max-h-100 w-full overflow-auto border-y border-border px-2">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((col) => (
                <TableHead key={col} className="text-center">
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className="inline-flex w-full items-center justify-center gap-1.5 font-medium hover:text-foreground"
                  >
                    {col}
                    {getSortIcon(col)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedData.length === 0 ? (
              <TableRow>
                {headers.map((col) => (
                  <TableCell key={col} className="text-center text-muted-foreground">
                    --
                  </TableCell>
                ))}
              </TableRow>
            ) : (
              formattedData.map((row, index) => (
                <TableRow key={row.Submission ?? index}>
                  {headers.map((col) => (
                    <TableCell
                      key={col}
                      onClick={() => setSelectedModel(row)}
                      className={cn(
                        "cursor-pointer text-center",
                        selectedModel &&
                          selectedModel.Submission === row.Submission &&
                          "bg-primary/15",
                      )}
                    >
                      {row[col] ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default SelectableMetricsTable;
