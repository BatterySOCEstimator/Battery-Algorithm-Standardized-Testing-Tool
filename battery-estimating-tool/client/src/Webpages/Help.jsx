import StyledNavbar from '../Components/Navbar/StyledNavbar'
import styled from 'styled-components';
const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
`;
const Help = () => {
    return(
        <>
        <StyledNavbar/>
            <Container>

        <Title>Help</Title>
        Password Reset, Valid file submissions, Getting Started etc.
        </Container>
        </>
    )
}

export default Help