// Bootstrap UI and router imports for the error page
import { Container, Card, Button } from "react-bootstrap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaExclamationCircle } from "react-icons/fa";

// Login error page displayed after authentication failures
const LoginError = () => {
  
  // Read navigation state to retrieve the error message from the previous route
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message ?? "Something went wrong. Please try again.";

  return (
    // Full-screen centered container for the error card
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
    >
      {/* Centered card displaying the error message */}
      <Card
        className="shadow-sm border-0 rounded-4 p-5 text-center"
        style={{ maxWidth: "480px", width: "100%" }}
      >
        {/* Error icon */}
        <div className="mb-4">
          <FaExclamationCircle size={56} className="text-danger" />
        </div>
        <h3 className="fw-bold mb-2">Login Failed</h3>
        <p className="text-muted mb-4">{message}</p>

        {/* Action buttons: retry login or register */}
        <div className="d-grid gap-2">
          <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
            Try Again
          </Button>
          <Link to="/registration" className="text-muted text-decoration-none">
            <small>Don't have an account? Create one</small>
          </Link>
        </div>
      </Card>
    </Container>
  );
};

export default LoginError;