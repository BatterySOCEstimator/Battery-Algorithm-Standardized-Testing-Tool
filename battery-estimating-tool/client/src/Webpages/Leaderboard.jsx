// UI components and styling imports for the leaderboard page
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect.jsx";
import LabeledSearchInput from "../Components/LabeledSearchInput/LabeledSearchInput.jsx";
import StyledNavbar from "../Components/Navbar/StyledNavbar.jsx";

// Data constants and formatting utilities
import { modelTypes, columns, columnKeyMap } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
import { Button } from "#Components/ui/button";
import { Checkbox } from "#Components/ui/checkbox";
import { Label } from "#Components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "#Components/ui/tooltip";
import { IconHelpCircle } from "@tabler/icons-react";
import useHiddenModels from "../Hooks/useHiddenModels";

// EXPOSED FUNCTIONS FOR TESTING
import {
  signUp,
  login,
  logout,
  getUserInfo,
  resendVerificationEmail,
} from "../auth-client.ts";
import LeaderBoardMetricsTable from "../Components/LeaderBoardMetricsTable/LeaderBoardMetricsTable.jsx";
window.signUp = signUp;
window.login = login;
window.logout = logout;
window.getUserInfo = getUserInfo;
window.resendVerificationEmail = resendVerificationEmail;

// Convert raw API rows into the table-friendly display format
const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    columns.forEach((col) => {
      const key = columnKeyMap[col];
      let value = row[key];

      if (key === "isPrivate") {
        // Convert boolean to human-readable text
        value = value ? "Private" : "Public";
      }

      if (key === "createdAt" || key === "updatedAt") {
        // Format timestamps to locale strings
        value = new Date(value).toLocaleString();
      }

      // Use a dash for missing values
      obj[col] = value ?? "-";
    });

    return obj;
  });
};

const leaderboardColumns = columns.filter(
  (col) => col !== "Visibility" && col !== "Completed at",
);

// Leaderboard page component — fetches its own data on mount, so
// navigating away and back re-fetches fresh data (the route component
// unmounts when you leave and remounts when you return).
const Leaderboard = ({ user }) => {
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFilters, setSelectedFilters] = useState({
    "Filter by Author": "",
    "Filter by Academic Affiliation": "",
    "Model Type": "All Model Types",
  });
  // Your own private models are included in the fetched data (the endpoint
  // returns public models + your own private ones, never other users'
  // private ones) but hidden from the table/downloads unless this is on.
  const [showPrivate, setShowPrivate] = useState(false);

  // Personal "hide this model from my view" preference (device-local, not
  // server-side) — shared with the Submissions page via the same storage.
  const { hiddenIds, hideModel, unhideModel } = useHiddenModels();
  const [showHidden, setShowHidden] = useState(false);

  const handleFilterChange = (label, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  // Fetches the leaderboard data. Runs on every mount, so switching to this
  // tab always pulls fresh data instead of showing stale state.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // fetchLeaderboardData scopes results server-side to public models
        // plus your own private ones (never other users' private models).
        // limit=100 is the backend's max page size — the table already
        // does its own client-side sort/filter/pagination over the full
        // result set.
        const response = await fetch("/api/data/fetchLeaderboardData?limit=100");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();

        const formatted = formatData(data.data);
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

  useEffect(() => {
    const filtered = originalData.filter((item) => {
      return (
        (showPrivate || item.Visibility !== "Private") &&
        (showHidden || !hiddenIds.has(item.Submission)) &&
        (item.Author ?? "")
          .toLowerCase()
          .includes(selectedFilters["Filter by Author"].toLowerCase()) &&
        (item.Affiliation ?? "")
          .toLowerCase()
          .includes(
            selectedFilters["Filter by Academic Affiliation"].toLowerCase(),
          ) &&
        (selectedFilters["Model Type"] === "All Model Types" ||
          item["Model Type"] === selectedFilters["Model Type"])
      );
    });

    setFormattedData(filtered);
  }, [selectedFilters, originalData, showPrivate, showHidden, hiddenIds]);

  // Display loading state while data is being fetched
  if (loading)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Loading...</div>
      </>
    );
  // Display any errors from data fetching or processing
  if (error)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Error: {error}</div>
      </>
    );

  return (
    <>
      <StyledNavbar user={user} />
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">
        {/* Title and Contact Button */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            Leaderboard
          </h2>
          <Button
            variant="outline"
            onClick={() =>
              (window.location.href = "mailto:socbench@mcmaster.ca")
            }
          >
            Contact Administrator
          </Button>
        </div>
        {/* Main metrics table component, with filters in its toolbar */}
        <LeaderBoardMetricsTable
          headers={leaderboardColumns}
          formattedData={formattedData}
          setFormattedData={setFormattedData}
          originalData={originalData}
          showPrivate={showPrivate}
          hiddenIds={hiddenIds}
          onHideRow={hideModel}
          onUnhideRow={unhideModel}
          showHidden={showHidden}
          onToggleShowHidden={() => setShowHidden((prev) => !prev)}
          filters={
            <>
              <LabeledSearchInput
                label="Filter by Author"
                value={selectedFilters["Filter by Author"]}
                onChange={(value) =>
                  handleFilterChange("Filter by Author", value)
                }
                placeholder="Search authors..."
              />
              <LabeledSearchInput
                label="Filter by Affiliation"
                value={selectedFilters["Filter by Academic Affiliation"]}
                onChange={(value) =>
                  handleFilterChange("Filter by Academic Affiliation", value)
                }
                placeholder="Search affiliations..."
              />
              <LabeledSelect
                label={"Model Type"}
                filter={"Model Type"}
                options={modelTypes}
                originalData={originalData}
                setFormattedData={setFormattedData}
                onFilterChange={handleFilterChange}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-private"
                  checked={showPrivate}
                  onCheckedChange={setShowPrivate}
                />
                <Label htmlFor="show-private" className="cursor-pointer font-normal">
                  Show private models
                </Label>
                <Tooltip>
                  <TooltipTrigger className="flex items-center text-muted-foreground hover:text-foreground">
                    <IconHelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    If you are signed in, your private models will display on the
                    leaderboard and in downloaded CSV files when this box is checked.
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          }
        />
      </div>
    </>
  );
};
export default Leaderboard;
