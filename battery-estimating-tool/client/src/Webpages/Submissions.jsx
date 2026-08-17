// Submissions page: shows the current user's model submissions.
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import LabeledSearchInput from "../Components/LabeledSearchInput/LabeledSearchInput";
import SubmissionsMetricsTable from "../Components/SubmissionsMetricsTable/SubmissionsMetricsTable";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import useRequireAuth from "../Hooks/useRequireAuth";
import useHiddenModels from "../Hooks/useHiddenModels";
import { modelTypes, submissionsColumns, columnKeyMap, formatComplexity, formatSizeKb } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
// Auth helper to obtain current user information
import { getUserInfo } from "../auth-client.ts";

// Transform raw submission objects from the API into the shape expected
// by `SubmissionsMetricsTable`. Handles key mapping, boolean -> label
// conversion, date formatting and fills missing values with a placeholder.
const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    submissionsColumns.forEach((col) => {
      const key = columnKeyMap[col];
      let value = row[key];

      // Turn boolean privacy flag into a human readable label
      if (key === "isPrivate") {
        value = value ? "Private" : "Public";
      }

      // Format timestamps for display
      if (key === "createdAt" || key === "updatedAt") {
        value = new Date(value).toLocaleString();
      }

      if (key === "complexity") {
        value = formatComplexity(value);
      }

      if (key === "totalSizeKb") {
        value = formatSizeKb(value);
      }

      obj[col] = value ?? "-";
    });

    // Not a visible table column, but the row actions menu needs these to
    // back the Download Model / Download Results links (only usable once
    // Status is "ready"). Description is now a real column (see the loop
    // above), so the edit dialog already gets it from there.
    obj.ModelFileToken = row.modelFileToken ?? null;
    obj.ResultsFileToken = row.resultsFileToken ?? null;

    return obj;
  });
};

const Submissions = ({ user }) => {
  // Wait for authentication check before showing user data
  const { loading: authLoading } = useRequireAuth();

  // Personal "hide this model from my view" preference (device-local, not
  // server-side) — shared with the Leaderboard page via the same storage.
  const { hiddenIds, hideModel, unhideModel } = useHiddenModels();
  const [showHidden, setShowHidden] = useState(false);

  // Store both the raw formatted dataset and the currently displayed dataset
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);

  // Loading/error state for the page's data request
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the currently selected filters
  const [selectedFilters, setSelectedFilters] = useState({
    Title: "",
    "Model Type": "All Model Types",
    Visibility: "All",
  });

  const handleFilterChange = (label, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  // Applies a row-action's changes to local state right away, ahead of
  // the (currently stubbed) backend actually persisting them.
  const handleRowUpdate = (id, changes) => {
    const patch = (list) =>
      list.map((row) => (row.Submission === id ? { ...row, ...changes } : row));
    setOriginalData(patch);
    setFormattedData(patch);
  };

  const handleRowDelete = (id) => {
    const remove = (list) => list.filter((row) => row.Submission !== id);
    setOriginalData(remove);
    setFormattedData(remove);
  };

  // This useEffect runs once when the page is loaded or reloads as noted at the end by []
  useEffect(() => {
    // This function fetches the current user submissions
    const fetchData = async () => {
      try {
        setLoading(true);
        // fetchLeaderboardData hardcodes `alreadyEvaluated = true` server-side
        // (it's built for the public leaderboard), which silently hid your
        // own pending/unevaluated models here. fetchUserModelJoin has no
        // such filtering — same endpoint Leaderboard.jsx uses — so switch to
        // that and keep doing the userId filter client-side below.
        // limit=100 is the backend's max page size — the table already does
        // its own client-side sort/filter/pagination over the full result set.
        const response = await fetch("/api/data/fetchUserModelJoin?limit=100");
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        //Manual filtering done by the frontend to only show the current user's submissions. Very bad practice but will be fixed.
        const user = await getUserInfo();
        const userId = user.id;
        const filtered = data.data.filter((model) => model.userId === userId);
        const formatted = formatData(filtered);
        // Set the data states with the formatted data (formatted really just means the nonleaderboard user submissions)
        setOriginalData(formatted);
        setFormattedData(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // This is responsible for actually filtering the data based on the selected filters.
  // triggers whenever `originalData` or `selectedFilters` changes.
  useEffect(() => {
    if (!originalData) return;
    const filtered = originalData.filter((item) => {
      return (
        (showHidden || !hiddenIds.has(item.Submission)) &&
        (item["Model Name"] ?? "")
          .toLowerCase()
          .includes(selectedFilters["Title"].toLowerCase()) &&
        (selectedFilters["Model Type"] === "All Model Types" ||
          item["Model Type"] === selectedFilters["Model Type"]) &&
        (selectedFilters["Visibility"] === "All" ||
          item["Visibility"] === selectedFilters["Visibility"])
      );
    });

    setFormattedData(filtered);
  }, [selectedFilters, originalData, showHidden, hiddenIds]);

  // Top-level states: loading, authPending or error
  if (loading)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Loading...</div>
      </>
    );
  if (authLoading)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Loading...</div>
      </>
    );
  if (error)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Error: {error}</div>
      </>
    );

  // Render: Navbar, filters and the submissions table
  return (
    <>
      <StyledNavbar user={user} />
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Your Submissions</h2>
        </div>

        {/* Main metrics table component, with filters in its toolbar */}
        <SubmissionsMetricsTable
          headers={submissionsColumns}
          formattedData={formattedData}
          setFormattedData={setFormattedData}
          onRowUpdate={handleRowUpdate}
          onRowDelete={handleRowDelete}
          originalData={originalData}
          hiddenIds={hiddenIds}
          onHideRow={hideModel}
          onUnhideRow={unhideModel}
          showHidden={showHidden}
          onToggleShowHidden={() => setShowHidden((prev) => !prev)}
          filters={
            <>
              <LabeledSearchInput
                label="Model Name"
                value={selectedFilters["Title"]}
                onChange={(value) => handleFilterChange("Title", value)}
                placeholder="Search by Model Name..."
              />
              <LabeledSelect
                label="Model Type"
                filter="Model Type"
                value={selectedFilters["Model Type"]}
                options={modelTypes}
                onFilterChange={handleFilterChange}
              />
              <LabeledSelect
                label="Visibility"
                filter="Visibility"
                value={selectedFilters["Visibility"]}
                options={["All", "Private", "Public"]}
                onFilterChange={handleFilterChange}
              />
            </>
          }
        />
      </div>
    </>
  );
};

export default Submissions;
