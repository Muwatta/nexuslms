import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData, clearUserData } from "../utils/authUtils";
import api from "../api";

interface ProfileDropdownProps {
  onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onProfileClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userData = getUserData();

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profiles/");
        if (response.data && response.data.length > 0) {
          setProfile(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    if (userData) {
      fetchProfile();
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const getInitials = (
    firstName?: string,
    lastName?: string,
    username?: string,
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (profile?.user?.first_name) {
      return profile.user.first_name;
    }
    if (userData?.firstName) {
      return userData.firstName;
    }
    return userData?.username || "User";
  };

  const getRoleDisplay = () => {
    const role = profile?.role;
    switch (role) {
      case "admin":
        return "Administrator";
      case "instructor":
      case "teacher":
        return "Instructor";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  if (!userData) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-full transition-colors"
        title="Profile Menu"
      >
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-medium">
          {getInitials(
            profile?.user?.first_name,
            profile?.user?.last_name,
            userData?.username,
          )}
        </div>
        {/* show first name on larger screens */}
        {userData?.firstName && (
          <span className="hidden sm:block font-medium">
            {userData.firstName}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getInitials(
                  profile?.user?.first_name,
                  profile?.user?.last_name,
                  userData?.username,
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getDisplayName()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getRoleDisplay()}
                </p>
                {profile?.department && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 capitalize">
                    {profile.department} Department
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onProfileClick?.();
                navigate("/profile");
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>👤</span>
              <span>View Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/help");
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>❓</span>
              <span>Help & Support</span>
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 py-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
