import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { clearUserData, getUserData, UserData } from "../utils/authUtils";
import ProfileDropdown from "./ProfileDropdown";
import api from "../api";

// ─── Nav link config ──────────────────────────────────────────────────────────
interface NavLink {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const NAV_LINKS: NavLink[] = [
  { to: "/courses", label: "Courses", icon: "📖" },
  { to: "/assignments", label: "Assignments", icon: "📝" },
  { to: "/quizzes", label: "Quizzes", icon: "🧠" },
  { to: "/enrollments", label: "Enrollments", icon: "🎓" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/achievements", label: "Achievements", icon: "🏆" },
  { to: "/projects", label: "Projects", icon: "🗂️" },
  { to: "/milestones", label: "Milestones", icon: "🚀" },
  { to: "/ai", label: "AI Help", icon: "🤖" },
  { to: "/profile", label: "Profile", icon: "👤" },
  {
    to: "/parent-portal",
    label: "Parent Portal",
    icon: "👨‍👩‍👧",
    roles: ["parent"],
  },
  {
    to: "/manage-users",
    label: "Manage Users",
    icon: "👥",
    roles: ["admin", "super_admin"],
  },
  {
    to: "/admin-dashboard",
    label: "Admin",
    icon: "🛡️",
    roles: ["admin", "super_admin"],
  },
];

// ─── Profile shape returned by /profiles/ API ─────────────────────────────────
interface ApiProfile {
  role?: string;
  department?: string;
  student_class?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };
  user_details?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

// ─── Safe display helpers ─────────────────────────────────────────────────────
const getInitialsFromProfile = (
  profile: ApiProfile | null,
  fallback: UserData | null,
): string => {
  const first =
    profile?.user?.first_name ||
    profile?.user_details?.first_name ||
    fallback?.firstName;
  const last =
    profile?.user?.last_name ||
    profile?.user_details?.last_name ||
    fallback?.lastName;
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  const username = profile?.user?.username || fallback?.username || "U";
  return username[0].toUpperCase();
};

const getDisplayNameFromProfile = (
  profile: ApiProfile | null,
  fallback: UserData | null,
): string => {
  const first =
    profile?.user?.first_name ||
    profile?.user_details?.first_name ||
    fallback?.firstName;
  const last =
    profile?.user?.last_name ||
    profile?.user_details?.last_name ||
    fallback?.lastName;
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return profile?.user?.username || fallback?.username || "User";
};

const getRoleLabel = (role?: string): string => {
  const map: Record<string, string> = {
    admin: "Administrator",
    super_admin: "Super Admin",
    school_admin: "School Admin",
    instructor: "Instructor",
    student: "Student",
    parent: "Parent",
  };
  return role ? (map[role] ?? role) : "User";
};

// ─── Component ────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("dark_mode") === "true",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Live profile fetched from API (has snake_case first_name / last_name)
  const [apiProfile, setApiProfile] = useState<ApiProfile | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  // Stored user data from localStorage (camelCase, may lack full name on first load)
  const storedUser: UserData | null = getUserData();

  // ── Fetch live profile so name always appears ──────────────────────────────
  useEffect(() => {
    if (!token) return;
    api
      .get("/profiles/")
      .then((res) => {
        const data = res.data;
        const profile = Array.isArray(data) ? data[0] : data;
        if (profile) setApiProfile(profile);
      })
      .catch(() => {
        /* silently fall back to storedUser */
      });
  }, [token]);

  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    darkMode ? html.classList.add("dark") : html.classList.remove("dark");
    localStorage.setItem("dark_mode", String(darkMode));
  }, [darkMode]);

  // ── Close drawer on route change ───────────────────────────────────────────
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // ── Close drawer on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node))
        setDrawerOpen(false);
    };
    if (drawerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  // ── Lock body scroll while drawer is open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    clearUserData();
    window.location.href = "/login";
  };

  // Resolve role for link filtering — prefer API profile, fall back to stored
  const role = apiProfile?.role ?? storedUser?.role ?? "";
  const visibleLinks = NAV_LINKS.filter(
    ({ roles }) => !roles || (role && roles.includes(role)),
  );

  // Resolved display values
  const displayName = getDisplayNameFromProfile(apiProfile, storedUser);
  const initials = getInitialsFromProfile(apiProfile, storedUser);
  const roleLabel = getRoleLabel(apiProfile?.role ?? storedUser?.role);
  const department = apiProfile?.department ?? storedUser?.department;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          TOP NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16
        bg-gradient-to-r from-teal-500 to-indigo-600
        dark:from-teal-900 dark:to-indigo-900 shadow-lg"
      >
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={() => setDrawerOpen((prev) => !prev)}
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                aria-expanded={drawerOpen}
                className="p-2 rounded-md text-white hover:bg-white/20 active:bg-white/30
                  transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span
                    className={`block h-0.5 w-full bg-white rounded transition-all duration-300 origin-left
                    ${drawerOpen ? "rotate-45 translate-y-[7px]" : ""}`}
                  />
                  <span
                    className={`block h-0.5 w-full bg-white rounded transition-all duration-300
                    ${drawerOpen ? "opacity-0 scale-x-0" : ""}`}
                  />
                  <span
                    className={`block h-0.5 w-full bg-white rounded transition-all duration-300 origin-left
                    ${drawerOpen ? "-rotate-45 -translate-y-[9px]" : ""}`}
                  />
                </div>
              </button>
            )}

            <Link
              to="/"
              className="text-white font-bold text-lg sm:text-xl hover:text-teal-200 transition-colors whitespace-nowrap"
            >
              📚 <span className="hidden sm:inline">Muwata Academy</span>
              <span className="sm:hidden">Muwata</span>
            </Link>
          </div>

          {/* Right: profile / auth + dark mode */}
          <div className="flex items-center gap-1 sm:gap-2">
            {token ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:bg-white/20 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          BACKDROP
      ════════════════════════════════════════════════════════════════════ */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300
          ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* ════════════════════════════════════════════════════════════════════
          SLIDE-OUT DRAWER
      ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={drawerRef}
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] z-50 flex flex-col
          bg-white dark:bg-gray-900 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div
          className="h-16 shrink-0 flex items-center justify-between px-5
          bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-900 dark:to-indigo-900"
        >
          <span className="text-white font-bold text-base">
            📚 Muwata Academy
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── User info strip ──────────────────────────────────────────────
            Uses apiProfile (snake_case from API) with storedUser as fallback.
            Shows name, role, department — all sourced correctly now.
        ─────────────────────────────────────────────────────────────────── */}
        {(apiProfile || storedUser) && (
          <div
            className="shrink-0 flex items-center gap-3 px-5 py-3
            bg-teal-50 dark:bg-teal-900/30
            border-b border-teal-100 dark:border-teal-800"
          >
            {/* Avatar with initials */}
            <div
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center
              bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-bold text-sm"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {/* Full name from API first_name + last_name */}
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {displayName}
              </p>
              {/* Role label */}
              <p className="text-xs text-teal-600 dark:text-teal-400">
                {roleLabel}
              </p>
              {/* Department if present */}
              {department && (
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize truncate">
                  {department} dept.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Scrollable nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-0.5">
            {visibleLinks.map(({ to, label, icon }) => {
              const isActive =
                location.pathname === to ||
                (to.length > 1 && location.pathname.startsWith(to));
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg
                      text-sm font-medium transition-all duration-150
                      ${
                        isActive
                          ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300"
                      }`}
                  >
                    <span className="w-5 text-center text-base">{icon}</span>
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: logout */}
        <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              text-sm font-medium transition-colors
              bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
              hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
