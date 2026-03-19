// frontend/src/pages/InstructorDashboard.tsx
// This file doubles as TeacherDashboard — imported under both names in App.tsx.
// Handles role "teacher" (canonical) and "instructor" (legacy alias).
import React from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../utils/authUtils";
import SubjectInstructorDashboard from "./SubjectInstructorDashboard";
import ClassInstructorDashboard from "./ClassInstructorDashboard";

const TeacherDashboard: React.FC = () => {
  const userData = getUserData();
  const navigate = useNavigate();

  const role = userData?.role ?? "";
  const teacherType = userData?.teacher_type ?? userData?.instructor_type ?? "";
  const isTeacher = role === "teacher" || role === "instructor";

  // Super admin / admin preview chooser
  if (role === "super_admin" || role === "admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
          <div className="text-4xl mb-4">👨‍🏫</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Teacher Dashboard Preview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Choose which teacher view to preview:
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/subject-teacher-dashboard")}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              📚 Subject Teacher View
            </button>
            <button
              onClick={() => navigate("/class-teacher-dashboard")}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors"
            >
              🏫 Class Teacher View
            </button>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
            >
              ← Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData || !isTeacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">
          Unauthorized access. Teacher credentials required.
        </p>
      </div>
    );
  }

  // Route by teacher_type (with instructor_type fallback)
  if (teacherType === "subject") return <SubjectInstructorDashboard />;
  if (teacherType === "class") return <ClassInstructorDashboard />;

  // Fallback: teacher with no type set
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-4xl mb-4">👨‍🏫</p>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Teacher Dashboard
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your teacher type has not been set yet. Please contact an
          administrator.
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboard;
