import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import useRequireAuth from "../Hooks/useRequireAuth";
import { modelTypes, submissionsColumns, columnKeyMap } from "../Helperfunc.js";
import { useState, useEffect } from "react";
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
const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    submissionsColumns.forEach((col) => {
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

const Submissions = ({ user }) => {
  const { loading: authLoading } = useRequireAuth();
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)

useEffect(() => {

}, []);

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

  if (loading) return <><StyledNavbar  user={user}/><Container>Loading...</Container></>;
  if (authLoading) return <><StyledNavbar user={user} /><Container>Loading...</Container></>;
  if (error) return <><StyledNavbar user={user} /><Container>Error: {error}</Container></>;

  return (
    <>
      <StyledNavbar  user={user}/>

      <Container>
        {/* Title */}
        <Title>Your Submissions</Title>

        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
          <LabeledSelect label={"Model Type"} options={modelTypes} originalData={originalData} setFormattedData={setFormattedData} />
        </FlexBox>

        <MetricsTable headers={submissionsColumns} formattedData={formattedData} setFormattedData={setFormattedData} />
      </Container>
    </>
  );
};

export default Submissions