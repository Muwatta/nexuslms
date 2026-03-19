// frontend/src/components/ProfileDropdown.tsx
//
// Changes from previous version:
//  1. No more API call — reads from getUserData() (localStorage) only.
//     Navbar already fetches /profiles/me/ and writes to localStorage,
//     so this component just consumes that data. Zero duplicate requests.
//  2. Dead routes /settings and /help replaced with working routes:
//     /profile and /ai (Help → AI Help which exists in App.tsx)
//  3. Role display now handles all roles including school_admin / parent
//  4. Permissions-aware admin link: shows "Admin Panel" only if user
//     has admin.access permission

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData, clearUserData, hasPermission } from "../utils/authUtils";

interface ProfileDropdownProps {
  onProfileClick?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  super_admin: "Super Admin",
  school_admin: "School Admin",
  instructor: "Instructor",
  teacher: "Instructor",
  student: "Student",
  parent: "Parent",
};

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onProfileClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Read from localStorage — no API call needed here ────────────────────
  // Navbar fetches /profiles/me/ once per session and writes to localStorage.
  // Re-read on every open so we always show the latest data.
  const userData = getUserData();

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearUserData();
    sessionStorage.removeItem("navbar_profile_fetched"); // allow re-fetch on next login
    navigate("/login");
  };

  // ── Derived display values ────────────────────────────────────────────────
  const firstName = userData?.firstName || userData?.first_name || "";
  const lastName = userData?.lastName || userData?.last_name || "";
  const username = userData?.username || "";
  const role = userData?.role || "";
  const department = userData?.department;

  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : username
          ? username[0].toUpperCase()
          : "U";

  const displayName = firstName
    ? [firstName, lastName].filter(Boolean).join(" ")
    : username || "User";

  const roleLabel = ROLE_LABELS[role] ?? "User";

  // Show "Admin Panel" link only for roles with admin.access permission
  const showAdminLink = hasPermission("admin.access");

  if (!userData) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
        title="Profile Menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        {firstName && (
          <span className="hidden sm:block font-medium">{firstName}</span>
        )}
        <span className="text-xs opacity-70">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* User info header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-sm text-teal-600 dark:text-teal-400">
                  {roleLabel}
                </p>
                {department && (
                  <p className="text-xs text-gray-400 capitalize">
                    {department.replace("_", " ")} dept.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="py-2">
            <DropdownItem
              icon="👤"
              label="My Profile"
              onClick={() => {
                setIsOpen(false);
                onProfileClick?.();
                navigate("/profile");
              }}
            />
            <DropdownItem
              icon="🤖"
              label="AI Help"
              onClick={() => {
                setIsOpen(false);
                navigate("/ai");
              }}
            />
            {showAdminLink && (
              <DropdownItem
                icon="⚙️"
                label="Admin Dashboard"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin-dashboard");
                }}
              />
            )}
            {hasPermission("user.create") && (
              <DropdownItem
                icon="👥"
                label="Manage Users"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/manage-users");
                }}
              />
            )}
          </div>

          {/* Logout */}
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

// ── Small helper so each menu item isn't repeated ─────────────────────────────
const DropdownItem: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

export default ProfileDropdown;
