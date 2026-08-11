// React hooks
import { useState, useEffect } from "react";
// Router components for defining app routes
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Top-level pages / components used by routes
import Heropage from "./App";
import Help from "./Webpages/Help";
import Leaderboard from "./Webpages/Leaderboard.jsx";
import Registration from "./Webpages/Registration";
import Submissions from "./Webpages/Submissions";
import SubmitModel from "./Webpages/SubmitModel";
import Login from "./Webpages/Login";
import ModelComparison from "./Webpages/ModelComparison";
import LoginError from "./Webpages/LoginError";

// Utility functions and constants
import { data } from "./Helperfunc.js";
import HelpTopic from "./Webpages/HelpTopic";
import { getUserInfo } from "./auth-client.ts";
import useRequireAuth from "./Hooks/useRequireAuth";

// Convert raw API row objects into a presentation-friendly format
// - Uses `columns` to determine display order and labels
// - Maps raw keys from `columnKeyMap` to readable values
// - Normalizes booleans and date fields for UI consumption
const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    columns.forEach((col) => {
      const key = columnKeyMap[col];
      let value = row[key];

      // Present privacy as human readable text
      if (key === "isPrivate") {
        value = value ? "Private" : "Public";
      }

      // Format timestamps to locale strings
      if (key === "createdAt" || key === "updatedAt") {
        value = new Date(value).toLocaleString();
      }

      // Use a dash for missing values
      obj[col] = value ?? "-";
    });

    return obj;
  });
};
const AppRouter = () => {
  // Lifted state shared across route components
  const [user, setUser] = useState(null); // current logged-in user info
  const [uniqueUsernames, setUniqueUsernames] = useState([]); // for filters
  const [uniqueUniversities, setUniqueUniversities] = useState([]); // for filters
  const [originalData, setOriginalData] = useState([]); // raw formatted rows
  const [formattedData, setFormattedData] = useState([]); // filtered data display
  const [loading, setLoading] = useState(true); // data loading flag
  const [error, setError] = useState(null); // load error message
  // Helpers to extract unique usernames for filter values and unique universities for filter values
  const getUniqueUsernames = (data) => {
    return [...new Set(data.map((item) => item.userName))];
  };
  const getUniqueUniversities = (data) => {
    return [...new Set(data.map((item) => item.academicAffiliation))];
  };

  useEffect(() => {
    // Fetch model join data on mount and initialize filter lists
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/data/fetchUserModelJoin");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();

        // Filter out private models for public listing
        const filtered = data.data.filter(model => model.isPrivate == false);

        // Format rows for display and populate state
        const formatted = formatData(filtered);
        setOriginalData(formatted);
        setFormattedData(formatted);

        // Extract unique values used by filter controls
        setUniqueUsernames(getUniqueUsernames(data.data));
        setUniqueUniversities(getUniqueUniversities(data.data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    getUserInfo().then(setUser);
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Heropage user={user} />} />
        <Route path="/help" element={<Help user={user} />}>
          <Route path=":topic" element={<HelpTopic />} />
        </Route>
        <Route
          path="/leaderboard"
          element={
            <Leaderboard
              user={user}
              uniqueUsernames={uniqueUsernames}
              uniqueUniversities={uniqueUniversities}
              originalData={originalData}
              formattedData={formattedData}
              loading={loading}
              error={error}
              setFormattedData={setFormattedData}
            />
          }
        />
        <Route path="/registration" element={<Registration />} />
        <Route path="/submissions" element={<Submissions user={user} />} />
        <Route path="/submit-model" element={<SubmitModel user={user} />} />
        <Route
          path="/model-comparison"
          element={<ModelComparison user={user} />}
        />
        <Route
          path="/login"
          element={<Login user={user} setUser={setUser} />}
        />
        <Route path="/login-error" element={<LoginError />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
