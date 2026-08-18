import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { IconChevronDown } from "@tabler/icons-react";

import { logout } from "../../auth-client.ts";
import { Button, buttonVariants } from "#Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#Components/ui/dropdown-menu";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "#Components/ui/collapsible";
import NotificationBell from "./NotificationBell";
import useNotifications from "#Hooks/useNotifications";
import { cn } from "#Constants/cn";

// Admin-only nav entries
const ADMIN_LINKS = [{ to: "/admin/users", label: "Users" }];

const NAV_LINKS = [
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/model-comparison", label: "Model Comparison" },
  { to: "/submit-model", label: "Submit Model" },
  { to: "/submissions", label: "View Submissions" },
  { to: "/help", label: "Help" },
];

// Toggle button  animation
const HamburgerIcon = ({ open }) => (
  <span className="relative flex size-6 flex-col items-center justify-center">
    <span
      className={cn(
        "absolute h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ease-in-out",
        open ? "translate-y-0 rotate-45" : "-translate-y-2"
      )}
    />
    <span
      className={cn(
        "absolute h-0.5 w-6 rounded-full bg-current transition-opacity duration-200 ease-in-out",
        open ? "opacity-0" : "opacity-100"
      )}
    />
    <span
      className={cn(
        "absolute h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ease-in-out",
        open ? "translate-y-0 -rotate-45" : "translate-y-2"
      )}
    />
  </span>
);

const NavLinks = ({ className }) => (
  <div className={className}>
    {NAV_LINKS.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          cn(
            "text-base font-medium whitespace-nowrap text-foreground/70! no-underline! hover:text-foreground!",
            isActive && "text-primary! hover:text-primary!"
          )
        }
      >
        {label}
      </NavLink>
    ))}
  </div>
);

// Chevron shared by both Admin triggers below — points right while closed
// and rotates down to point straight down once open. `group-data-*` reads
// the open state off the trigger button itself (that's where Base UI sets
// the attribute), not off the icon, so the trigger needs `group` applied.
// Color is set explicitly (not inherited via currentColor) so it stays
// neutral even when the trigger text itself turns green for an active route.
const AdminChevron = ({ openAttribute }) => (
  <IconChevronDown
    className={cn(
      "h-4 w-4 shrink-0 translate-y-[-0.5px] -rotate-90 text-foreground/70! transition-transform duration-300 ease-in-out",
      openAttribute === "popup" && "group-data-popup-open:rotate-0",
      openAttribute === "panel" && "group-data-panel-open:rotate-0"
    )}
  />
);

// Same active/inactive colors NavLink applies to the top-level nav items,
// reused here since these sub-links use a plain Link (a NavLink here would
// need a function `className`, which Base UI's `render` prop can't merge
// with its own item styling).
const adminLinkClassName = (isActive, base) =>
  cn(base, "no-underline!", isActive ? "text-primary! hover:text-primary!" : "text-foreground/70! hover:text-foreground!");

// Floating dropdown for larger screens — Base UI already animates its own
// open/close, and there's room next to the trigger for it to float in.
const AdminDesktopMenu = ({ pathname, active }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      className={cn(
        "group inline-flex items-center gap-1 text-base font-medium hover:text-foreground!",
        active ? "text-primary! hover:text-primary!" : "text-foreground/70!"
      )}
    >
      Admin
      <AdminChevron openAttribute="popup" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      // This popup is portaled to document.body, outside the navbar's own
      // `dark`-scoped subtree — without re-applying `dark` here, `bg-background`
      // would resolve to the page's (light) theme instead of the navbar's.
      className="dark w-auto min-w-32 border border-border bg-background p-2 shadow-none ring-0"
    >
      {ADMIN_LINKS.map(({ to, label }) => (
        <DropdownMenuItem
          key={to}
          className="rounded-none px-1 py-1 focus:bg-transparent"
          render={<Link to={to} className={adminLinkClassName(pathname === to, "text-sm")} />}
        >
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// Inline accordion for the stacked mobile menu 
// Controlled locally (rather than letting Collapsible manage its own state) so the `open` boolean can be handed straight to CollapsiblePanel
// Also closes itself whenever surrounding mobile menu closes
const AdminMobileAccordion = ({ pathname, active, navOpen }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) setOpen(false);
  }, [navOpen]);

  return (
    // gap (not the panel's own padding-top) provides the space between the
    // trigger and its links, and only while open — a grid item's padding
    // creates a hard floor on how far its row can shrink (same issue fixed
    // on the outer navbar row), so a `pt-3` directly on the panel stalled
    // its close animation a few pixels short instead of reaching a true 0.
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("flex flex-col transition-[gap] duration-300 ease-in-out", open ? "gap-3" : "gap-0")}
    >
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center gap-1 text-base font-medium hover:text-foreground!",
          active ? "text-primary! hover:text-primary!" : "text-foreground/70!"
        )}
      >
        Admin
        <AdminChevron openAttribute="panel" />
      </CollapsibleTrigger>
      <CollapsiblePanel open={open} className="flex flex-col gap-3 pl-3">
        {ADMIN_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className={adminLinkClassName(pathname === to, "text-sm")}>
            {label}
          </Link>
        ))}
      </CollapsiblePanel>
    </Collapsible>
  );
};

const UserActions = ({ user, notifications, clearNotification, clearAllNotifications }) =>
  user ? (
    <div className="flex items-center gap-2">
      <NotificationBell
        user={user}
        notifications={notifications}
        clear={clearNotification}
        clearAll={clearAllNotifications}
      />
      <span className="text-base font-medium">{user.name}</span>
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <a
        href="/registration"
        className={cn(buttonVariants({ variant: "default" }), "text-primary-foreground! no-underline!")}
      >
        Register
      </a>
      <a
        href="/login"
        className={cn(buttonVariants({ variant: "outline" }), "text-foreground! no-underline!")}
      >
        Login
      </a>
    </div>
  );

const StyledNavbar = ({ user }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isAdminSectionActive = pathname.startsWith("/admin");

  // Called once per navbar, shared by both UserActions renders below (the
  // always-mounted desktop copy and the mobile CollapsiblePanel copy, which
  // stays mounted via `keepMounted` even while closed) — each opens a real
  // SSE connection, so two independent hook instances meant every
  // notification's toast/chime fired twice.
  const { notifications, clear: clearNotification, clearAll: clearAllNotifications } =
    useNotifications(user);

  return (
    <nav className="dark border-b border-border bg-background text-foreground">
      {/* Below xl: gap is 0 while the mobile panel is closed and 1rem while
          open, animated in lockstep with the panel's own transition — a
          flat gap-4 here would apply between wrapped lines even when the
          panel collapses to 0 height, leaving extra space below the title/
          hamburger row even while fully closed. (A padding-based approach
          on the panel itself doesn't work either — grid's stretch/align
          keeps a padding-sized floor no matter how the row track is sized,
          so it never actually reaches a true 0.)
          At xl+ that mobile `open` state is meaningless (the hamburger
          never shows), so xl:gap-6 forces a real gap between the title and
          the desktop nav regardless of it — without this override the base
          gap-0 (whenever the panel happens to be in its closed state) wins
          and the title ends up hugging the first nav link. */}
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-3 transition-[gap] duration-300 ease-in-out xl:gap-6!",
          open ? "gap-4" : "gap-0"
        )}
      >
        <a href="/" className="shrink-0 text-xl font-semibold text-foreground! no-underline!">
          BatterySOCBenchmark
        </a>

        {/* Desktop nav — a plain always-rendered row, entirely independent
            of the mobile Collapsible below, so it's never affected by the
            mobile panel's animated height. Switches in at xl (1280px), not
            lg (1024px) — measured the actual content wrapping mid-word in
            the 1024-1150px range at lg, which is exactly the awkward
            in-between state this is meant to avoid; xl has real room to
            spare. */}
        <div className="hidden xl:flex xl:flex-1 xl:items-center xl:justify-between xl:gap-6">
          <div className="flex items-center gap-6">
            <NavLinks className="flex items-center gap-6" />
            {user?.role === "admin" && (
              <AdminDesktopMenu pathname={pathname} active={isAdminSectionActive} />
            )}
          </div>
          <UserActions
            user={user}
            notifications={notifications}
            clearNotification={clearNotification}
            clearAllNotifications={clearAllNotifications}
          />
        </div>

        {/* Mobile: hamburger trigger + animated collapsible panel, hidden
            entirely at the xl breakpoint (the block above takes over).
            display:contents on the root keeps it a pure state wrapper, so
            the trigger and panel stay direct flex items of the row above —
            the panel being w-full is what forces it onto its own line when
            open, same trick the old hidden/flex toggle relied on. */}
        <Collapsible open={open} onOpenChange={setOpen} className="contents xl:hidden">
          <CollapsibleTrigger
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            <HamburgerIcon open={open} />
          </CollapsibleTrigger>

          <CollapsiblePanel open={open} className="flex w-full flex-col gap-4">
            <NavLinks className="flex flex-col gap-3" />
            {user?.role === "admin" && (
              <AdminMobileAccordion pathname={pathname} active={isAdminSectionActive} navOpen={open} />
            )}
            <UserActions
              user={user}
              notifications={notifications}
              clearNotification={clearNotification}
              clearAllNotifications={clearAllNotifications}
            />
          </CollapsiblePanel>
        </Collapsible>
      </div>
    </nav>
  );
};

export default StyledNavbar;
