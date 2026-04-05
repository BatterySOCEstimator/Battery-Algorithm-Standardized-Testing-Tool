import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import SelectableMetricsTable from "../Components/SelectableMetricsTable/SelectableMetricsTable.jsx";
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import Button from 'react-bootstrap/esm/Button';
import useRequireAuth from "../Hooks/useRequireAuth";
import { modelTypes, columnKeyMap, columns } from "../Helperfunc.js";
import { useState, useEffect } from "react";
import ModelCharts from "../Components/ModelCharts/ModelCharts.jsx";
const tableHeaders = [
  // "Ranking",
  "Submission",
  // "Author",
  // "Affiliation",
  "Model Name",
  "Model Type",
  "Weighted Error"
];

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

const ModelNumber = styled.h4`
  margin-bottom: 20px;
`;

const FiltersLabel = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;
function transformModels(modelA, modelB, columnKeyMap) {
  const reverseMap = Object.fromEntries(
    Object.entries(columnKeyMap).map(([label, key]) => [key, label])
  );
  if (modelA && modelB) {
    return Object.keys(modelA)
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

const ModelComparison = ({ estimatedSOC }) => {
  const { loading: authLoading } = useRequireAuth();
  const [selectedModel1, setSelectedModel1] = useState(null);
  const [selectedModel2, setSelectedModel2] = useState(null);
  const [toggle, setToggle] = useState(false);
  const [originalData, setOriginalData] = useState(formatData(estimatedSOC));
  const [formattedData, setFormattedData] = useState(formatData(estimatedSOC));
  const [originalData2, setOriginalData2] = useState(formatData(estimatedSOC));
  const [formattedData2, setFormattedData2] = useState(formatData(estimatedSOC));
  useEffect(() => {
    setOriginalData(formatData(estimatedSOC));
    setFormattedData(formatData(estimatedSOC));
    setOriginalData2(formatData(estimatedSOC));
    setFormattedData2(formatData(estimatedSOC));
  }, [estimatedSOC]);
  if (authLoading) return <><StyledNavbar /><Container>Loading...</Container></>;

  return (
    <>
      <StyledNavbar />

      <Container>
        {/* Title */}
        <FlexBox style={{ "alignItems": "center", justifyContent: "space-between" }}>
          <Title>Model Comparison</Title>
          <Button variant="outline-success" onClick={() => setToggle(!toggle)}>
            {toggle ? "Hide Graphical Comparison" : "Display Graphical Comparison"}
          </Button>

        </FlexBox>
        <ModelCharts data={transformModels(selectedModel1, selectedModel2, columnKeyMap)} isHidden={!toggle} modelA={selectedModel1} modelB={selectedModel2} />

        <ModelNumber>Model 1</ModelNumber>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
          <LabeledSelect label={"Filter by Author"} options={["All authors", "Paarth"]} />
          <LabeledSelect label={"Filter by Academic Affiliation"} options={["All Academic Affiliations", "McMaster"]} />
          <LabeledSelect label={"Model Type"} options={modelTypes} setFormattedData={setFormattedData} originalData={originalData} />
        </FlexBox>

        <SelectableMetricsTable formattedData={formattedData} setFormattedData={setFormattedData} headers={tableHeaders} selectedModel={selectedModel1} setSelectedModel={setSelectedModel1} />

        <ModelNumber style={{ paddingTop: "24px" }}>Model 2</ModelNumber>

        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
          <LabeledSelect label={"Filter by Author"} options={["All authors", "Paarth"]} />
          <LabeledSelect label={"Filter by Academic Affiliation"} options={["All Academic Affiliations", "McMaster"]} />
          <LabeledSelect label={"Model Type"} options={modelTypes} setFormattedData={setFormattedData2} originalData={originalData2} />
        </FlexBox>

        <SelectableMetricsTable formattedData={formattedData2} setFormattedData={setFormattedData2} headers={tableHeaders} selectedModel={selectedModel2} setSelectedModel={setSelectedModel2} />


      </Container>
    </>
  );
};

export default ModelComparison