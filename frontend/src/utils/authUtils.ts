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
    const response = await api.get("/profiles/me/");
    const profile = response.data;
    const userObj = profile.user || profile.user_details || {};

    return {
      id: profile.id,
      username: userObj.username || "",
      email: userObj.email || "",
      role: profile.role || "",
      department: profile.department || undefined,
      instructor_type: profile.instructor_type || undefined,
      // snake_case from Django API → camelCase for localStorage
      firstName: userObj.first_name || userObj.firstName || "",
      lastName: userObj.last_name || userObj.lastName || "",
    };
  } catch {
    // Fallback: try list endpoint
    try {
      const response = await api.get("/profiles/");
      const data = response.data;
      const profiles = Array.isArray(data) ? data : (data.results ?? []);
      if (profiles.length === 0) return null;

      const profile = profiles[0];
      const userObj = profile.user || profile.user_details || {};

      return {
        id: profile.id,
        username: userObj.username || "",
        email: userObj.email || "",
        role: profile.role || "",
        department: profile.department || undefined,
        instructor_type: profile.instructor_type || undefined,
        firstName: userObj.first_name || userObj.firstName || "",
        lastName: userObj.last_name || userObj.lastName || "",
      };
    } catch {
      return null;
    }
  }
};

export const getDashboardRouteByRole = (
  role: string,
  department?: string,
  instructorType?: string,
): string => {
  
  if (["admin", "super_admin"].includes(role)) return "/admin-dashboard";

  if (role === "school_admin") {
    if (department === "arabic") return "/arabic-dashboard";
    if (department === "programming") return "/digital-dashboard";
    return "/western-dashboard";
  }

  if (role === "instructor") {
    if (instructorType === "class") return "/class-instructor-dashboard";
    if (instructorType === "subject") return "/subject-instructor-dashboard";
    if (department === "arabic") return "/arabic-dashboard";
    if (department === "programming") return "/digital-dashboard";
    return "/western-dashboard";
  }


  if (role === "student" || role === "parent") return "/student-dashboard";

  return "/admin-dashboard";
};

/** Store user data in localStorage */
export const storeUserData = (userData: UserData): void => {
  localStorage.setItem("user", JSON.stringify(userData));
};

/** Get user data from localStorage */
export const getUserData = (): UserData | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
};

/** Clear all auth data (logout) */
export const clearUserData = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};


export const handleLoginSuccess = async (
  accessToken: string,
  refreshToken: string,
): Promise<string> => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);

  const userProfile = await fetchUserProfile();
  if (userProfile) {
    storeUserData(userProfile);
    return getDashboardRouteByRole(
      userProfile.role,
      userProfile.department,
      userProfile.instructor_type,
    );
  }

  return "/admin-dashboard"; // Fallback route if profile fetch fails, never "/dashboard"
};
