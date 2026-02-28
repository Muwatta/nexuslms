import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WHATSAPP_NUMBER, formatWhatsAppLink } from "../config/contact";

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("dark_mode") === "true",
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
                <Link
                  to="/dashboard"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  🏠 Dashboard
                </Link>
                <Link
                  to="/courses"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📚 Courses
                </Link>
                <Link
                  to="/enrollments"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  ✏️ My Classes
                </Link>
                <Link
                  to="/assignments"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📝 Assignments
                </Link>
                <Link
                  to="/manage-users"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  👥 Manage Users
                </Link>
                <Link
                  to="/achievements"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  🏆 Achievements
                </Link>
                <Link
                  to="/projects"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📋 Projects
                </Link>
                <Link
                  to="/milestones"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  🏁 Milestones
                </Link>
                <Link
                  to="/analytics"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📊 Analytics
                </Link>
                <Link
                  to="/ai"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  🤖 AI Help
                </Link>
                <Link
                  to="/practice"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  🧠 Practice
                </Link>
                <Link
                  to="/about"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  ℹ️ About
                </Link>
                <Link
                  to="/programs"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📚 Programs
                </Link>
                <Link
                  to="/locations"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  📍 Locations
                </Link>
                <Link
                  to="/contact"
                  className="text-white hover:bg-teal-700 dark:hover:bg-teal-800 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  ✉️ Contact
                </Link>
                <a
                  href={formatWhatsAppLink(WHATSAPP_NUMBER)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white bg-green-500 hover:bg-green-600 px-3 py-2 rounded-md text-sm font-medium transition ml-2"
                >
                  💬 WhatsApp
                </a>
                <button
                  onClick={handleLogout}
                  className="text-white hover:bg-red-600 dark:hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition ml-2"
                >
                  🚪 Logout
                </button>
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
