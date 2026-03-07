import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { getUserData } from "../utils/authUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SystemStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  totalAssignments: number;
  enrollmentRate: number;
  totalClasses: number;
  avgStudentsPerCourse: number;
  avgAssignmentsPerCourse: number;
  studentInstructorRatio: string;
  totalDebtors: number;
  totalNonDebtors: number;
  departmentCounts: { western: number; arabic: number; programming: number };
}

interface ApiProfile {
  id: number;
  role: string;
  department?: string;
  student_class?: string;
  student_id?: string;
  is_archived?: boolean;
  created_at?: string;
  // nested user object — now correctly returned by updated ProfileSerializer
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Course {
  id: number;
  title: string;
  description?: string;
  department?: string;
  created_at: string;
}

type TabId = "overview" | "users" | "courses" | "management";

// ─── Static colour maps (no dynamic Tailwind — purge-safe) ────────────────────
// Dynamic classes like `bg-${color}-50` are stripped by Tailwind's purge pass.
// All colours must be written as full static strings.
const DEPT_STYLES = {
  western: {
    card: "bg-blue-50   dark:bg-blue-900/20   border-blue-200   dark:border-blue-800",
    badge:
      "bg-blue-100   dark:bg-blue-900   text-blue-800   dark:text-blue-200",
    num: "text-blue-600   dark:text-blue-400",
  },
  arabic: {
    card: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    badge:
      "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
    num: "text-emerald-600 dark:text-emerald-400",
  },
  programming: {
    card: "bg-violet-50  dark:bg-violet-900/20  border-violet-200  dark:border-violet-800",
    badge:
      "bg-violet-100  dark:bg-violet-900  text-violet-800  dark:text-violet-200",
    num: "text-violet-600  dark:text-violet-400",
  },
} as const;

const ROLE_BADGE: Record<string, string> = {
  super_admin:
    "bg-red-100    dark:bg-red-900/40    text-red-800    dark:text-red-200",
  admin:
    "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200",
  school_admin:
    "bg-amber-100  dark:bg-amber-900/40  text-amber-800  dark:text-amber-200",
  instructor:
    "bg-blue-100   dark:bg-blue-900/40   text-blue-800   dark:text-blue-200",
  teacher:
    "bg-sky-100    dark:bg-sky-900/40    text-sky-800    dark:text-sky-200",
  student:
    "bg-green-100  dark:bg-green-900/40  text-green-800  dark:text-green-200",
  parent:
    "bg-pink-100   dark:bg-pink-900/40   text-pink-800   dark:text-pink-200",
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  bg: string;
  text: string;
}> = ({ label, value, icon, bg, text }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bg} rounded-xl p-4 flex flex-col gap-1`}
  >
    <span className="text-xl">{icon}</span>
    <span className={`text-2xl sm:text-3xl font-bold ${text}`}>{value}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
      {label}
    </span>
  </motion.div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData = getUserData();
  const isSuperAdmin = userData?.role === "super_admin";

  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalAssignments: 0,
    enrollmentRate: 0,
    totalClasses: 0,
    avgStudentsPerCourse: 0,
    avgAssignmentsPerCourse: 0,
    studentInstructorRatio: "0:0",
    totalDebtors: 0,
    totalNonDebtors: 0,
    departmentCounts: { western: 0, arabic: 0, programming: 0 },
  });
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, courseRes, enrollRes, assignRes, payRes] =
        await Promise.allSettled([
          api.get("/profiles/"),
          api.get("/courses/"),
          api.get("/enrollments/"),
          api.get("/assignments/"),
          api.get("/payments/"),
        ]);

      // ── Profiles ────────────────────────────────────────────────────────
      // ProfileSerializer now returns nested user object with first_name/last_name
      const rawProfiles: ApiProfile[] =
        profileRes.status === "fulfilled"
          ? Array.isArray(profileRes.value.data)
            ? profileRes.value.data
            : (profileRes.value.data?.results ?? [])
          : [];
      setProfiles(rawProfiles);

      const allCourses: Course[] =
        courseRes.status === "fulfilled"
          ? Array.isArray(courseRes.value.data)
            ? courseRes.value.data
            : (courseRes.value.data?.results ?? [])
          : [];
      setCourses(allCourses);

      const enrollments =
        enrollRes.status === "fulfilled"
          ? Array.isArray(enrollRes.value.data)
            ? enrollRes.value.data
            : (enrollRes.value.data?.results ?? [])
          : [];

      const assignments =
        assignRes.status === "fulfilled"
          ? Array.isArray(assignRes.value.data)
            ? assignRes.value.data
            : (assignRes.value.data?.results ?? [])
          : [];

      const payments =
        payRes.status === "fulfilled"
          ? Array.isArray(payRes.value.data)
            ? payRes.value.data
            : (payRes.value.data?.results ?? [])
          : [];

      // ── Compute stats ───────────────────────────────────────────────────
      const students = rawProfiles.filter((p) => p.role === "student");
      const instructors = rawProfiles.filter((p) =>
        ["instructor", "teacher"].includes(p.role),
      );

      type Dept = "western" | "arabic" | "programming";
      const deptCounts = { western: 0, arabic: 0, programming: 0 };
      rawProfiles.forEach((p) => {
        if (p.department && p.department in deptCounts)
          deptCounts[p.department as Dept]++;
      });

      const debtorIds = new Set<number>();
      payments
        .filter((p: any) => p.status !== "successful")
        .forEach((p: any) => {
          if (p.student?.id) debtorIds.add(p.student.id);
        });

      const totalClasses = new Set(
        students.map((s) => s.student_class).filter(Boolean),
      ).size;

      setStats({
        totalStudents: students.length,
        totalInstructors: instructors.length,
        totalCourses: allCourses.length,
        totalEnrollments: enrollments.length,
        totalAssignments: assignments.length,
        enrollmentRate: allCourses.length
          ? Math.round(
              (enrollments.length /
                (students.length * allCourses.length || 1)) *
                100,
            )
          : 0,
        totalClasses,
        avgStudentsPerCourse: allCourses.length
          ? Math.round(students.length / allCourses.length)
          : 0,
        avgAssignmentsPerCourse: allCourses.length
          ? Math.round(assignments.length / allCourses.length)
          : 0,
        studentInstructorRatio: `${students.length}:${instructors.length || 1}`,
        totalDebtors: debtorIds.size,
        totalNonDebtors: Math.max(0, students.length - debtorIds.size),
        departmentCounts: deptCounts,
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered user list ─────────────────────────────────────────────────────
  const filteredProfiles = profiles.filter((p) => {
    const matchRole = filterRole === "all" || p.role === filterRole;
    const matchDept = filterDept === "all" || p.department === filterDept;
    const q = userSearch.toLowerCase();
    const matchSearch =
      !q ||
      p.user?.username?.toLowerCase().includes(q) ||
      p.user?.first_name?.toLowerCase().includes(q) ||
      p.user?.last_name?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q);
    return matchRole && matchDept && matchSearch;
  });

  // ── School dashboards config ───────────────────────────────────────────────
  const schools = [
    {
      name: "Western School",
      route: "/western-dashboard",
      icon: "🏛️",
      desc: "Western Education System",
      count: stats.departmentCounts.western,
      styles: DEPT_STYLES.western,
    },
    {
      name: "Arabic School",
      route: "/arabic-dashboard",
      icon: "🕌",
      desc: "Arabic Language & Culture",
      count: stats.departmentCounts.arabic,
      styles: DEPT_STYLES.arabic,
    },
    {
      name: "Digital School",
      route: "/digital-dashboard",
      icon: "💻",
      desc: "Programming & Technology",
      count: stats.departmentCounts.programming,
      styles: DEPT_STYLES.programming,
    },
  ];

  // ── Quick links ────────────────────────────────────────────────────────────
  const quickLinks = [
    { label: "Manage Users", icon: "👥", to: "/manage-users" },
    { label: "All Courses", icon: "📚", to: "/courses" },
    { label: "Assignments", icon: "📝", to: "/assignments" },
    { label: "Analytics", icon: "📊", to: "/analytics" },
    { label: "Payments", icon: "💳", to: "/payments" },
    { label: "Enrollments", icon: "🎓", to: "/enrollments" },
    { label: "Quizzes", icon: "🧠", to: "/quizzes" },
    { label: "Achievements", icon: "🏆", to: "/achievements" },
    { label: "Milestones", icon: "🚀", to: "/milestones" },
    { label: "AI Help", icon: "🤖", to: "/ai" },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-teal-500 border-t-transparent
            rounded-full animate-spin mx-auto mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen"
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              ⚙️ {isSuperAdmin ? "Super Admin" : "Admin"} Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {isSuperAdmin
                ? "Full system control — all departments, users and data"
                : "School-wide overview and management tools"}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg text-sm text-gray-600 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── Error banner ──────────────────────────────────────────────── */}
        {error && (
          <div
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200
            dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SCHOOL DASHBOARDS
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
            🏫 School Dashboards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {schools.map((school) => (
              <motion.div
                key={school.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(school.route)}
                className={`border rounded-xl p-5 cursor-pointer transition-shadow
                  hover:shadow-md ${school.styles.card}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{school.icon}</span>
                  <span className={`text-2xl font-bold ${school.styles.num}`}>
                    {school.count}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {school.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {school.desc}
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full
                  text-xs font-medium ${school.styles.badge}`}
                >
                  Open Dashboard →
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            STATS GRID
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
            📊 System Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label="Students"
              value={stats.totalStudents}
              icon="👨‍🎓"
              bg="bg-blue-50   dark:bg-blue-900/20"
              text="text-blue-600   dark:text-blue-400"
            />
            <StatCard
              label="Instructors"
              value={stats.totalInstructors}
              icon="👨‍🏫"
              bg="bg-emerald-50 dark:bg-emerald-900/20"
              text="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Courses"
              value={stats.totalCourses}
              icon="📚"
              bg="bg-violet-50  dark:bg-violet-900/20"
              text="text-violet-600  dark:text-violet-400"
            />
            <StatCard
              label="Classes"
              value={stats.totalClasses}
              icon="🏫"
              bg="bg-teal-50   dark:bg-teal-900/20"
              text="text-teal-600   dark:text-teal-400"
            />
            <StatCard
              label="Enrollments"
              value={stats.totalEnrollments}
              icon="🎓"
              bg="bg-amber-50  dark:bg-amber-900/20"
              text="text-amber-600  dark:text-amber-400"
            />
            <StatCard
              label="Assignments"
              value={stats.totalAssignments}
              icon="📝"
              bg="bg-rose-50   dark:bg-rose-900/20"
              text="text-rose-600   dark:text-rose-400"
            />
            <StatCard
              label="Enrollment Rate"
              value={`${stats.enrollmentRate}%`}
              icon="📈"
              bg="bg-indigo-50 dark:bg-indigo-900/20"
              text="text-indigo-600 dark:text-indigo-400"
            />
            <StatCard
              label="Avg Students/Course"
              value={stats.avgStudentsPerCourse}
              icon="÷"
              bg="bg-cyan-50   dark:bg-cyan-900/20"
              text="text-cyan-600   dark:text-cyan-400"
            />
            <StatCard
              label="Avg Tasks/Course"
              value={stats.avgAssignmentsPerCourse}
              icon="✏️"
              bg="bg-pink-50   dark:bg-pink-900/20"
              text="text-pink-600   dark:text-pink-400"
            />
            <StatCard
              label="Student:Instructor"
              value={stats.studentInstructorRatio}
              icon="⚖️"
              bg="bg-gray-100  dark:bg-gray-800"
              text="text-gray-700   dark:text-gray-300"
            />
            <StatCard
              label="Debtors"
              value={stats.totalDebtors}
              icon="⚠️"
              bg="bg-red-50    dark:bg-red-900/20"
              text="text-red-600    dark:text-red-400"
            />
            <StatCard
              label="Fee-Cleared"
              value={stats.totalNonDebtors}
              icon="✅"
              bg="bg-green-50  dark:bg-green-900/20"
              text="text-green-600  dark:text-green-400"
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            QUICK LINKS
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
            ⚡ Quick Access
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
            {quickLinks.map((link) => (
              <motion.button
                key={link.to}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(link.to)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl
                  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                  hover:border-teal-400 dark:hover:border-teal-500
                  hover:shadow-md transition-all text-center"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                  {link.label}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TABS
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          {/* Scrollable tab bar */}
          <div
            className="flex gap-1 overflow-x-auto pb-px mb-5 border-b
            dark:border-gray-700 scrollbar-none"
          >
            {(["overview", "users", "courses", "management"] as TabId[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg
                  capitalize transition-colors
                  ${
                    activeTab === tab
                      ? "border-b-2 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {tab === "overview" && "📊 Overview"}
                  {tab === "users" && `👥 Users (${profiles.length})`}
                  {tab === "courses" && `📚 Courses (${courses.length})`}
                  {tab === "management" && "⚙️ Management"}
                </button>
              ),
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* ── OVERVIEW ─────────────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key metrics */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                      📐 Key Metrics
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Avg students per course",
                          value: stats.avgStudentsPerCourse,
                        },
                        {
                          label: "Avg assignments per course",
                          value: stats.avgAssignmentsPerCourse,
                        },
                        {
                          label: "Student : Instructor ratio",
                          value: stats.studentInstructorRatio,
                        },
                        { label: "Total classes", value: stats.totalClasses },
                        { label: "Fee debtors", value: stats.totalDebtors },
                        {
                          label: "Fee-cleared students",
                          value: stats.totalNonDebtors,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex justify-between items-center py-2
                            border-b dark:border-gray-700 last:border-0"
                        >
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                      🏫 Department Breakdown
                    </h3>
                    {(["western", "arabic", "programming"] as const).map(
                      (dept) => {
                        const total =
                          profiles.filter((p) => p.department === dept)
                            .length || 0;
                        const pct = profiles.length
                          ? Math.round((total / profiles.length) * 100)
                          : 0;
                        const styles = DEPT_STYLES[dept];
                        return (
                          <div key={dept} className="mb-4 last:mb-0">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                {dept} School
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {total} users ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${styles.num.replace("text-", "bg-").split(" ")[0]}`}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}

                    {/* Role summary */}
                    <div className="mt-6 pt-4 border-t dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                        By Role
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          profiles.reduce(
                            (acc, p) => {
                              acc[p.role] = (acc[p.role] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>,
                          ),
                        ).map(([role, count]) => (
                          <span
                            key={role}
                            className={`px-2 py-1 rounded-full text-xs font-medium
                              ${ROLE_BADGE[role] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {role}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ────────────────────────────────────────────────── */}
              {activeTab === "users" && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  {/* Filters */}
                  <div
                    className="p-4 border-b dark:border-gray-700 flex flex-col
                    sm:flex-row gap-3"
                  >
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, username or email…"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300
                        dark:border-gray-600 rounded-lg dark:bg-gray-700
                        dark:text-white focus:outline-none focus:ring-2
                        focus:ring-teal-500 placeholder:text-gray-400"
                    />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                        rounded-lg bg-white dark:bg-gray-700 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="instructor">Instructors</option>
                      <option value="teacher">Teachers</option>
                      <option value="admin">Admins</option>
                      <option value="school_admin">School Admins</option>
                      <option value="parent">Parents</option>
                    </select>
                    <select
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                        rounded-lg bg-white dark:bg-gray-700 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Depts</option>
                      <option value="western">Western</option>
                      <option value="arabic">Arabic</option>
                      <option value="programming">Programming</option>
                    </select>
                  </div>

                  <p
                    className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500
                    bg-gray-50 dark:bg-gray-700/50"
                  >
                    Showing {filteredProfiles.length} of {profiles.length} users
                  </p>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                        <tr>
                          {[
                            "Name",
                            "Username",
                            "Email",
                            "Role",
                            "Dept",
                            "Class",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left font-semibold
                              text-gray-600 dark:text-gray-300"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredProfiles.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {/* Full name — from nested user.first_name + user.last_name */}
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                              {p.user?.first_name || p.user?.last_name ? (
                                `${p.user.first_name} ${p.user.last_name}`.trim()
                              ) : (
                                <span className="italic text-gray-400">
                                  No name
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              @{p.user?.username}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                              {p.user?.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium
                                ${ROLE_BADGE[p.role] ?? "bg-gray-100 text-gray-700"}`}
                              >
                                {p.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {p.department || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {p.student_class || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y dark:divide-gray-700">
                    {filteredProfiles.map((p) => (
                      <div key={p.id} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-9 h-9 rounded-full bg-gradient-to-br
                            from-teal-500 to-indigo-600 flex items-center justify-center
                            text-white font-bold text-sm shrink-0"
                          >
                            {(
                              p.user?.first_name?.[0] ??
                              p.user?.username?.[0] ??
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="font-medium text-sm text-gray-900
                              dark:text-white truncate"
                            >
                              {p.user?.first_name || p.user?.last_name
                                ? `${p.user.first_name} ${p.user.last_name}`.trim()
                                : p.user?.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              @{p.user?.username}
                            </p>
                          </div>
                          <span
                            className={`ml-auto shrink-0 px-2 py-0.5 rounded-full
                            text-xs font-medium ${ROLE_BADGE[p.role] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {p.role.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 pl-12">
                          {p.department && (
                            <span className="capitalize">{p.department}</span>
                          )}
                          {p.student_class && <span>{p.student_class}</span>}
                          {p.user?.email && (
                            <span className="truncate">{p.user.email}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProfiles.length === 0 && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                      No users match your filters
                    </div>
                  )}
                </div>
              )}

            
              {activeTab === "courses" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.length === 0 && (
                    <p className="col-span-full text-center py-12 text-gray-400 text-sm">
                      No courses found
                    </p>
                  )}
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -2 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5
                        border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug flex-1 pr-2">
                          {course.title}
                        </h3>
                        {course.department && (
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                            ${
                              DEPT_STYLES[
                                course.department as keyof typeof DEPT_STYLES
                              ]?.badge ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {course.department}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {course.description || "No description"}
                      </p>
                      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>ID: {course.id}</span>
                        <span>
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "management" && (
                <div className="space-y-6">
                  {[
                    {
                      title: "🎓 Academic Management",
                      items: [
                        { label: "Courses", icon: "📚", to: "/courses" },
                        {
                          label: "Assignments",
                          icon: "📝",
                          to: "/assignments",
                        },
                        { label: "Quizzes", icon: "🧠", to: "/quizzes" },
                        {
                          label: "Enrollments",
                          icon: "🎓",
                          to: "/enrollments",
                        },
                        {
                          label: "Achievements",
                          icon: "🏆",
                          to: "/achievements",
                        },
                        { label: "Milestones", icon: "🚀", to: "/milestones" },
                      ],
                    },
                    {
                      title: "👥 People Management",
                      items: [
                        { label: "All Users", icon: "👥", to: "/manage-users" },
                        {
                          label: "Student Dashboard",
                          icon: "👨‍🎓",
                          to: "/student-dashboard",
                        },
                        {
                          label: "Parent Portal",
                          icon: "👨‍👩‍👧",
                          to: "/parent-portal",
                        },
                        { label: "Profile", icon: "👤", to: "/profile" },
                      ],
                    },
                    {
                      title: "📈 Reports & Data",
                      items: [
                        { label: "Analytics", icon: "📊", to: "/analytics" },
                        { label: "Payments", icon: "💳", to: "/payments" },
                        { label: "Projects", icon: "🗂️", to: "/projects" },
                        { label: "AI Help", icon: "🤖", to: "/ai" },
                      ],
                    },
                  ].map((section) => (
                    <div
                      key={section.title}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6"
                    >
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {section.items.map((item) => (
                          <motion.button
                            key={item.to}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(item.to)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl
                              bg-gray-50 dark:bg-gray-700/50
                              hover:bg-teal-50 dark:hover:bg-teal-900/20
                              border border-transparent hover:border-teal-200
                              dark:hover:border-teal-700
                              transition-all text-center"
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span
                              className="text-xs font-medium text-gray-700
                              dark:text-gray-300 leading-tight"
                            >
                              {item.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
