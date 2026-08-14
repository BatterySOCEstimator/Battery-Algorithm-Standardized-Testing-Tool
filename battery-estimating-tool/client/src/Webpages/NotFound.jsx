// Catch-all page for any route that doesn't match — see AppRouter's "*" route.
import { Card } from "#Components/ui/card";
import { Button } from "#Components/ui/button";
import { IconError404 } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import StyledNavbar from "../Components/Navbar/StyledNavbar";

const NotFound = ({ user }) => {
  return (
    <>
      <StyledNavbar user={user} />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-sm p-8 text-center">
          <IconError404 className="mx-auto mb-4 size-14 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">Page not found</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or may have moved.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/">
              <Button size="lg" className="w-full">
                Back to Home
              </Button>
            </Link>
            <Link
              to="/leaderboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View Leaderboard
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
};

export default NotFound;
