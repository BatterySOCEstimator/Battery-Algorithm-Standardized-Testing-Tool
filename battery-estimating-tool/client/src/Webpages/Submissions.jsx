import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import { modelTypes, columns, columnKeyMap } from "../Helperfunc.js";
import { useState,useEffect } from "react";

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

const Submissions = ({estimatedSOC}) => {
  const [originalData, setOriginalData] = useState(formatData(estimatedSOC));
  const [formattedData, setFormattedData] = useState(formatData(estimatedSOC));
  useEffect(() => {
  setOriginalData(formatData(estimatedSOC));
  setFormattedData(formatData(estimatedSOC));
}, [estimatedSOC]);
  return (
    <>
      <StyledNavbar />

      <Container>
        {/* Title */}
        <Title>Submissions</Title>

        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
          <LabeledSelect label={"Model Type"} options={modelTypes} originalData={originalData} setFormattedData={setFormattedData}/>
        </FlexBox>

        <MetricsTable headers={columns} formattedData={formattedData} setFormattedData={setFormattedData} />
      </Container>
    </>
  );
};

export default Submissions