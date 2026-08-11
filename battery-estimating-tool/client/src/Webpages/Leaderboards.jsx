// UI components and styling imports for the leaderboard page
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";

// Data constants and formatting utilities
import { modelTypes, columns, columnKeyMap } from "../Constants/Helperfunc.js";
import { useState, useEffect } from "react";
import useRequireAuth from "../Hooks/useRequireAuth";
import { Button } from "react-bootstrap";

// EXPOSED FUNCTIONS FOR TESTING
import { signUp, login, logout, getUserInfo, resendVerificationEmail } from "../auth-client.ts";
import LeaderBoardMetricsTable from "../Components/LeaderBoardMetricsTable/LeaderBoardMetricsTable.jsx";
(window).signUp = signUp;
window.login = login;
window.logout = logout;
window.getUserInfo = getUserInfo;
window.resendVerificationEmail = resendVerificationEmail;

// Layout helpers for the leaderboard page
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
const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

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

// Helpers to extract unique filter values from data
const getUniqueUsernames = (data) => {
  return [...new Set(data.map(item => item.userName))];
};
const getUniqueUniversities = (data) => {
  return [...new Set(data.map(item => item.academicAffiliation))];
};

// Leaderboards page component — receives filtered data and state from parent router
const Leaderboards = ({user, uniqueUsernames, uniqueUniversities, originalData, formattedData, loading, error, setFormattedData}) => {
  
  const [selectedFilters, setSelectedFilters] = useState({
  "Filter by Author": "All Authors",
  "Filter by Academic Affiliation": "All Academic Affiliations",
  "Model Type": "All Model Types",
});

  const handleFilterChange = (label, value) => {
  setSelectedFilters((prev) => ({
    ...prev,
    [label]: value,
  }));
  console.log(selectedFilters)
};
useEffect(() => {
  const filtered = originalData.filter((item) => {
    return (
      (selectedFilters["Filter by Author"] === "All Authors" ||
        item.Author === selectedFilters["Filter by Author"]) &&
      (selectedFilters["Filter by Academic Affiliation"] ===
        "All Academic Affiliations" ||
        item.Institution ===
          selectedFilters["Filter by Academic Affiliation"]) &&
      (selectedFilters["Model Type"] === "All Model Types" ||
        item["Model Type"] === selectedFilters["Model Type"])
    );
  });

  setFormattedData(filtered);
}, [selectedFilters, originalData]);
  // const [uniqueUsernames, setUniqueUsernames] = useState([]);
  // const [uniqueUniversities, setUniqueUniversities] = useState([]);
  const { loading: authLoading } = useRequireAuth();
  // const [originalData, setOriginalData] = useState([]);
  // const [formattedData, setFormattedData] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await fetch("/api/data/fetchUserModelJoin");
  //       if (!response.ok) throw new Error(`Error: ${response.status}`);
  //       const data = await response.json();
  //       console.log(data.data);
  //       const filtered = data.data.filter(model => model.isPrivate == false);
  //       console.log(filtered);

  //       const formatted = formatData(filtered);

  //       setOriginalData(formatted);
  //       setFormattedData(formatted);
  //       setUniqueUsernames(getUniqueUsernames(data.data));
  //       setUniqueUniversities(getUniqueUniversities(data.data));
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
        
  //     }
  //   };
  //   fetchData();
  // }, []);

  // Display loading state while the parent is preparing data
  if (loading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  // if (authLoading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  // Display any errors from data fetching or processing
  if (error) return <><StyledNavbar user={user} /><Container>Error: {error}</Container></>;

  return (
    <>
      <StyledNavbar user={user} />
      <Container>
        {/* Title and Contact Button */}
        <TitleSection>
          <Title style={{ margin: 0 }}>Leaderboards</Title>
          <Button variant="outline-secondary" onClick={() => window.location.href = 'mailto:kollmeyp@mcmaster.ca'}>Contact Administrator</Button>
        </TitleSection>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>
        {/* Filters items */}
        <FlexBox>
          <LabeledSelect 
            label={"Filter by Author"} 
            filter={"Author"}
            options={["All Authors", uniqueUsernames]} 
            originalData={originalData} 
            setFormattedData={setFormattedData} 
            onFilterChange={handleFilterChange}

          />
          <LabeledSelect 
            label={"Filter by Academic Affiliation"} 
            filter={"Institution"}
            options={["All Academic Affiliations", uniqueUniversities]} 
            originalData={originalData} 
            setFormattedData={setFormattedData} 
              onFilterChange={handleFilterChange}

          />
          <LabeledSelect label={"Model Type"} filter={"Model Type"} options={modelTypes} originalData={originalData} setFormattedData={setFormattedData}
            onFilterChange={handleFilterChange}
 />
        </FlexBox>

        {/* Main metrics table component */}
        <LeaderBoardMetricsTable headers={columns} formattedData={formattedData} setFormattedData={setFormattedData} />
      </Container>
    </>
  );
};
export default Leaderboards