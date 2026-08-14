import { useState, useMemo, useEffect } from "react";
import { cn } from "#Constants/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "#Components/ui/table";
import { Button } from "#Components/ui/button";
import { Card } from "#Components/ui/card";
import ColumnsMenu from "../ColumnsMenu/ColumnsMenu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "#Components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#Components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "#Components/ui/dialog";
import { toCsv, downloadCsv } from "#Constants/csv";
import SubmissionRowActions from "./SubmissionRowActions";
import {
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconDownload,
  IconTable,
  IconDatabase,
  IconChevronRight,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

const PAGE_SIZES = [10, 25, 50, 100];

// Metrics table component for the submissions page
// Uses shadcn/ui Table + DropdownMenu (Base UI / Nova style)
// Column visibility toggle via the "Columns" dropdown, CSV export via the
// "Download" dropdown, and client-side pagination — mirrors the leaderboard
// table's UI, minus the Ranking column.
const SubmissionsMetricsTable = ({
  headers,
  formattedData,
  filters,
  originalData,
  onRowUpdate,
  onRowDelete,
  hiddenIds,
  onHideRow,
  onUnhideRow,
  showHidden,
  onToggleShowHidden,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Only fixes the display label's capitalization — the underlying data
  // key stays "Submitted at" to match the row objects.
  const allColumns = useMemo(
    () => headers.map((h) => (h === "Submitted at" ? "Submitted At" : h)),
    [headers],
  );

  const HIDDEN_BY_DEFAULT = ["Submission", "Visibility"];

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initial = {};
    allColumns.forEach((col) => {
      initial[col] = !HIDDEN_BY_DEFAULT.includes(col);
    });
    return initial;
  });

  useEffect(() => {
    setColumnVisibility((prev) => {
      const next = { ...prev };
      allColumns.forEach((col) => {
        if (!(col in next)) next[col] = !HIDDEN_BY_DEFAULT.includes(col);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumns.join("|")]);

  // User-customizable column order, drives both the table and the "current
  // view" CSV download. Kept in sync with allColumns: existing columns keep
  // their relative order, newly-appeared columns are appended at the end.
  const [columnOrder, setColumnOrder] = useState(() => [...allColumns]);

  useEffect(() => {
    setColumnOrder((prev) => {
      const stillPresent = prev.filter((col) => allColumns.includes(col));
      const newlyAdded = allColumns.filter((col) => !stillPresent.includes(col));
      return [...stillPresent, ...newlyAdded];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumns.join("|")]);

  const visibleHeaders = columnOrder.filter((col) => columnVisibility[col]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (col) => {
    const direction =
      sortConfig.key === col && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key: col, direction });
    setPage(0);
  };

  const sortedData = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return formattedData;

    return [...formattedData].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === "asc" ? numA - numB : numB - numA;
      }

      return direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [formattedData, sortConfig]);

  useEffect(() => {
    setPage(0);
  }, [formattedData.length]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = sortedData.slice(page * pageSize, page * pageSize + pageSize);

  // Short headers stay compact; headers with more words get a wider column
  // so their text still wraps to only a couple of lines instead of many.
  // Description is free text and can run long, so it gets its own wider,
  // truncated (not wrapped) treatment instead.
  const getHeaderWidthClass = (col) => {
    if (col === "Description") return "max-w-60";
    const wordCount = col.split(" ").length;
    if (wordCount >= 4) return "max-w-40";
    if (wordCount === 3) return "max-w-40";
    return "max-w-28";
  };

  // How many of the models this table would otherwise show are currently
  // hidden — shown as a count on the "Show Hidden" toggle.
  const hiddenCount = (originalData ?? []).filter((row) => hiddenIds?.has(row.Submission)).length;

  const getSortIcon = (col) => {
    if (sortConfig.key !== col)
      return <IconArrowsSort className="h-3.5 w-3.5 shrink-0 opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <IconArrowUp className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <IconArrowDown className="h-3.5 w-3.5 shrink-0" />
    );
  };

  const [downloadOpen, setDownloadOpen] = useState(false);

  const getCellValue = (row, col) => {
    if (col === "Submitted At") return row["Submitted at"] ?? "";
    return row[col] ?? "";
  };

  const handleDownloadCurrentView = () => {
    const rows = sortedData.map((row) =>
      Object.fromEntries(visibleHeaders.map((col) => [col, getCellValue(row, col)])),
    );
    downloadCsv(toCsv(rows, visibleHeaders), "submissions-current-view.csv");
    setDownloadOpen(false);
  };

  const handleDownloadAllData = () => {
    const rows = (originalData ?? []).map((row) =>
      Object.fromEntries(headers.map((col) => [col, row[col] ?? ""])),
    );
    downloadCsv(toCsv(rows, headers), "submissions-all-data.csv");
    setDownloadOpen(false);
  };

  return (
    <Card className="w-full gap-3 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4">
        <div className="flex flex-wrap items-end gap-4">{filters}</div>
        <div className="flex items-center gap-2">
          <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <IconDownload className="h-4 w-4" />
                Download
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download submissions data</DialogTitle>
                <DialogDescription>
                  Choose what to include in the CSV file.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCurrentView}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
                >
                  <IconTable className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Current view</div>
                    <div className="text-xs text-muted-foreground">
                      Sorted and filtered the way you have it, with only your
                      visible columns.
                    </div>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAllData}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
                >
                  <IconDatabase className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">All data</div>
                    <div className="text-xs text-muted-foreground">
                      All of your submissions, unsorted and unfiltered.
                    </div>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <ColumnsMenu
            order={columnOrder}
            onOrderChange={setColumnOrder}
            visibility={columnVisibility}
            onVisibilityChange={setColumnVisibility}
          />

          <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleShowHidden}>
            {showHidden ? (
              <IconEye className="h-4 w-4" />
            ) : (
              <IconEyeOff className="h-4 w-4" />
            )}
            {showHidden ? "Showing Hidden" : "Show Hidden"}
            {hiddenCount > 0 && ` (${hiddenCount})`}
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto border-y border-border px-2">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow>
              {/* Actions column is fixed/first and not part of the
                  Columns-visibility toggle — it's controls, not data. */}
              <TableHead className="w-10" />
              {visibleHeaders.map((col) => (
                <TableHead
                  key={col}
                  className={cn(getHeaderWidthClass(col), "text-center whitespace-normal")}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className="inline-flex w-full items-center justify-center gap-1.5 font-medium hover:text-foreground"
                  >
                    <span className="min-w-0">{col}</span>
                    {getSortIcon(col)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell />
                {visibleHeaders.map((col) => (
                  <TableCell key={col} className="text-center text-muted-foreground">
                    --
                  </TableCell>
                ))}
              </TableRow>
            ) : (
              pagedData.map((row) => {
                const rowHidden = hiddenIds?.has(row.Submission);
                return (
                  // Keyed by the model's own id, not page position — a stable
                  // key here matters because SubmissionRowActions seeds its
                  // edit-form fields from `row` only once, on mount. A
                  // position-based key let a reordered/filtered row (e.g.
                  // after toggling privacy) reuse another model's component
                  // instance and show stale edit data for the wrong model.
                  <ContextMenu key={row.Submission}>
                    <ContextMenuTrigger
                      render={
                        <tr
                          data-slot="table-row"
                          className={cn(
                            "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
                            rowHidden && "opacity-50",
                          )}
                        />
                      }
                    >
                      <TableCell className="text-center">
                        <SubmissionRowActions
                          row={row}
                          onRowUpdate={onRowUpdate}
                          onRowDelete={onRowDelete}
                        />
                      </TableCell>
                      {visibleHeaders.map((col) => (
                        <TableCell
                          key={col}
                          title={col === "Description" ? row[col] : undefined}
                          className={cn(
                            "text-center",
                            col === "Description" && "max-w-60 truncate text-left",
                          )}
                        >
                          {col === "Submitted At"
                            ? (row["Submitted at"] ?? "-")
                            : (row[col] ?? "-")}
                        </TableCell>
                      ))}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      {rowHidden ? (
                        <ContextMenuItem onClick={() => onUnhideRow(row.Submission)}>
                          <IconEye className="h-4 w-4" />
                          Unhide
                        </ContextMenuItem>
                      ) : (
                        <ContextMenuItem onClick={() => onHideRow(row.Submission)}>
                          <IconEyeOff className="h-4 w-4" />
                          Hide
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 text-sm text-muted-foreground">
        <div>
          Showing {sortedData.length === 0 ? 0 : page * pageSize + 1}
          {"–"}
          {Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SubmissionsMetricsTable;
