/**
 * Utility functions for authentication and role-based routing
 */

import api from "../api";

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  department?: string;
  instructor_type?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Fetch user profile after successful login
 */
export const fetchUserProfile = async (): Promise<UserData | null> => {
  try {
    const response = await api.get("/profiles/");
    if (response.data && response.data.length > 0) {
      const profile = response.data[0];
      // `depth=1` ensures user is nested, otherwise this may just be an ID
      const userObj = profile.user || profile.user_details || {};
      return {
        id: profile.id,
        username: userObj.username || "",
        email: userObj.email || "",
        role: profile.role,
        department: profile.department,
        instructor_type: profile.instructor_type || undefined,
        firstName: userObj.first_name || userObj.firstName || "",
        lastName: userObj.last_name || userObj.lastName || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

/**
 * Get the appropriate dashboard route based on user role and department
 */
export const getDashboardRouteByRole = (
  role: string,
  department?: string,
  instructorType?: string,
): string => {
  const adminRoles = ["admin", "school_admin", "super_admin"];

  // Admins get access to all dashboards - route to admin overview or default school
  if (adminRoles.includes(role)) {
    return "/admin-dashboard"; // Main admin dashboard
  }

  // Instructors route based on instructor type
  if (role === "instructor") {
    if (instructorType === "subject") {
      return "/subject-instructor-dashboard";
    } else if (instructorType === "class") {
      return "/class-instructor-dashboard";
    } else {
      return "/instructor-dashboard"; // Generic instructor dashboard that checks type
    }
  }

  // Students route based on department
  if (role === "student") {
    if (department === "arabic") {
      return "/arabic-dashboard";
    } else if (department === "programming") {
      return "/digital-dashboard"; // Changed from programming to digital
    } else {
      return "/western-dashboard";
    }
  }

  // Parents get parent portal
  if (role === "parent") {
    return "/parent-portal";
  }

  // Default fallback
  return "/dashboard";
};

/**
 * Store user data in localStorage
 */
export const storeUserData = (userData: UserData): void => {
  localStorage.setItem("user", JSON.stringify(userData));
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

/**
 * Clear user data from localStorage (logout)
 */
export const clearUserData = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

/**
 * Complete login flow: store tokens, fetch profile, redirect to appropriate dashboard
 */
export const handleLoginSuccess = async (
  accessToken: string,
  refreshToken: string,
): Promise<string> => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);

  const userProfile = await fetchUserProfile();
  if (userProfile) {
    storeUserData(userProfile);
    const route = getDashboardRouteByRole(
      userProfile.role,
      userProfile.department,
    );
    return route;
  }

  return "/dashboard";
};
