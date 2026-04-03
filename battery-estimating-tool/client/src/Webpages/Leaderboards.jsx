import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import { modelTypes, columns, columnKeyMap } from "../Helperfunc.js";
import { useState, useEffect } from "react";
import { authClient } from '../auth-client.ts'
import useRequireAuth from "../Hooks/useRequireAuth";

// EXPOSED FUNCTIONS FOR TESTING
import { signUp, login, logout, getUserInfo, resendVerificationEmail } from "../auth-client.ts";
(window).signUp = signUp;
window.login = login;
window.logout = logout;
window.getUserInfo = getUserInfo;
window.resendVerificationEmail = resendVerificationEmail;
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


const formatRows = (rows) => rows.map((row) => {
  const obj = {};
  columns.forEach((col) => {
    const key = columnKeyMap[col];
    let value = row[key];
    if (key === "isPrivate") value = value ? "Private" : "Public";
    if (key === "createdAt" || key === "updatedAt") value = new Date(value).toLocaleString();
    obj[col] = value ?? "-";
  });
  return obj;
});

const Leaderboards = ({ estimatedSOC, filteredSOC, setFilteredSOC }) => {

  // Check Session
  const { loading: authLoading } = useRequireAuth();

  const [formattedData, setFormattedData] = useState([]); 
  const [originalData, setOriginalData] = useState([]);   
  const [loading, setLoading] = useState(true);           

  useEffect(() => {
    const init = async () => {
      const { data: session, error: sessionError } = await authClient.getSession();
      if (sessionError || !session) return; // ← just bail, useRequireAuth redirects

      const res = await fetch("/api/data/fetchLeaderboardData", { credentials: "include" });
      const json = await res.json();
      const rows = json.data;
      const formatted = formatRows(rows);
      setFormattedData(formatted);
      setOriginalData(formatted);
      setFilteredSOC(rows);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <div>Loading...</div>; 

  return (
    <>
      <StyledNavbar />
      <Container>
        {/* Title */}
        <Title>Leaderboards</Title>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>
        {/* Filters Row */}
        <FlexBox>
          <LabeledSelect label={"Filter by Author"} options={["All authors", "Paarth"]} />
          <LabeledSelect label={"Filter by Academic Affiliation"} options={["All Academic Affiliations", "McMaster"]} />
          <LabeledSelect label={"Model Type"} options={modelTypes} estimatedSOC={estimatedSOC} formattedData={formattedData} originalData={originalData} setFormattedData={setFormattedData} filteredSOC={filteredSOC} setFilteredSOC={setFilteredSOC} />
        </FlexBox>
        <MetricsTable headers={columns} estimatedSOC={filteredSOC} formattedData={formattedData} setFormattedData={setFormattedData} />
      </Container>
    </>
  );
};
export default Leaderboards