// ModelComparison.jsx
// Page for selecting two submitted models and comparing their numeric metrics
// Includes table-based selection and an optional graphical comparison (bar chart)

// UI components and helpers
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import SelectableMetricsTable from "../Components/SelectableMetricsTable/SelectableMetricsTable.jsx";
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import Button from 'react-bootstrap/esm/Button';
import useRequireAuth from "../Hooks/useRequireAuth"

// Constants and utilities
import { modelTypes, columnKeyMap, columns } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
import ModelCharts from "../Components/ModelCharts/ModelCharts.jsx";
import { Alert } from "react-bootstrap";

// Columns shown in the selectable tables (human-facing headers)
const tableHeaders = [
  // "Ranking",
  "Submission",
  // "Author",
  // "Affiliation",
  "Model Name",
  "Model Type",
  "Weighted Error"
];

// Flexbox container for layout
const FlexBox = styled.div`
    display:flex;
    gap: 24px;
`

// Container for page content with padding
const Container = styled.div`
  padding: 20px;
`;

// Title styling for headings
const Title = styled.h2`
  margin-bottom: 20px;
`;

// padding for model labels
const ModelNumber = styled.h4`
  margin-bottom: 20px;
`;

// size and padding for filter title
const FiltersLabel = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

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

// Utility helpers used to populate filter dropdowns
const getUniqueUsernames = (data) => {
  return [...new Set(data.map((item) => item.userName))];
};
const getUniqueUniversities = (data) => {
  return [...new Set(data.map((item) => item.academicAffiliation))];
};

const ModelComparison = ({ user }) => {
  // Filter dropdown options
  const [uniqueUsernames, setUniqueUsernames] = useState([]);
  const [uniqueUniversities, setUniqueUniversities] = useState([]);

  // Auth loading state (do not show data until auth resolved)
  const { loading: authLoading } = useRequireAuth();

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

        // Prepare filter dropdown options
        setUniqueUsernames(getUniqueUsernames(data.data));
        setUniqueUniversities(getUniqueUniversities(data.data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [selectedFilters1, setSelectedFilters1] = useState({
  "Filter by Author": "All Authors",
  "Filter by Academic Affiliation": "All Academic Affiliations",
  "Model Type": "All Model Types",
});

const [selectedFilters2, setSelectedFilters2] = useState({
  "Filter by Author": "All Authors",
  "Filter by Academic Affiliation": "All Academic Affiliations",
  "Model Type": "All Model Types",
});
const handleFilterChange1 = (label, value) => {
  setSelectedFilters1(prev => ({
    ...prev,
    [label]: value,
  }));
};

const handleFilterChange2 = (label, value) => {
  setSelectedFilters2(prev => ({
    ...prev,
    [label]: value,
  }));
};
const filterData = (data, filters) => {
  return data.filter((item) => {
    return (
      (filters["Filter by Author"] === "All Authors" ||
        item.Author === filters["Filter by Author"]) &&
      (filters["Filter by Academic Affiliation"] ===
        "All Academic Affiliations" ||
        item.Institution ===
          filters["Filter by Academic Affiliation"]) &&
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

  if (loading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  if (authLoading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  if (error) return <><StyledNavbar user={user} /><Container>Error: {error}</Container></>;

  // const { loading: authLoading } = useRequireAuth();
  // const [selectedModel1, setSelectedModel1] = useState(null);
  // const [selectedModel2, setSelectedModel2] = useState(null);
  // const [toggle, setToggle] = useState(false);
  // const [originalData, setOriginalData] = useState(formatData(estimatedSOC));
  // const [formattedData, setFormattedData] = useState(formatData(estimatedSOC));
  // const [originalData2, setOriginalData2] = useState(formatData(estimatedSOC));
  // const [formattedData2, setFormattedData2] = useState(formatData(estimatedSOC));
  // useEffect(() => {
  //   setOriginalData(formatData(estimatedSOC));
  //   setFormattedData(formatData(estimatedSOC));
  //   setOriginalData2(formatData(estimatedSOC));
  //   setFormattedData2(formatData(estimatedSOC));
  // }, [estimatedSOC]);
  // if (authLoading) return <><StyledNavbar /><Container>Loading...</Container></>;

  return (
    <>
      <StyledNavbar user={user} />

      <Container>
        {/* Comparing two of the same model alert */}
        {submitted && selectedModel1 && selectedModel2 && selectedModel1 === selectedModel2 && (
          <Alert variant="danger" dismissible onClose={() => setSubmitted(false)}>
            Cannot compare two of the same models
          </Alert>
        )}
        {/* Only one model selected alert */}
        {submitted && (!selectedModel1 || !selectedModel2) && (
          <Alert variant="danger" dismissible onClose={() => setSubmitted(false)}>
            Must select more than one model type
          </Alert>
        )}

        {/* Header with toggle to show/hide the graphical comparison */}
        <FlexBox style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Title>Model Comparison</Title>
          <Button
            variant="outline-success"
            onClick={() => {
              setSubmitted(true);
              if (selectedModel1 && selectedModel2 && selectedModel1 !== selectedModel2) {
                setToggle(!toggle);
              }
            }}
          >
            {toggle ? "Hide Graphical Comparison" : "Display Graphical Comparison"}
          </Button>
        </FlexBox>

        {/* Chart component receives transformed metrics (metric name + values for both models)
            `isHidden` controls whether the chart is visible */}
        <ModelCharts
          data={transformModels(selectedModel1, selectedModel2, columnKeyMap)}
          isHidden={!toggle}
          modelA={selectedModel1}
          modelB={selectedModel2}
        />

        {/* Left side (Model 1) controls and table */}
        <ModelNumber>Model 1</ModelNumber>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters items */}
        <FlexBox>
         <LabeledSelect
  label="Filter by Author"
  filter="Author"
  value={selectedFilters1["Filter by Author"]}
  options={["All Authors", ...uniqueUsernames]}
  onFilterChange={handleFilterChange1}
/>

<LabeledSelect
  label="Filter by Academic Affiliation"
  filter="Institution"
  value={selectedFilters1["Filter by Academic Affiliation"]}
  options={["All Academic Affiliations", ...uniqueUniversities]}
  onFilterChange={handleFilterChange1}
/>

<LabeledSelect
  label="Model Type"
  filter="Model Type"
  value={selectedFilters1["Model Type"]}
  options={modelTypes}
  onFilterChange={handleFilterChange1}
/>
        </FlexBox>

        <SelectableMetricsTable
          formattedData={formattedData}
          setFormattedData={setFormattedData}
          headers={tableHeaders}
          selectedModel={selectedModel1}
          setSelectedModel={setSelectedModel1}
        />

        {/* Right side (Model 2) controls and table */}
        <ModelNumber style={{ paddingTop: "24px" }}>Model 2</ModelNumber>

        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
        <LabeledSelect
  label="Filter by Author"
  filter="Author"
  value={selectedFilters2["Filter by Author"]}
  options={["All Authors", ...uniqueUsernames]}
  onFilterChange={handleFilterChange2}
/>

<LabeledSelect
  label="Filter by Academic Affiliation"
  filter="Institution"
  value={selectedFilters2["Filter by Academic Affiliation"]}
  options={["All Academic Affiliations", ...uniqueUniversities]}
  onFilterChange={handleFilterChange2}
/>

<LabeledSelect
  label="Model Type"
  filter="Model Type"
  value={selectedFilters2["Model Type"]}
  options={modelTypes}
  onFilterChange={handleFilterChange2}
/>
        </FlexBox>

        <SelectableMetricsTable
          formattedData={formattedData2}
          setFormattedData={setFormattedData2}
          headers={tableHeaders}
          selectedModel={selectedModel2}
          setSelectedModel={setSelectedModel2}
        />
      </Container>
    </>
  );
};

export default ModelComparison