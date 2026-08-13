// UI and router imports for the error page
import { Card } from "#Components/ui/card";
import { Button } from "#Components/ui/button";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { IconExclamationCircle } from "@tabler/icons-react";
import StyledNavbar from "../Components/Navbar/StyledNavbar";

// Login error page displayed after authentication failures
const LoginError = () => {
  // Read navigation state to retrieve the error message from the previous route
  const location = useLocation();
  const navigate = useNavigate();
  const message =
    location.state?.message ?? "Something went wrong. Please try again.";

  return (
    // Full-screen centered container for the error card
    <>
      <StyledNavbar />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-sm p-8 text-center">
          {/* Error icon */}
          <IconExclamationCircle className="mx-auto mb-4 size-14 text-destructive" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">Login Failed</h3>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>

          {/* Action buttons: retry login or register */}
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => navigate("/login")}>
              Try Again
            </Button>
            <Link
              to="/registration"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Don't have an account? Create one
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
};

export default LoginError;
