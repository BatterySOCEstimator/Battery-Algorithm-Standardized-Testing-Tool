import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import SelectableMetricsTable from "../Components/SelectableMetricsTable/SelectableMetricsTable.jsx";
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import Button from 'react-bootstrap/esm/Button';
import useRequireAuth from "../Hooks/useRequireAuth";
import { modelTypes, columnKeyMap, columns } from "../Helperfunc.js";
import { useState, useEffect } from "react";
import ModelCharts from "../Components/ModelCharts/ModelCharts.jsx";
import { Alert } from "react-bootstrap";
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

const getUniqueUsernames = (data) => {
  return [...new Set(data.map(item => item.userName))];
};
const getUniqueUniversities = (data) => {
  return [...new Set(data.map(item => item.academicAffiliation))];
};

const ModelComparison = ({ user }) => {
  const [uniqueUsernames, setUniqueUsernames] = useState([]);
  const [uniqueUniversities, setUniqueUniversities] = useState([]);
  const { loading: authLoading } = useRequireAuth();
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);
  const [originalData2, setOriginalData2] = useState([]);
  const [formattedData2, setFormattedData2] = useState([]);
  const [selectedModel1, setSelectedModel1] = useState(null);
  const [selectedModel2, setSelectedModel2] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/data/fetchUserModelJoin");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        const formatted = formatData(data.data);
        setOriginalData(formatted);
        setFormattedData(formatted);
        setOriginalData2(formatted);
        setFormattedData2(formatted);
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
                {submitted && selectedModel1 && selectedModel2 && selectedModel1 === selectedModel2 && (
          <Alert variant="danger" dismissible onClose={() => setSubmitted(false)}>
            Cannot compare two of the same models
          </Alert>
        )}

        {submitted && (!selectedModel1 || !selectedModel2) && (
          <Alert variant="danger" dismissible onClose={() => setSubmitted(false)}>
            Must select more than one model type
          </Alert>
        )}
        <FlexBox style={{ "alignItems": "center", justifyContent: "space-between" }}>
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
        <ModelCharts data={transformModels(selectedModel1, selectedModel2, columnKeyMap)} isHidden={!toggle} modelA={selectedModel1} modelB={selectedModel2} />

        <ModelNumber>Model 1</ModelNumber>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
         <LabeledSelect 
            label={"Filter by Author"} 
            filter={"Author"}
            options={["All Authors", uniqueUsernames]} 
            originalData={originalData} 
            setFormattedData={setFormattedData} 
          />
          <LabeledSelect 
            label={"Filter by Academic Affiliation"} 
            filter={"Institution"}
            options={["All Academic Affiliations", uniqueUniversities]} 
            originalData={originalData} 
            setFormattedData={setFormattedData} 
          />
          <LabeledSelect label={"Model Type"} filter = {"Model Type"} options={modelTypes} originalData={originalData} setFormattedData={setFormattedData} />
        
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