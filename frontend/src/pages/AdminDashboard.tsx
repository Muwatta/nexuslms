
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
  totalClasses: number;
  avgStudentsPerCourse: number;
  avgAssignmentsPerCourse: number;
  studentInstructorRatio: string;
  totalDebtors: number;
  totalNonDebtors: number;
  departmentCounts: {
    western: number;
    arabic: number;
    programming: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalAssignments: 0,
    completionRate: 0,
    totalClasses: 0,
    avgStudentsPerCourse: 0,
    avgAssignmentsPerCourse: 0,
    studentInstructorRatio: "0:0",
    totalDebtors: 0,
    totalNonDebtors: 0,
    departmentCounts: {
      western: 0,
      arabic: 0,
      programming: 0,
    },
  });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "courses" | "management"
  >("overview");
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

      // Department counts
      // department counts with explicit type to satisfy TS
      type Department = "western" | "arabic" | "programming";
      const deptCounts: Record<Department, number> = {
        western: 0,
        arabic: 0,
        programming: 0,
      };
      allProfiles.forEach((p) => {
        const dept = p.department as Department;
        if (dept && deptCounts[dept] !== undefined) {
          deptCounts[dept] += 1;
        }
      });

      // Simple completion rate: enrollments / (students * courses) if > 0
      const maxEnrollments = students.length * allCourses.length || 1;
      const completionRate =
        maxEnrollments > 0
          ? Math.round((enrollments.length / maxEnrollments) * 100)
          : 0;

      // Averages and ratios
      const avgStudentsPerCourse =
        allCourses.length > 0
          ? Math.round(students.length / allCourses.length)
          : 0;
      const avgAssignmentsPerCourse =
        allCourses.length > 0
          ? Math.round(assignments.length / allCourses.length)
          : 0;
      const studentInstructorRatio =
        instructors.length > 0
          ? `${students.length}:${instructors.length}`
          : `${students.length}:0`;
      const totalClasses = new Set(
        students.map((s) => s.student_class).filter(Boolean),
      ).size;

      // Debtors calculation
      const debtorSet = new Set<number>();
      const paymentsRes = await api.get("/payments/");
      const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      payments
        .filter((p: any) => p.status !== "successful")
        .forEach((p: any) => {
          if (p.student && p.student.id) {
            debtorSet.add(p.student.id);
          }
        });
      const totalDebtors = debtorSet.size;
      const totalNonDebtors = students.length - totalDebtors;

      setStats({
        totalStudents: students.length,
        totalInstructors: instructors.length,
        totalCourses: allCourses.length,
        totalEnrollments: enrollments.length,
        totalAssignments: assignments.length,
        completionRate,
        totalClasses,
        avgStudentsPerCourse,
        avgAssignmentsPerCourse,
        studentInstructorRatio,
        totalDebtors,
        totalNonDebtors,
        departmentCounts: deptCounts,
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
            {/* School Dashboard Access */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🏫 School Dashboards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Western School",
                    route: "/western-dashboard",
                    icon: "🏛️",
                    color: "blue",
                    description: "Western Education System",
                    stats: stats.departmentCounts.western,
                  },
                  {
                    name: "Arabic School",
                    route: "/arabic-dashboard",
                    icon: "🕌",
                    color: "green",
                    description: "Arabic Language & Culture",
                    stats: stats.departmentCounts.arabic,
                  },
                  {
                    name: "Digital School",
                    route: "/digital-dashboard",
                    icon: "💻",
                    color: "purple",
                    description: "Programming & Technology",
                    stats: stats.departmentCounts.programming,
                  },
                ].map((school) => (
                  <motion.div
                    key={school.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-${school.color}-50 dark:bg-${school.color}-900/20 border border-${school.color}-200 dark:border-${school.color}-800 rounded-lg p-6 cursor-pointer`}
                    onClick={() => (window.location.href = school.route)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-4xl`}>{school.icon}</div>
                      <div
                        className={`text-2xl font-bold text-${school.color}-600 dark:text-${school.color}-400`}
                      >
                        {school.stats}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {school.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {school.description}
                    </p>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${school.color}-100 dark:bg-${school.color}-900 text-${school.color}-800 dark:text-${school.color}-200`}
                    >
                      Access Dashboard →
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick action links */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: "👥 Manage Users", to: "/manage-users" },
                { label: "📚 All Courses", to: "/courses" },
                { label: "📝 Assignments", to: "/assignments" },
                { label: "📊 Analytics", to: "/analytics" },
                { label: "🎓 Admission", to: "/admission" },
                { label: "👤 Visitors", to: "/visitors" },
                { label: "👨‍🏫 Class Instructors", to: "/class-instructors" },
                { label: "👔 HRs", to: "/hrs" },
                { label: "📈 All Results", to: "/all-results" },
                { label: "🏫 Classes", to: "/classes" },
                { label: "💰 Finance", to: "/finance" },
                { label: "👷 Non-Academic Staff", to: "/non-academic-staff" },
                { label: "👨‍👩‍👧 Parents", to: "/parents" },
                { label: "🎓 Students", to: "/students" },
                { label: "📖 Subjects", to: "/subjects" },
              ].map((link) => (
                <motion.a
                  key={link.to}
                  href={link.to}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="block text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
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
                className="bg-teal-100 dark:bg-teal-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Classes
                </div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-300">
                  {stats.totalClasses}
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

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-teal-100 dark:bg-teal-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Avg Students / Course
                </div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-300">
                  {stats.avgStudentsPerCourse}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-pink-100 dark:bg-pink-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Avg Assignments / Course
                </div>
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-300">
                  {stats.avgAssignmentsPerCourse}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Student:Instructor Ratio
                </div>
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {stats.studentInstructorRatio}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-red-100 dark:bg-red-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Debtors
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-300">
                  {stats.totalDebtors}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-green-100 dark:bg-green-900 p-4 rounded-lg"
              >
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Non-Debtors
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {stats.totalNonDebtors}
                </div>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b dark:border-gray-700">
              {["overview", "users", "courses", "management"].map((tab) => (
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
                  {tab === "management" && "Management"}
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

            {/* Management Tab */}
            {activeTab === "management" && (
              <div className="space-y-6">
                {/* Academic Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    🎓 Academic Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        title: "Admission",
                        description: "Manage student admissions",
                        icon: "🎓",
                        color: "blue",
                      },
                      {
                        title: "Students",
                        description: "View and manage all students",
                        icon: "👨‍🎓",
                        color: "green",
                      },
                      {
                        title: "Class Instructors",
                        description: "Manage class instructors",
                        icon: "👨‍🏫",
                        color: "purple",
                      },
                      {
                        title: "Subjects",
                        description: "Manage course subjects",
                        icon: "📖",
                        color: "teal",
                      },
                      {
                        title: "Classes",
                        description: "Manage class structures",
                        icon: "🏫",
                        color: "orange",
                      },
                      {
                        title: "All Results",
                        description: "View all student results",
                        icon: "📈",
                        color: "red",
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.title}
                        whileHover={{ scale: 1.05 }}
                        className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 border border-${item.color}-200 dark:border-${item.color}-800 p-4 rounded-lg cursor-pointer`}
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Administrative Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    🏢 Administrative Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        title: "HRs",
                        description: "Human Resources management",
                        icon: "👔",
                        color: "indigo",
                      },
                      {
                        title: "Non-Academic Staff",
                        description: "Manage support staff",
                        icon: "👷",
                        color: "gray",
                      },
                      {
                        title: "Parents",
                        description: "Parent account management",
                        icon: "👨‍👩‍👧",
                        color: "pink",
                      },
                      {
                        title: "Visitors",
                        description: "Track school visitors",
                        icon: "👤",
                        color: "yellow",
                      },
                      {
                        title: "Finance",
                        description: "Financial management",
                        icon: "💰",
                        color: "emerald",
                      },
                      {
                        title: "Assignments",
                        description: "Manage assignments",
                        icon: "📝",
                        color: "cyan",
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.title}
                        whileHover={{ scale: 1.05 }}
                        className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 border border-${item.color}-200 dark:border-${item.color}-800 p-4 rounded-lg cursor-pointer`}
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
