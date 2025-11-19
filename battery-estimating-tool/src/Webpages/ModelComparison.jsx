import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import Button from 'react-bootstrap/esm/Button';

const modelTypes = [
  "All Model Types",
  "Machine Learning",
  "Kalman Filter",
  "Extended Kalman Filter",
  "Other Kalman Filter",
  "FNN",
  "LSTM",
  "GRU",
  "NARX",
  "Transformer",
  "Other Neural Network",
  "Coulomb Counter",
  "Hybrid Model",
  "Not Specified"
];
const tableHeaders = [
  "Ranking",
  "Submission",
  "Author",
  "Affiliation",
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

const ModelComparison = () => {
  return (
    <>
      <StyledNavbar />

      <Container>
        {/* Title */}
        <FlexBox style={{"alignItems": "center", justifyContent: "space-between"}}>
        <Title>Model Comparison</Title>
        <Button variant="outline-success">Display Graphical Comparison</Button>

        </FlexBox>
        <ModelNumber>Model 1</ModelNumber>
        {/* Filters label */}
        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
            <LabeledSelect label={"Filter by Author"} options={["All authors", "Paarth"]} />
            <LabeledSelect label={"Filter by Academic Affiliation"} options={["All Academic Affiliations", "McMaster"]} />
            <LabeledSelect label={"Model Type"} options={modelTypes} />
        </FlexBox>

        <MetricsTable headers={tableHeaders} />
        
        <ModelNumber>Model 2</ModelNumber>

        <FiltersLabel>Filters:</FiltersLabel>

        {/* Filters Row */}
        <FlexBox>
            <LabeledSelect label={"Filter by Author"} options={["All authors", "Paarth"]} />
            <LabeledSelect label={"Filter by Academic Affiliation"} options={["All Academic Affiliations", "McMaster"]} />
            <LabeledSelect label={"Model Type"} options={modelTypes} />
        </FlexBox>

        <MetricsTable headers={tableHeaders} />
        

      </Container>
    </>
  );
};

export default ModelComparison