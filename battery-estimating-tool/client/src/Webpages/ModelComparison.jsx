// ModelComparison.jsx
// Page for selecting two submitted models and comparing their numeric metrics
// Includes table-based selection and an optional graphical comparison (bar chart)

// UI components and helpers
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import LabeledSearchInput from "../Components/LabeledSearchInput/LabeledSearchInput";
import SelectableMetricsTable from "../Components/SelectableMetricsTable/SelectableMetricsTable.jsx";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import { Button } from "#Components/ui/button";
import { Alert, AlertDescription } from "#Components/ui/alert";
import { IconX } from "@tabler/icons-react";
//import useRequireAuth from "../Hooks/useRequireAuth"

// Constants and utilities
import { modelTypes, columnKeyMap, columns } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
import ModelCharts from "../Components/ModelCharts/ModelCharts.jsx";

// Columns shown in the selectable tables (human-facing headers)
const tableHeaders = [
  // "Ranking",
  "Submission",
  "Author",
  "Affiliation",
  "Model Name",
  "Model Type",
  "Weighted Error"
];

// Transform two model objects into a comparison-friendly format
function transformModels(modelA, modelB, columnKeyMap) {
  // reverse the keys
  const reverseMap = Object.fromEntries(
    Object.entries(columnKeyMap).map(([label, key]) => [key, label])
  );
  if (modelA && modelB) {
    return Object.keys(modelA)
    // Filter to only include numeric metrics that exist in both models, excluding the ID
      .filter(
        (key) =>
          key !== "id" &&
          typeof modelA[key] === "number" &&
          typeof modelB[key] === "number"
      )
      .map((key) => ({
        metric: reverseMap[key] || key,
        modelA: modelA[key],
        modelB: modelB[key],
      }))
  };
}
const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    columns.forEach((col) => {
      const key = columnKeyMap[col];
      let value = row[key];

      if (key === "isPrivate") {
        value = value ? "Private" : "Public";
      }

      if (key === "createdAt" || key === "updatedAt") {
        value = new Date(value).toLocaleString();
      }

      obj[col] = value ?? "-";
    });

    return obj;
  });
};

const ModelComparison = ({ user }) => {
  // Auth loading state (do not show data until auth resolved)
  //const { loading: authLoading } = useRequireAuth();

  // Two independent datasets (left and right tables) and their formatted variants
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);
  const [originalData2, setOriginalData2] = useState([]);
  const [formattedData2, setFormattedData2] = useState([]);

  // Selected models to compare (store the full row object for charting)
  const [selectedModel1, setSelectedModel1] = useState(null);
  const [selectedModel2, setSelectedModel2] = useState(null);

  // UI state: whether the user tried to submit, chart toggle, loading and error
  const [submitted, setSubmitted] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all user-submission joined data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/data/fetchUserModelJoin");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();

        // Keep a formatted copy for display in tables
        const formatted = formatData(data.data);
        setOriginalData(formatted);
        setFormattedData(formatted);
        setOriginalData2(formatted);
        setFormattedData2(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [selectedFilters1, setSelectedFilters1] = useState({
    "Filter by Author": "",
    "Filter by Academic Affiliation": "",
    "Model Type": "All Model Types",
  });

  const [selectedFilters2, setSelectedFilters2] = useState({
    "Filter by Author": "",
    "Filter by Academic Affiliation": "",
    "Model Type": "All Model Types",
  });
  const handleFilterChange1 = (label, value) => {
    setSelectedFilters1((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleFilterChange2 = (label, value) => {
    setSelectedFilters2((prev) => ({
      ...prev,
      [label]: value,
    }));
  };
  const filterData = (data, filters) => {
    return data.filter((item) => {
      return (
        (item.Author ?? "")
          .toLowerCase()
          .includes(filters["Filter by Author"].toLowerCase()) &&
        (item.Affiliation ?? "")
          .toLowerCase()
          .includes(filters["Filter by Academic Affiliation"].toLowerCase()) &&
        (filters["Model Type"] === "All Model Types" ||
          item["Model Type"] === filters["Model Type"])
      );
    });
  };
  useEffect(() => {
    setFormattedData(filterData(originalData, selectedFilters1));
  }, [selectedFilters1, originalData]);

  useEffect(() => {
    setFormattedData2(filterData(originalData2, selectedFilters2));
  }, [selectedFilters2, originalData2]);

  if (loading)
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

  return (
    <>
      <StyledNavbar user={user} />

      <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">
        {/* Comparing two of the same model alert */}
        {submitted && selectedModel1 && selectedModel2 && selectedModel1 === selectedModel2 && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-row items-center justify-between">
              Cannot compare two of the same models
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-current opacity-70 hover:opacity-100"
              >
                <IconX className="size-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}
        {/* Only one model selected alert */}
        {submitted && (!selectedModel1 || !selectedModel2) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-row items-center justify-between">
              Must select more than one model type
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-current opacity-70 hover:opacity-100"
              >
                <IconX className="size-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header with toggle to show/hide the graphical comparison */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Model Comparison</h2>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(true);
              if (selectedModel1 && selectedModel2 && selectedModel1 !== selectedModel2) {
                setToggle(!toggle);
              }
            }}
          >
            {toggle ? "Hide Graphical Comparison" : "Display Graphical Comparison"}
          </Button>
        </div>

        {/* Chart component receives transformed metrics (metric name + values for both models)
            `isHidden` controls whether the chart is visible */}
        <ModelCharts
          data={transformModels(selectedModel1, selectedModel2, columnKeyMap)}
          isHidden={!toggle}
          modelA={selectedModel1}
          modelB={selectedModel2}
        />

        {/* Left side (Model 1) controls and table */}
        <h3 className="mb-3 text-lg font-semibold text-foreground">Model 1</h3>

        <SelectableMetricsTable
          formattedData={formattedData}
          setFormattedData={setFormattedData}
          headers={tableHeaders}
          selectedModel={selectedModel1}
          setSelectedModel={setSelectedModel1}
          filters={
            <>
              <LabeledSearchInput
                label="Filter by Author"
                value={selectedFilters1["Filter by Author"]}
                onChange={(value) => handleFilterChange1("Filter by Author", value)}
                placeholder="Search authors..."
              />
              <LabeledSearchInput
                label="Filter by Academic Affiliation"
                value={selectedFilters1["Filter by Academic Affiliation"]}
                onChange={(value) =>
                  handleFilterChange1("Filter by Academic Affiliation", value)
                }
                placeholder="Search affiliations..."
              />
              <LabeledSelect
                label="Model Type"
                filter="Model Type"
                value={selectedFilters1["Model Type"]}
                options={modelTypes}
                onFilterChange={handleFilterChange1}
              />
            </>
          }
        />

        {/* Right side (Model 2) controls and table */}
        <h3 className="mt-6 mb-3 text-lg font-semibold text-foreground">Model 2</h3>

        <SelectableMetricsTable
          formattedData={formattedData2}
          setFormattedData={setFormattedData2}
          headers={tableHeaders}
          selectedModel={selectedModel2}
          setSelectedModel={setSelectedModel2}
          filters={
            <>
              <LabeledSearchInput
                label="Filter by Author"
                value={selectedFilters2["Filter by Author"]}
                onChange={(value) => handleFilterChange2("Filter by Author", value)}
                placeholder="Search authors..."
              />
              <LabeledSearchInput
                label="Filter by Academic Affiliation"
                value={selectedFilters2["Filter by Academic Affiliation"]}
                onChange={(value) =>
                  handleFilterChange2("Filter by Academic Affiliation", value)
                }
                placeholder="Search affiliations..."
              />
              <LabeledSelect
                label="Model Type"
                filter="Model Type"
                value={selectedFilters2["Model Type"]}
                options={modelTypes}
                onFilterChange={handleFilterChange2}
              />
            </>
          }
        />
      </div>
    </>
  );
};

export default ModelComparison;
