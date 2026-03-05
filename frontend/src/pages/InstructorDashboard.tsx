import React from "react";
import { getUserData } from "../utils/authUtils";
import SubjectInstructorDashboard from "./SubjectInstructorDashboard";
import ClassInstructorDashboard from "./ClassInstructorDashboard";

const InstructorDashboard: React.FC = () => {
  const userData = getUserData();

  if (!userData || userData.role !== "instructor") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">
          Unauthorized access. Instructor credentials required.
        </p>
      </div>
    );
  }

  // Route based on instructor type
  if (userData.instructor_type === "subject") {
    return <SubjectInstructorDashboard />;
  } else if (userData.instructor_type === "class") {
    return <ClassInstructorDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-red-600">Instructor type not specified.</p>
    </div>
  );
};

export default InstructorDashboard;
