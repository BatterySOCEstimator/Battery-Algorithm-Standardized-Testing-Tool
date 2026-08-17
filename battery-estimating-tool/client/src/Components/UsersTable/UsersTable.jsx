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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#Components/ui/select";
import UserRowActions from "./UserRowActions";
import LabeledSearchInput from "../LabeledSearchInput/LabeledSearchInput";
import { IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react";

const PAGE_SIZES = [10, 25, 50, 100];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "username", label: "Username" },
  { key: "role", label: "Role" },
  { key: "banned", label: "Status" },
  { key: "lastLogin", label: "Last Login" },
  { key: "createdAt", label: "Joined" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "Never");

// Admin users table — same Card/Table/sortable-header/pagination look as
// the leaderboard, scoped down to just what a user-management table needs
// (no CSV export, no column visibility toggle — not asked for here).
//
// Purely presentational: `users` is just the current page, sorted and
// sliced server-side (see adminActions.js's fetchUsers) — every control
// here reports back through a callback instead of touching data locally,
// since AdminUsers.jsx owns the actual fetch that responds to them. That
// keeps this table fast and correct no matter how many users exist, rather
// than pulling the whole table into the browser to sort/paginate in JS.
const UsersTable = ({
  users,
  total,
  currentUserId,
  onRowUpdate,
  sortConfig,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <IconArrowsSort className="h-3.5 w-3.5 shrink-0 opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <IconArrowUp className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <IconArrowDown className="h-3.5 w-3.5 shrink-0" />
    );
  };

  return (
    <Card className="w-full gap-3 py-4">
      <div className="px-4">
        <LabeledSearchInput
          label="Search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name, email, or username..."
        />
      </div>

      <div className="w-full overflow-x-auto border-y border-border px-2">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              {COLUMNS.map(({ key, label }) => (
                <TableHead key={key} className="text-center whitespace-normal">
                  <button
                    type="button"
                    onClick={() => onSortChange(key)}
                    className="inline-flex w-full items-center justify-center gap-1.5 font-medium hover:text-foreground"
                  >
                    <span className="min-w-0">{label}</span>
                    {getSortIcon(key)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell />
                {COLUMNS.map(({ key }) => (
                  <TableCell key={key} className="text-center text-muted-foreground">
                    --
                  </TableCell>
                ))}
              </TableRow>
            ) : (
              users.map((row) => (
                <TableRow key={row.id} className={cn(row.banned && "bg-destructive/10")}>
                  <TableCell className="text-center">
                    <UserRowActions row={row} currentUserId={currentUserId} onRowUpdate={onRowUpdate} />
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.name}</TableCell>
                  <TableCell className="text-center">{row.email}</TableCell>
                  <TableCell className="text-center">{row.username ?? "-"}</TableCell>
                  <TableCell className="text-center capitalize">{row.role ?? "user"}</TableCell>
                  <TableCell className="text-center" title={row.banReason ?? undefined}>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        row.banned
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {row.banned ? "Banned" : "Active"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-normal">
                    {formatDate(row.lastLogin)}
                  </TableCell>
                  <TableCell className="text-center whitespace-normal">
                    {formatDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 text-sm text-muted-foreground">
        <div>
          Showing {total === 0 ? 0 : page * pageSize + 1}
          {"–"}
          {Math.min((page + 1) * pageSize, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
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
            onClick={() => onPageChange(Math.max(0, page - 1))}
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
            onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
            disabled={page >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UsersTable;
