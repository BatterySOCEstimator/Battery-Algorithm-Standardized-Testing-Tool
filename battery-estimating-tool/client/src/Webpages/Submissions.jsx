import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import MetricsTable from "../Components/MetricsTable/MetricsTable"
import StyledNavbar from "../Components/Navbar/StyledNavbar"
import styled from "styled-components";
import { modelTypes, columns } from "../Helperfunc.js";


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

const Submissions = ({estimatedSOC}) => {
    console.log(estimatedSOC)

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
          <LabeledSelect label={"Model Type"} options={modelTypes} />
        </FlexBox>

        <MetricsTable estimatedSOC={estimatedSOC} headers={columns}/>
      </Container>
    </>
  );
};

export default Submissions