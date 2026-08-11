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
// State for the currently selected filters
const [selectedFilters, setSelectedFilters] = useState({
  "Model Type": "All Model Types",
  "Visibility": "All",
});

const handleFilterChange = (label, value) => {
  // When passing an argument in a setter function, if you give it a previously undefined variable argument (e.g. prev)
  // It will inject the current value of the getter function as prev
  setSelectedFilters((prev) => ({
    // Copy all of the existing filter values.
    ...prev,
    // find the label of the filter that was changed, and update its value to the new value.
    [label]: value,
  }));
};
  // This useEffect runs once when the page is loaded or reloads as noted at the end by []
  useEffect(() => {
    // This function fetches the current user submissions
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch the leaderboard data from the API MUST BE CHANGED WILL ADD A SUBMISSION ENDPOINT LATER
        const response = await fetch("/api/data/fetchLeaderboardData");
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        //Manual filtering done by the frontend to only show the current user's submissions. Very bad practice but will be fixed.
        const user = await getUserInfo();
        const userId = user.id;
        const filtered = data.data.filter(model => model.userId === userId);
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
  // The following is the filter function given by javascript. It iterates through each item within the originalData array
  const filtered = originalData.filter((item) => {
    return (
      // every item within the array is a model submission object. If either of the "All" filters are selected their subsequent conditions are ignored.
      // Otherwise, check to see if the item matches the selected filter value. If it doesn't, don't include it.
      (selectedFilters["Model Type"] === "All Model Types" ||
      item["Model Type"] === selectedFilters["Model Type"]) &&
      (selectedFilters["Visibility"] === "All" ||
      item["Visibility"] === selectedFilters["Visibility"])
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
  <LabeledSelect
    label="Visibility"
    filter="Visibility"
    value={selectedFilters["Visibility"]}
    options={["All", "Private", "Public"]}
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