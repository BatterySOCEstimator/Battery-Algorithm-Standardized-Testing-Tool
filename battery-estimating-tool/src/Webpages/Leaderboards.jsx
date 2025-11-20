import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
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
const columns = [
    'Submission',
    'Model Name',
    'Model Type',
    'Status',
    'Visibility',
    'Submitted at',
    'Completed at',
    'Weighted Error',
    'All Cells',
    'Blind Cells',
    'Non-Blinded Cells',
    'Charging',
    '80kg Payload',
    '448kg Payload with HVAC',
    '448kg Payload no HVAC',
    '1000kg Payload',
    'Standard Cycles',
    'Custom Cycles',
    'n20C',
    'n10C',
    '0C',
    '10C',
    '25C',
    '40C',
    'iSOC Error',
    'Current Sensor Error',
    'All Drive Cycles Average RMSE',
    'All Drive Cycles Average MAE',
    'All Drive Cycles Average MAXE'
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

const FiltersLabel = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const Leaderboards = () => {
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
            <LabeledSelect label={"Model Type"} options={modelTypes} />
        </FlexBox>

        <MetricsTable headers={columns}/>
      </Container>
    </>
  );
};

export default Leaderboards