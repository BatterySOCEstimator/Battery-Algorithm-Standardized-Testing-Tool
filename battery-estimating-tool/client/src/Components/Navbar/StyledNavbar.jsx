import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/esm/Button';
import { Link } from 'react-router-dom';
const StyledNavbar = () =>{
  return (
    <Navbar bg="dark" expand="lg" data-bs-theme="dark">
      <Container>
        <Navbar.Brand href="/">SOCAlgoTestingPlatform</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            
            <Nav.Link as={Link} to="/leaderboards">Leaderboards</Nav.Link>
            <Nav.Link as={Link} to="/submit-model">Submit Model</Nav.Link>
            <Nav.Link as={Link} to="/submissions">Submissions</Nav.Link>
            <Nav.Link as={Link} to="/model-comparison">Model Comparison</Nav.Link>
            <Nav.Link as={Link} to="/help">Help</Nav.Link>

            {/* <NavDropdown title="Dropdown" id="basic-nav-dropdown">
              <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">
                Another action
              </NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">
                Separated link
              </NavDropdown.Item>
            </NavDropdown> */}
          </Nav>
          <Button href="/registration" target="_blank" rel="noopener noreferrer" variant="outline-success">Register</Button>
          <Button style={{"marginLeft": "8px"}} href="/login" target="_blank" rel="noopener noreferrer" variant="light">Login</Button>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default StyledNavbar;