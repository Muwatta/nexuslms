// frontend/src/pages/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { getUserData } from "../utils/authUtils";
import { SkeletonDashboard } from "../components/Skeleton";

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
type TabId = "overview" | "users" | "courses" | "results" | "management";

const DEPT_STYLES = {
  western: {
    card: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700",
    badge: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    bar: "#38bdf8",
    num: "text-sky-600 dark:text-sky-400",
  },
  arabic: {
    card: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    bar: "#34d399",
    num: "text-emerald-600 dark:text-emerald-400",
  },
  programming: {
    card: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700",
    badge:
      "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    bar: "#a78bfa",
    num: "text-violet-600 dark:text-violet-400",
  },
} as const;

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#ef4444",
  admin: "#f97316",
  school_admin: "#f59e0b",
  instructor: "#3b82f6",
  teacher: "#0ea5e9",
  student: "#10b981",
  parent: "#ec4899",
};

const Avatar: React.FC<{ name: string; size?: string }> = ({
  name,
  size = "w-8 h-8 text-xs",
}) => (
  <div
    className={`${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
    style={{ background: "linear-gradient(135deg,#14b8a6,#6366f1)" }}
  >
    {(name?.[0] ?? "?").toUpperCase()}
  </div>
);

const Pill: React.FC<{ role: string }> = ({ role }) => {
  const c = ROLE_COLOR[role] ?? "#6b7280";
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c + "18", color: c, border: `1px solid ${c}30` }}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
};

const StatTile: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    className="rounded-2xl p-4 cursor-default border"
    style={{ background: color + "10", borderColor: color + "25" }}
  >
    <div className="text-xl mb-2">{icon}</div>
    <div className="text-2xl font-black" style={{ color }}>
      {value}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-tight">
      {label}
    </div>
  </motion.div>
);

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
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Publish Results tab state ────────────────────────────────────────────
  const [pubClass, setPubClass] = useState("");
  const [pubTerm, setPubTerm] = useState("First Term");
  const [pubYear, setPubYear] = useState(() => {
    const n = new Date();
    return n.getMonth() >= 8
      ? `${n.getFullYear()}/${n.getFullYear() + 1}`
      : `${n.getFullYear() - 1}/${n.getFullYear()}`;
  });
  const [pubResults, setPubResults] = useState<any[]>([]);
  const [pubLoading, setPubLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubLoaded, setPubLoaded] = useState(false);

  const CLASS_OPTIONS = [
    "jss1a",
    "jss1b",
    "jss1c",
    "jss2a",
    "jss2b",
    "jss2c",
    "jss3a",
    "jss3b",
    "jss3c",
    "sss1_sci",
    "sss1_arts",
    "sss1_com",
    "sss2_sci",
    "sss2_arts",
    "sss2_com",
    "sss3_sci",
    "sss3_arts",
    "sss3_com",
    "ibtidaai_1",
    "ibtidaai_2",
    "ibtidaai_3",
    "ibtidaai_4",
    "ibtidaai_5",
    "ibtidaai_6",
    "mutawassit_1",
    "mutawassit_2",
    "mutawassit_3",
    "thanawi_1",
    "thanawi_2",
    "thanawi_3",
  ];
  const CLASS_LABELS: Record<string, string> = {
    jss1a: "JSS 1A",
    jss1b: "JSS 1B",
    jss1c: "JSS 1C",
    jss2a: "JSS 2A",
    jss2b: "JSS 2B",
    jss2c: "JSS 2C",
    jss3a: "JSS 3A",
    jss3b: "JSS 3B",
    jss3c: "JSS 3C",
    sss1_sci: "SSS 1 Science",
    sss1_arts: "SSS 1 Arts",
    sss1_com: "SSS 1 Commercial",
    sss2_sci: "SSS 2 Science",
    sss2_arts: "SSS 2 Arts",
    sss2_com: "SSS 2 Commercial",
    sss3_sci: "SSS 3 Science",
    sss3_arts: "SSS 3 Arts",
    sss3_com: "SSS 3 Commercial",
    ibtidaai_1: "الصف الأول",
    ibtidaai_2: "الصف الثاني",
    ibtidaai_3: "الصف الثالث",
    ibtidaai_4: "الصف الرابع",
    ibtidaai_5: "الصف الخامس",
    ibtidaai_6: "الصف السادس",
    mutawassit_1: "المتوسط ١",
    mutawassit_2: "المتوسط ٢",
    mutawassit_3: "المتوسط ٣",
    thanawi_1: "الثانوي ١",
    thanawi_2: "الثانوي ٢",
    thanawi_3: "الثانوي ٣",
  };
  const PUB_TERMS = ["First Term", "Second Term", "Third Term"];
  const PUB_YEARS = Array.from({ length: 8 }, (_, i) => {
    const y = new Date().getFullYear() + 2 - i;
    return `${y}/${y + 1}`;
  });

  const loadPubResults = async () => {
    if (!pubClass || !pubTerm || !pubYear) return;
    setPubLoading(true);
    setPubLoaded(false);
    setPubResults([]);
    try {
      const r = await api.get("/results/", {
        params: {
          student_class: pubClass,
          term: pubTerm,
          academic_year: pubYear,
          page_size: 500,
        },
      });
      const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
      setPubResults(list);
      setPubLoaded(true);
    } catch {
      setError("Failed to load results");
    } finally {
      setPubLoading(false);
    }
  };

  const publishAll = async () => {
    const toPublish = pubResults.filter(
      (r: any) => r.status === "reviewed" || r.status === "submitted",
    );
    if (toPublish.length === 0) {
      setError("No reviewed/submitted results to publish");
      return;
    }
    setPublishing(true);
    try {
      await Promise.allSettled(
        toPublish.map((r: any) => api.post(`/results/${r.id}/publish/`)),
      );
      // Also generate report cards
      await api
        .post("/report-cards/generate/", {
          student_class: pubClass,
          term: pubTerm,
          academic_year: pubYear,
        })
        .catch(() => {}); // non-fatal
      loadPubResults();
    } catch {
      setError("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const extract = (res: PromiseSettledResult<any>) =>
    res.status === "fulfilled"
      ? (res.value.data?.results ?? res.value.data ?? [])
      : [];

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const P = { params: { page_size: "200" } };
      const [profileRes, courseRes, enrollRes, assignRes, payRes] =
        await Promise.allSettled([
          api.get("/admin/users/", P),
          api.get("/courses/", P),
          api.get("/enrollments/", P),
          api.get("/assignments/", P),
          api.get("/payments/", P),
        ]);

      const rawProfiles: ApiProfile[] = extract(profileRes);
      const allCourses: Course[] = extract(courseRes);
      const enrollments = extract(enrollRes);
      const assignments = extract(assignRes);
      const payments = extract(payRes);

      setProfiles(rawProfiles);
      setCourses(allCourses);

      const students = rawProfiles.filter((p) => p.role === "student");
      const instructors = rawProfiles.filter((p) =>
        ["instructor", "teacher"].includes(p.role),
      );
      type D = "western" | "arabic" | "programming";
      const dc = { western: 0, arabic: 0, programming: 0 };
      rawProfiles.forEach((p) => {
        if (p.department && p.department in dc) dc[p.department as D]++;
      });

      const debtors = new Set<number>();
      payments
        .filter((p: any) => p.status !== "successful")
        .forEach((p: any) => {
          if (p.student?.id) debtors.add(p.student.id);
        });
      const classes = new Set(
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
        totalClasses: classes,
        avgStudentsPerCourse: allCourses.length
          ? Math.round(students.length / allCourses.length)
          : 0,
        avgAssignmentsPerCourse: allCourses.length
          ? Math.round(assignments.length / allCourses.length)
          : 0,
        studentInstructorRatio: `${students.length}:${instructors.length || 1}`,
        totalDebtors: debtors.size,
        totalNonDebtors: Math.max(0, students.length - debtors.size),
        departmentCounts: dc,
      });
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = profiles.filter((p) => {
    if (filterRole !== "all" && p.role !== filterRole) return false;
    if (filterDept !== "all" && p.department !== filterDept) return false;
    const q = userSearch.toLowerCase();
    return (
      !q ||
      [
        p.user?.username,
        p.user?.first_name,
        p.user?.last_name,
        p.user?.email,
      ].some((f) => f?.toLowerCase().includes(q))
    );
  });

  // ── SKELETON while loading ────────────────────────────────────────────────
  if (loading) return <SkeletonDashboard statCount={6} showChart showTable />;

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

  const STAT_TILES = [
    {
      label: "Students",
      value: stats.totalStudents,
      icon: "👨‍🎓",
      color: "#3b82f6",
    },
    {
      label: "Instructors",
      value: stats.totalInstructors,
      icon: "👨‍🏫",
      color: "#10b981",
    },
    {
      label: "Courses",
      value: stats.totalCourses,
      icon: "📚",
      color: "#8b5cf6",
    },
    {
      label: "Classes",
      value: stats.totalClasses,
      icon: "🏫",
      color: "#14b8a6",
    },
    {
      label: "Enrollments",
      value: stats.totalEnrollments,
      icon: "🎓",
      color: "#f59e0b",
    },
    {
      label: "Assignments",
      value: stats.totalAssignments,
      icon: "📝",
      color: "#f43f5e",
    },
    {
      label: "Enrollment Rate",
      value: `${stats.enrollmentRate}%`,
      icon: "📈",
      color: "#6366f1",
    },
    {
      label: "Avg Students/Course",
      value: stats.avgStudentsPerCourse,
      icon: "÷",
      color: "#06b6d4",
    },
    {
      label: "Avg Tasks/Course",
      value: stats.avgAssignmentsPerCourse,
      icon: "✏️",
      color: "#ec4899",
    },
    {
      label: "Student:Instructor",
      value: stats.studentInstructorRatio,
      icon: "⚖️",
      color: "#64748b",
    },
    {
      label: "Debtors",
      value: stats.totalDebtors,
      icon: "⚠️",
      color: "#ef4444",
    },
    {
      label: "Fee-Cleared",
      value: stats.totalNonDebtors,
      icon: "✅",
      color: "#22c55e",
    },
  ];

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "📊 Overview" },
    { id: "users", label: `👥 Users (${profiles.length})` },
    { id: "courses", label: `📚 Courses (${courses.length})` },
    { id: "results", label: "📝 Publish Results" },
    { id: "management", label: "⚙️ Management" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-4 sm:px-8 py-8"
        style={{
          background:
            "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#14b8a6 1px,transparent 1px),linear-gradient(90deg,#14b8a6 1px,transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div
          className="absolute -top-20 right-0 w-96 h-96 rounded-full blur-[140px] opacity-10"
          style={{ background: "#14b8a6" }}
        />

        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              ⚙️ {isSuperAdmin ? "Super Admin" : "Admin"} Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              {isSuperAdmin
                ? "Full system control — all departments, users and data"
                : "School-wide overview and management"}
            </p>
            {lastUpdated && (
              <p className="text-slate-600 text-xs mt-1 flex items-center gap-1.5">
                {refreshing ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse inline-block" />
                ) : (
                  "🕐"
                )}
                Updated {lastUpdated.toLocaleTimeString()}
                {" · "}
                <span className="text-teal-500 font-semibold">
                  {profiles.length} users loaded
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <button
                onClick={() => navigate("/super-admin-portal")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-teal-500/25"
                style={{
                  background: "linear-gradient(135deg,#14b8a6,#6366f1)",
                }}
              >
                🔑 Super Admin Portal
              </button>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 bg-white/10 hover:bg-white/20 border border-white/15 text-white"
            >
              {refreshing ? "⏳" : "🔄"} Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 rounded-2xl text-sm flex items-center justify-between font-medium"
              style={{
                background: "#ef444415",
                border: "1px solid #ef444430",
                color: "#ef4444",
              }}
            >
              ⚠️ {error}
              <button
                onClick={() => setError(null)}
                className="opacity-60 hover:opacity-100 text-lg leading-none"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schools */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            🏫 School Dashboards
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {schools.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(s.route)}
                className={`border rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all ${s.styles.card}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{s.icon}</span>
                  <span className={`text-2xl font-black ${s.styles.num}`}>
                    {s.count}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {s.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {s.desc}
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.styles.badge}`}
                >
                  Open Dashboard →
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            📊 System Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAT_TILES.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <StatTile {...t} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            ⚡ Quick Access
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {quickLinks.map((link, i) => (
              <motion.button
                key={link.to}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(link.to)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-teal-400 hover:shadow-md hover:shadow-teal-500/10"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight text-center">
                  {link.label}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <section>
          <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-5">
                      📐 Key Metrics
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Avg students / course",
                          value: stats.avgStudentsPerCourse,
                        },
                        {
                          label: "Avg assignments / course",
                          value: stats.avgAssignmentsPerCourse,
                        },
                        {
                          label: "Student : Instructor",
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
                          className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-slate-700 last:border-0"
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

                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-5">
                      🏫 Department Breakdown
                    </h3>
                    {(["western", "arabic", "programming"] as const).map(
                      (dept) => {
                        const total = profiles.filter(
                          (p) => p.department === dept,
                        ).length;
                        const pct = profiles.length
                          ? Math.round((total / profiles.length) * 100)
                          : 0;
                        const s = DEPT_STYLES[dept];
                        return (
                          <div key={dept} className="mb-5 last:mb-0">
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                                {dept} School
                              </span>
                              <span className="text-gray-400 text-xs">
                                {total} users ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: s.bar }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        By Role
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          profiles.reduce(
                            (a, p) => ({
                              ...a,
                              [p.role]: (a[p.role] || 0) + 1,
                            }),
                            {} as Record<string, number>,
                          ),
                        ).map(([role, count]) => (
                          <span key={role}>
                            <Pill role={role} />{" "}
                            <span className="text-xs text-gray-400">
                              ×{count}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* USERS */}
              {activeTab === "users" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                        🔍
                      </span>
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search name, username or email…"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-colors"
                      />
                    </div>
                    {[
                      {
                        val: filterRole,
                        set: setFilterRole,
                        opts: [
                          ["all", "All Roles"],
                          ["student", "Students"],
                          ["instructor", "Instructors"],
                          ["teacher", "Teachers"],
                          ["admin", "Admins"],
                          ["school_admin", "School Admins"],
                          ["parent", "Parents"],
                        ],
                      },
                      {
                        val: filterDept,
                        set: setFilterDept,
                        opts: [
                          ["all", "All Depts"],
                          ["western", "Western"],
                          ["arabic", "Arabic"],
                          ["programming", "Programming"],
                        ],
                      },
                    ].map((s, i) => (
                      <select
                        key={i}
                        value={s.val}
                        onChange={(e) => s.set(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-teal-400"
                      >
                        {s.opts.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>

                  <div className="px-4 py-2 text-xs flex items-center justify-between bg-gray-50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-400">
                      Showing{" "}
                      <strong className="text-gray-700 dark:text-gray-300">
                        {filtered.length}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-teal-600">
                        {profiles.length}
                      </strong>{" "}
                      users
                    </span>
                    <button
                      onClick={() => navigate("/manage-users")}
                      className="text-teal-500 hover:underline font-semibold text-xs"
                    >
                      Full Management →
                    </button>
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-slate-700/50">
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
                              className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {filtered.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={
                                    p.user?.first_name ||
                                    p.user?.username ||
                                    "?"
                                  }
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {p.user?.first_name || p.user?.last_name ? (
                                    `${p.user.first_name} ${p.user.last_name}`.trim()
                                  ) : (
                                    <span className="italic text-gray-400">
                                      No name
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                              @{p.user?.username}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-[160px]">
                              {p.user?.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Pill role={p.role} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {p.department || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                              {p.student_class || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
                    {filtered.map((p) => (
                      <div key={p.id} className="p-4 flex items-center gap-3">
                        <Avatar
                          name={p.user?.first_name || p.user?.username || "?"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {p.user?.first_name || p.user?.last_name
                              ? `${p.user.first_name} ${p.user.last_name}`.trim()
                              : p.user?.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            @{p.user?.username} · {p.department || "—"}
                          </p>
                        </div>
                        <Pill role={p.role} />
                      </div>
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="text-gray-400 text-sm font-medium">
                        No users match your filters
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* COURSES */}
              {activeTab === "courses" && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.length === 0 && (
                    <p className="col-span-full text-center py-16 text-gray-400 text-sm">
                      No courses found
                    </p>
                  )}
                  {courses.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -3 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug flex-1 pr-2">
                          {c.title}
                        </h3>
                        {c.department && (
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${DEPT_STYLES[c.department as keyof typeof DEPT_STYLES]?.badge ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {c.department}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                        {c.description || "No description"}
                      </p>
                      <div className="flex justify-between text-[10px] text-gray-300 dark:text-gray-600 font-mono">
                        <span>ID #{c.id}</span>
                        <span>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* MANAGEMENT */}
              {activeTab === "results" && (
                <div className="space-y-5">
                  {/* Filter card */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4">
                      <h3 className="text-white font-black">
                        📝 Publish Results
                      </h3>
                      <p className="text-blue-100 text-xs mt-0.5">
                        Select class, term and session → load results → publish
                        to students
                      </p>
                    </div>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                          Class *
                        </label>
                        <select
                          value={pubClass}
                          onChange={(e) => {
                            setPubClass(e.target.value);
                            setPubLoaded(false);
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Select class —</option>
                          {CLASS_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {CLASS_LABELS[c] ?? c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                          Term *
                        </label>
                        <select
                          value={pubTerm}
                          onChange={(e) => {
                            setPubTerm(e.target.value);
                            setPubLoaded(false);
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {PUB_TERMS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                          Session *
                        </label>
                        <select
                          value={pubYear}
                          onChange={(e) => {
                            setPubYear(e.target.value);
                            setPubLoaded(false);
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {PUB_YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={loadPubResults}
                          disabled={pubLoading || !pubClass}
                          className="w-full px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {pubLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Loading…
                            </>
                          ) : (
                            "🔍 Load Results"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Results summary */}
                  {pubLoaded && (
                    <div className="space-y-4">
                      {/* Status breakdown */}
                      {(() => {
                        const draft = pubResults.filter(
                          (r: any) => r.status === "draft",
                        ).length;
                        const submitted = pubResults.filter(
                          (r: any) => r.status === "submitted",
                        ).length;
                        const reviewed = pubResults.filter(
                          (r: any) => r.status === "reviewed",
                        ).length;
                        const published = pubResults.filter(
                          (r: any) => r.status === "published",
                        ).length;
                        const canPublish = reviewed + submitted;
                        return (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                {
                                  label: "Draft",
                                  count: draft,
                                  bg: "bg-gray-100 dark:bg-gray-700",
                                  text: "text-gray-600 dark:text-gray-300",
                                },
                                {
                                  label: "Submitted",
                                  count: submitted,
                                  bg: "bg-amber-50 dark:bg-amber-900/20",
                                  text: "text-amber-700 dark:text-amber-300",
                                },
                                {
                                  label: "Reviewed",
                                  count: reviewed,
                                  bg: "bg-blue-50 dark:bg-blue-900/20",
                                  text: "text-blue-700 dark:text-blue-300",
                                },
                                {
                                  label: "Published",
                                  count: published,
                                  bg: "bg-green-50 dark:bg-green-900/20",
                                  text: "text-green-700 dark:text-green-300",
                                },
                              ].map((s) => (
                                <div
                                  key={s.label}
                                  className={`${s.bg} rounded-xl p-4 text-center`}
                                >
                                  <p
                                    className={`text-3xl font-black ${s.text}`}
                                  >
                                    {s.count}
                                  </p>
                                  <p
                                    className={`text-xs font-semibold mt-1 ${s.text}`}
                                  >
                                    {s.label}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {canPublish > 0 ? (
                              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                  <p className="font-bold text-amber-800 dark:text-amber-200">
                                    {canPublish} results ready to publish
                                  </p>
                                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-0.5">
                                    Publishing will make scores visible to
                                    students immediately. Report cards will also
                                    be auto-generated.
                                  </p>
                                </div>
                                <button
                                  onClick={publishAll}
                                  disabled={publishing}
                                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shrink-0"
                                >
                                  {publishing ? (
                                    <>
                                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Publishing…
                                    </>
                                  ) : (
                                    `🚀 Publish All (${canPublish})`
                                  )}
                                </button>
                              </div>
                            ) : published > 0 ? (
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 text-center">
                                <p className="text-2xl mb-1">✅</p>
                                <p className="font-bold text-green-700 dark:text-green-300">
                                  All {published} results already published
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                  Students can now view their scores
                                </p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-center">
                                <p className="font-bold text-gray-600 dark:text-gray-300">
                                  No reviewable results yet
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Subject teachers must enter and submit results
                                  first, then class teacher must review them
                                </p>
                              </div>
                            )}

                            {/* Results table */}
                            {pubResults.length > 0 && (
                              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {pubResults.length} results ·{" "}
                                    {CLASS_LABELS[pubClass] ?? pubClass} ·{" "}
                                    {pubTerm} · {pubYear}
                                  </p>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-800 dark:bg-gray-950 text-white text-xs">
                                      <tr>
                                        <th className="px-4 py-3 text-left">
                                          Student
                                        </th>
                                        <th className="px-3 py-3 text-left">
                                          Subject
                                        </th>
                                        <th className="px-3 py-3 text-center">
                                          Total
                                        </th>
                                        <th className="px-3 py-3 text-center">
                                          Grade
                                        </th>
                                        <th className="px-3 py-3 text-center">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {pubResults.map((r: any, i: number) => (
                                        <tr
                                          key={r.id}
                                          className={
                                            i % 2 === 0
                                              ? "bg-white dark:bg-gray-900"
                                              : "bg-gray-50 dark:bg-gray-800/50"
                                          }
                                        >
                                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 text-xs">
                                            {r.student_name ?? `#${r.student}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs max-w-[160px] truncate">
                                            {r.course_title ??
                                              `Course #${r.course}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-center font-bold text-gray-900 dark:text-white">
                                            {r.total ?? "—"}
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            {r.grade && (
                                              <span
                                                className="px-2 py-0.5 rounded-full text-xs font-black"
                                                style={{
                                                  background:
                                                    (
                                                      {
                                                        A: "#dcfce7",
                                                        B: "#dbeafe",
                                                        C: "#fef9c3",
                                                        D: "#ffedd5",
                                                        E: "#fee2e2",
                                                        F: "#fecaca",
                                                      } as any
                                                    )[r.grade] ?? "#f3f4f6",
                                                  color:
                                                    (
                                                      {
                                                        A: "#15803d",
                                                        B: "#1d4ed8",
                                                        C: "#a16207",
                                                        D: "#c2410c",
                                                        E: "#b91c1c",
                                                        F: "#991b1b",
                                                      } as any
                                                    )[r.grade] ?? "#374151",
                                                }}
                                              >
                                                {r.grade}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            <span
                                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                                              ${
                                                r.status === "published"
                                                  ? "bg-green-100 text-green-700"
                                                  : r.status === "reviewed"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : r.status === "submitted"
                                                      ? "bg-amber-100 text-amber-700"
                                                      : "bg-gray-100 text-gray-500"
                                              }`}
                                            >
                                              {r.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {!pubLoaded && !pubLoading && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
                      <p className="text-5xl mb-3">📊</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">
                        No results loaded
                      </p>
                      <p className="text-sm text-gray-400">
                        Select a class, term and session above then click Load
                        Results
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "management" && (
                <div className="space-y-5">
                  {[
                    {
                      title: "🎓 Academic",
                      items: [
                        { label: "Courses", to: "/courses", icon: "📚" },
                        {
                          label: "Assignments",
                          to: "/assignments",
                          icon: "📝",
                        },
                        { label: "Quizzes", to: "/quizzes", icon: "🧠" },
                        {
                          label: "Enrollments",
                          to: "/enrollments",
                          icon: "🎓",
                        },
                        {
                          label: "Achievements",
                          to: "/achievements",
                          icon: "🏆",
                        },
                        { label: "Milestones", to: "/milestones", icon: "🚀" },
                      ],
                    },
                    {
                      title: "👥 People",
                      items: [
                        { label: "All Users", to: "/manage-users", icon: "👥" },
                        {
                          label: "Student Dashboard",
                          to: "/student-dashboard",
                          icon: "👨‍🎓",
                        },
                        {
                          label: "Parent Portal",
                          to: "/parent-portal",
                          icon: "👨‍👩‍👧",
                        },
                        { label: "Profile", to: "/profile", icon: "👤" },
                      ],
                    },
                    {
                      title: "📈 Reports",
                      items: [
                        { label: "Analytics", to: "/analytics", icon: "📊" },
                        { label: "Payments", to: "/payments", icon: "💳" },
                        { label: "Projects", to: "/projects", icon: "🗂️" },
                        { label: "AI Help", to: "/ai", icon: "🤖" },
                      ],
                    },
                  ].map((section) => (
                    <div
                      key={section.title}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5"
                    >
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm">
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {section.items.map((item) => (
                          <motion.button
                            key={item.to}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(item.to)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-transparent hover:border-teal-200 dark:hover:border-teal-700 transition-all text-center"
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-tight">
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
    </div>
  );
};

export default AdminDashboard;
