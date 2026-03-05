import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WHATSAPP_NUMBER, formatWhatsAppLink } from "../config/contact";
import { clearUserData } from "../utils/authUtils";
import ProfileDropdown from "./ProfileDropdown";

interface NavbarProps {
  toggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("dark_mode") === "true",
  );

  const handleLogout = () => {
    clearUserData();
    window.location.href = "/login";
  };
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      localStorage.setItem("dark_mode", "true");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("dark_mode", "false");
    }
  }, [darkMode]);

  return (
    <nav className="bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-900 dark:to-indigo-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-white font-bold text-2xl hover:text-teal-200 transition"
          >
            📚 Muwata Academy
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {token ? (
              <>
                {/* hamburger for sidebar */}
                <button
                  onClick={() => toggleSidebar && toggleSidebar()}
                  className="text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-800 transition"
                >
                  ☰
                </button>
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="ml-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:shadow transition"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
