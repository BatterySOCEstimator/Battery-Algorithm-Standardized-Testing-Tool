import React from "react";
import { Card } from "react-bootstrap";

const HelpSection = ({ title, links }) => {
  return (
    // Card component for each help section
    <Card className="mb-4 shadow-sm"> 
      <Card.Body>
        <h4 className="mb-3">{title}</h4>

        <div className="d-flex flex-column gap-2">
          {links.map((link, index) => ( // Render each link in the section
            <h6 key={index} className="mb-0">
              <a
                href={link.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {link.label}
              </a>
            </h6>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default HelpSection;