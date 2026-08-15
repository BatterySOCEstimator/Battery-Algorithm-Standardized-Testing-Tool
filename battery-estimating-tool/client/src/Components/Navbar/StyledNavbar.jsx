import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { IconMenu2, IconX, IconChevronDown } from "@tabler/icons-react";

import { logout } from "../../auth-client.ts";
import { Button, buttonVariants } from "#Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#Components/ui/dropdown-menu";
import NotificationBell from "./NotificationBell";
import { cn } from "#Constants/cn";

// Admin-only nav entries — a dropdown rather than a single link since more
// admin pages are expected later.
const ADMIN_LINKS = [{ to: "/admin/users", label: "Users" }];

const NAV_LINKS = [
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/model-comparison", label: "Model Comparison" },
  { to: "/submit-model", label: "Submit Model" },
  { to: "/submissions", label: "View Submissions" },
  { to: "/help", label: "Help" },
];

const StyledNavbar = ({ user }) => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="dark border-b border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="shrink-0 text-xl font-semibold text-foreground! no-underline!">
          BatterySOCBenchmark
        </a>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
          aria-controls="basic-navbar-nav"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <IconX className="size-6" /> : <IconMenu2 className="size-6" />}
        </button>

        <div
          id="basic-navbar-nav"
          className={cn(
            "w-full flex-col gap-4 lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:gap-6",
            open ? "flex" : "hidden",
            "lg:flex"
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "text-base font-medium text-foreground/70! no-underline! hover:text-foreground!",
                    isActive && "text-primary! hover:text-primary!"
                  )
                }
              >
                {label}
              </NavLink>
            ))}

            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 text-base font-medium text-foreground/70! hover:text-foreground!">
                  Admin
                  <IconChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {ADMIN_LINKS.map(({ to, label }) => (
                    <DropdownMenuItem key={to} render={<Link to={to} />}>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell user={user} />
              <span className="text-base font-medium">{user.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/registration"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "text-primary-foreground! no-underline!"
                )}
              >
                Register
              </a>
              <a
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-foreground! no-underline!"
                )}
              >
                Login
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default StyledNavbar;
