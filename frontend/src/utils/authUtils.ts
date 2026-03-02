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
}

/**
 * Fetch user profile after successful login
 */
export const fetchUserProfile = async (): Promise<UserData | null> => {
  try {
    const response = await api.get("/profiles/");
    if (response.data && response.data.length > 0) {
      const profile = response.data[0];
      return {
        id: profile.id,
        username: profile.user_details?.username || "",
        email: profile.user_details?.email || "",
        role: profile.role,
        department: profile.department,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

/**
 * Get the appropriate dashboard route based on user role
 */
export const getDashboardRouteByRole = (role: string): string => {
  const adminRoles = ["admin", "school_admin", "super_admin"];
  const parentRole = "parent";
  const studentRoles = ["student", "teacher", "instructor"];

  if (adminRoles.includes(role)) {
    return "/admin";
  }
  if (role === parentRole) {
    return "/parent-portal";
  }
  if (studentRoles.includes(role)) {
    return "/dashboard";
  }

  // Default to dashboard
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
    const route = getDashboardRouteByRole(userProfile.role);
    return route;
  }

  return "/dashboard";
};
