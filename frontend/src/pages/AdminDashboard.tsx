import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface SystemStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  totalAssignments: number;
  completionRate: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalAssignments: 0,
    completionRate: 0,
  });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses">(
    "overview",
  );
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all profiles
      const profileRes = await api.get("/profiles/");
      const allProfiles = Array.isArray(profileRes.data) ? profileRes.data : [];
      setProfiles(allProfiles);

      // Fetch all courses
      const courseRes = await api.get("/courses/");
      const allCourses = Array.isArray(courseRes.data) ? courseRes.data : [];
      setCourses(allCourses);

      // Fetch enrollments for completion calculations
      const enrollRes = await api.get("/enrollments/");
      const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : [];

      // Fetch assignments for stats
      const assignRes = await api.get("/assignments/");
      const assignments = Array.isArray(assignRes.data) ? assignRes.data : [];

      // Calculate stats
      const students = allProfiles.filter((p) => p.role === "student");
      const instructors = allProfiles.filter(
        (p) => p.role === "instructor" || p.role === "teacher",
      );

      // Simple completion rate: enrollments / (students * courses) if > 0
      const maxEnrollments = students.length * allCourses.length || 1;
      const completionRate =
        maxEnrollments > 0
          ? Math.round((enrollments.length / maxEnrollments) * 100)
          : 0;

      setStats({
        totalStudents: students.length,
        totalInstructors: instructors.length,
        totalCourses: allCourses.length,
        totalEnrollments: enrollments.length,
        totalAssignments: assignments.length,
        completionRate,
      });
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles =
    filterRole === "all"
      ? profiles
      : profiles.filter((p) => p.role === filterRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-900 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            ⚙️ Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System-wide overview and management tools
          </p>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-6 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Total Students
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                  {stats.totalStudents}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-green-100 dark:bg-green-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Instructors
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {stats.totalInstructors}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Courses
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                  {stats.totalCourses}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Enrollments
                </div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                  {stats.totalEnrollments}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-red-100 dark:bg-red-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Assignments
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-300">
                  {stats.totalAssignments}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Enrollment Rate
                </div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">
                  {stats.completionRate}%
                </div>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b dark:border-gray-700">
              {["overview", "users", "courses"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "users" && "Users"}
                  {tab === "courses" && "Courses"}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    📊 Key Metrics
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">
                        Avg Students per Course
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {stats.totalCourses > 0
                          ? Math.round(
                              stats.totalEnrollments / stats.totalCourses,
                            )
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">
                        Avg Assignments per Course
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {stats.totalCourses > 0
                          ? Math.round(
                              stats.totalAssignments / stats.totalCourses,
                            )
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Student to Instructor Ratio
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {stats.totalInstructors > 0
                          ? Math.round(
                              stats.totalStudents / stats.totalInstructors,
                            )
                          : 0}
                        :1
                      </span>
                    </div>
                  </div>
                </div>

                {/* Departments */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    🏫 Departments
                  </h2>
                  <div className="space-y-3">
                    {["western", "arabic", "programming"].map((dept) => {
                      const count = profiles.filter(
                        (p) => p.department === dept,
                      ).length;
                      return (
                        <div
                          key={dept}
                          className="flex justify-between items-center pb-2 border-b dark:border-gray-700"
                        >
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {dept} School
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {count} users
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Users</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="instructor">Instructors</option>
                    <option value="admin">Admins</option>
                    <option value="parent">Parents</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">
                          Class
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProfiles.map((profile) => (
                        <tr
                          key={profile.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {profile.user.username}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium capitalize">
                              {profile.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {profile.department}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {profile.student_class || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProfiles.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                  >
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {course.description || "No description"}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Course ID:
                        </span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {course.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Created:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
