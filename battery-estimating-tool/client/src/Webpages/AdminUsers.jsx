// Admin > Users page. Gated by useRequireAdmin — non-admins (and signed-out
// visitors) get redirected before this ever renders.
import { useEffect, useState } from "react";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import UsersTable from "../Components/UsersTable/UsersTable";
import useRequireAdmin from "../Hooks/useRequireAdmin";
import { fetchUsers } from "#Constants/adminActions";

const AdminUsers = ({ user }) => {
  const { loading: authLoading } = useRequireAdmin();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // searchInput is what the text field is bound to; search is the debounced
  // value that actually drives the fetch, so typing doesn't fire a request
  // (and hit the database) on every keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  // Re-fetches whenever sort/page/pageSize/search change — the server does
  // the actual sorting, filtering, and slicing, so this always requests
  // exactly the rows this page needs instead of loading everything up front.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const load = async () => {
      try {
        setDataLoading(true);
        const { users: data, total: count } = await fetchUsers({
          limit: pageSize,
          offset: page * pageSize,
          sortBy: sortConfig.key,
          order: sortConfig.direction,
          search,
        });
        if (cancelled) return;
        setUsers(data);
        setTotal(count);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, sortConfig, page, pageSize, search]);

  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(0);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(0);
  };

  // Applies a row action's result locally right away (matching Submissions'
  // pattern) instead of waiting on a full refetch — a ban/unban already
  // confirmed success server-side by the time this runs.
  const handleRowUpdate = (id, changes) => {
    setUsers((list) => list.map((row) => (row.id === id ? { ...row, ...changes } : row)));
  };

  if (authLoading)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Loading...</div>
      </>
    );

  return (
    <>
      <StyledNavbar user={user} />
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">
        <h2 className="mb-5 text-2xl font-semibold text-foreground">Admin — Users</h2>

        {error ? (
          <p className="text-sm text-destructive">Error: {error}</p>
        ) : dataLoading && users.length === 0 && !search ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <UsersTable
            users={users}
            total={total}
            currentUserId={user?.id}
            onRowUpdate={handleRowUpdate}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            search={searchInput}
            onSearchChange={setSearchInput}
          />
        )}
      </div>
    </>
  );
};

export default AdminUsers;
