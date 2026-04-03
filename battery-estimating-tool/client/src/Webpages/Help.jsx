import React from "react";
import { Container } from "react-bootstrap";
import HelpSection from "../Components/HelpSection/HelpSection";
import { Outlet } from "react-router-dom";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
const Help = () => {
  const sections = [
    {
      title: "Submitting a Model",
      links: [
        { label: "Submission Process", href: "/help/submission-process" },
        { label: "Valid Files", href: "/help/valid-files" },
        { label: "Code Ownership", href: "/help/code-ownership" },
        {label: "Public Submission vs Private Submission", href: "/help/public-private-submission"},
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Account Verification", href: "/help/account-verification" },
        { label: "Forgot Password", href: "/help/forgot-password" },
      ],
    },
    // {
    //   title: "Leaderboard",
    //   links: [
    //     { label: "Condensed vs Detailed Views", href: "/help/leaderboard-views" },
    //     { label: "Exporting CSV", href: "/help/export-csv" },
    //   ],
    // },
    // {
    //   title: "Viewing Submissions",
    //   links: [
    //     { label: "Submission Statuses", href: "/help/submission-statuses" },
    //     { label: "Visibility", href: "/help/visibility" },
    //   ],
    // },
  ];

  return (
    <>
    <StyledNavbar />
    <Container className="py-3">
      <h2 className="mb-4">Help Center</h2>

      {sections.map((section, index) => (
        <HelpSection key={index} title={section.title} links={section.links} />
      ))}
    <Outlet />
    </Container>
    </>
  );
};

export default Help;