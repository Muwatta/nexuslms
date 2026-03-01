import React from "react";
import { Link } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

const links = [
  { to: "/dashboard", label: "🏠 Dashboard" },
  { to: "/courses", label: "📚 Courses" },
  { to: "/enrollments", label: "✏️ My Classes" },
  { to: "/assignments", label: "📝 Assignments" },
  { to: "/quizzes", label: "❓ Quizzes" },
  { to: "/analytics", label: "📊 Analytics" },
  { to: "/achievements", label: "🏆 Achievements" },
  { to: "/projects", label: "📋 Projects" },
  { to: "/milestones", label: "🏁 Milestones" },
  { to: "/ai", label: "🤖 AI Help" },
  { to: "/practice", label: "🧠 Practice" },
  { to: "/manage-users", label: "👥 Manage Users" },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <>
      {/* overlay on small screens when sidebar open */}
      {open && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      {/* transform to hide offscreen on mobile, always visible on md */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-40 transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <nav className="mt-16 flex flex-col space-y-1 px-4">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="block px-3 py-2 rounded-md text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
