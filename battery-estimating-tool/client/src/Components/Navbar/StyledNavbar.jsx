import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/esm/Button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserInfo, logout } from '../../auth-client.ts';

const StyledNavbar = () => {

  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserInfo().then(setUser);
  }, []);

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
          {user ? (
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <div
                className="btn btn-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: "36px", height: "36px", fontSize: "14px", fontWeight: "600", flexShrink: 0 }}
              >
                {user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <span className="text-white fw-medium">{user.name}</span>
              <Button variant="outline-light" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <>
              <Button href="/registration" variant="outline-success">Register</Button>
              <Button style={{ marginLeft: "8px" }} href="/login" variant="light">Login</Button>
            </>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default StyledNavbar;