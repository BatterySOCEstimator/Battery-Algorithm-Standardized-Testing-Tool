// Submissions page: shows the current user's model submissions.
// Imports: UI components, helper utilities and hooks used on this page.
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import useRequireAuth from "../Hooks/useRequireAuth";
import { modelTypes, submissionsColumns, columnKeyMap } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
// Auth helper to obtain current user information
import { getUserInfo } from "../auth-client.ts";
const FlexBox = styled.div`
    display:flex;
    gap: 24px;
`
const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
`;

const FiltersLabel = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;
// Transform raw submission objects from the API into the shape expected
// by `MetricsTable`. Handles key mapping, boolean -> label conversion,
// date formatting and fills missing values with a placeholder.
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

      obj[col] = value ?? "-";
    });

    return obj;
  });
};

const Submissions = ({ user }) => {
  // Wait for authentication check before showing user data
  const { loading: authLoading } = useRequireAuth();

  // Store both the raw formatted dataset and the currently displayed dataset
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);

  // Loading/error state for the page's data request
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)

const [selectedFilters, setSelectedFilters] = useState({
  "Model Type": "All Model Types",
});

const handleFilterChange = (label, value) => {
  setSelectedFilters((prev) => ({
    ...prev,
    [label]: value,
  }));
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/data/fetchLeaderboardData");
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        const user = await getUserInfo();
        const userId = user.id;
        const filtered = data.data.filter(model => model.userId === userId);
        const formatted = formatData(filtered);
        
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
  if (!originalData) return;

  const filtered = originalData.filter((item) => {
    return (
      selectedFilters["Model Type"] === "All Model Types" ||
      item["Model Type"] === selectedFilters["Model Type"]
    );
  });

  setFormattedData(filtered);
}, [selectedFilters, originalData]);

  // Top-level states: loading, authPending or error
  if (loading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  if (authLoading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  if (error) return <><StyledNavbar user={user} /><Container>Error: {error}</Container></>;

  // Render: Navbar, filters and the submissions table
  return (
    <>
      <StyledNavbar user={user} />

      <Container>
        {/* Title */}
        <Title>Submissions</Title>

        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
  <LabeledSelect
    label="Model Type"
    filter="Model Type"
    value={selectedFilters["Model Type"]}
    options={modelTypes}
    onFilterChange={handleFilterChange}
  />
</FlexBox>

        {/* MetricsTable handles sorting/pagination and displays formattedData */}
        <MetricsTable
          headers={submissionsColumns}
          formattedData={formattedData}
          setFormattedData={setFormattedData}
        />
      </Container>
    </>
  );
};

export default Submissions