import React from "react";
import { Navigate } from "react-router-dom";
import { getUserData } from "../utils/authUtils";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const token = localStorage.getItem("access_token");
  const userData = getUserData();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role restrictions
  if (allowedRoles && userData?.role) {
    // Check if user's role is allowed
    const hasPermission =
      allowedRoles.includes(userData.role) ||
      // Admins can access everything
      ["admin", "school_admin", "super_admin"].includes(userData.role);

    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};
export default ProtectedRoute;
