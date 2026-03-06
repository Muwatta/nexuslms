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

export const fetchUserProfile = async (): Promise<UserData | null> => {
  try {
    const response = await api.get("/profiles/");
    if (response.data && response.data.length > 0) {
      const profile = response.data[0];
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


export const getDashboardRouteByRole = (
  role: string,
  department?: string,
  instructorType?: string,
): string => {
  // Admins go to main admin dashboard
  if (["admin", "super_admin"].includes(role)) {
    return "/admin-dashboard";
  }

  // School admins go to their department dashboard
  if (role === "school_admin") {
    if (department === "arabic") return "/arabic-dashboard";
    if (department === "programming") return "/digital-dashboard";
    return "/western-dashboard"; // default
  }

  // Instructors go to their department dashboard
  if (role === "instructor") {
    if (department === "arabic") return "/arabic-dashboard";
    if (department === "programming") return "/digital-dashboard";
    return "/western-dashboard";
  }

  // Students and parents get unified personal dashboard
  if (role === "student" || role === "parent") {
    return "/student-dashboard";
  }

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
