import React, { useEffect, useState } from "react";
import api from "../api";
import WesternDashboard from "./WesternDashboard";
import ArabicDashboard from "./ArabicDashboard";
import ProgrammingDashboard from "./ProgrammingDashboard";

const Dashboard: React.FC = () => {
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile to get department
    api
      .get("/profiles/")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDepartment(res.data[0].department || "western");
        } else {
          setDepartment("western");
        }
      })
      .catch(() => {
        setDepartment("western");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // Route to department-specific dashboard
  switch (department) {
    case "arabic":
      return <ArabicDashboard />;
    case "programming":
      return <ProgrammingDashboard />;
    case "western":
    default:
      return <WesternDashboard />;
  }
};

export default Dashboard;
