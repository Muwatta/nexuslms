import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { getUserData } from "../utils/authUtils";

interface AuditEntry {
  id: number;
  action: string;
  model_name?: string;
  object_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user?: { username: string };
}
interface DeptStats {
  students: number;
  instructors: number;
  courses: number;
  enrollments: number;
}
interface SystemSnapshot {
  western: DeptStats;
  arabic: DeptStats;
  programming: DeptStats;
}
interface ProfileRow {
  id: number;
  role: string;
  department: string;
  student_class?: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

const DEPTS = [
  {
    id: "western",
    label: "Western School",
    icon: "🏛️",
    route: "/western-dashboard",
    grad: "135deg,#1d4ed8,#0ea5e9",
    ring: "#38bdf8",
    bg: "#0ea5e910",
    text: "#38bdf8",
    border: "#38bdf820",
    desc: "Western Education System",
  },
  {
    id: "arabic",
    label: "Arabic School",
    icon: "🕌",
    route: "/arabic-dashboard",
    grad: "135deg,#065f46,#10b981",
    ring: "#34d399",
    bg: "#10b98110",
    text: "#34d399",
    border: "#34d39920",
    desc: "Arabic Language & Islamic Studies",
  },
  {
    id: "programming",
    label: "Digital School",
    icon: "💻",
    route: "/digital-dashboard",
    grad: "135deg,#5b21b6,#8b5cf6",
    ring: "#a78bfa",
    bg: "#8b5cf610",
    text: "#a78bfa",
    border: "#a78bfa20",
    desc: "Programming & Technology",
  },
] as const;

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#ef4444",
  admin: "#f97316",
  school_admin: "#f59e0b",
  instructor: "#3b82f6",
  teacher: "#0ea5e9",
  student: "#10b981",
  parent: "#ec4899",
};

const ACTION_ICON: Record<string, string> = {
  create: "➕",
  update: "✏️",
  delete: "🗑️",
  archive: "📦",
  restore: "♻️",
  promote: "⬆️",
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
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

const SuperAdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const userData = getUserData();

  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "departments" | "users" | "audit"
  >("departments");
  const [userSearch, setUserSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  if (!userData || userData.role !== "super_admin")
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-red-400 font-semibold">
            Super Admin access required.
          </p>
        </div>
      </div>
    );

  const extract = (r: PromiseSettledResult<any>) => {
    if (r.status === "rejected") return [];
    const d = r.value.data;
    if (d && Array.isArray(d.results)) return d.results;
    if (Array.isArray(d)) return d;
    return [];
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [
        profilesRes,
        auditRes,
        westernCoursesRes,
        arabicCoursesRes,
        programmingCoursesRes,
        enrollRes,
      ] = await Promise.allSettled([
        api.get("/admin/users/", { params: { page_size: "200" } }),
        api.get("/audit-logs/", { params: { page_size: "100" } }),
        api.get("/courses/", {
          params: { department: "western", page_size: 500 },
        }),
        api.get("/courses/", {
          params: { department: "arabic", page_size: 500 },
        }),
        api.get("/courses/", {
          params: { department: "programming", page_size: 500 },
        }),
        api.get("/enrollments/", { params: { page_size: "1000" } }),
      ]);

      const extract = (r: PromiseSettledResult<any>) => {
        if (r.status === "rejected") return [];
        const d = r.value.data;
        if (d && Array.isArray(d.results)) return d.results;
        if (Array.isArray(d)) return d;
        return [];
      };

      const apiErrors: string[] = [];
      [
        profilesRes,
        westernCoursesRes,
        arabicCoursesRes,
        programmingCoursesRes,
        enrollRes,
      ].forEach((res, idx) => {
        if (res.status === "rejected") {
          const endpoints = [
            "/admin/users/",
            "/courses/?dept=western",
            "/courses/?dept=arabic",
            "/courses/?dept=programming",
            "/enrollments/",
          ];
          const e = res.reason;
          const status = e?.response?.status;
          const detail = e?.response?.data?.detail ?? e?.message ?? "unknown";
          console.error(`[SAP] ${endpoints[idx]} FAILED`, status, detail);
          apiErrors.push(
            `${endpoints[idx]} → HTTP ${status ?? "?"}: ${detail}`,
          );
        }
      });
      if (apiErrors.length > 0) setError(apiErrors.join(" | "));

      const profiles: ProfileRow[] = extract(profilesRes);
      const westernCourses = extract(westernCoursesRes);
      const arabicCourses = extract(arabicCoursesRes);
      const programmingCourses = extract(programmingCoursesRes);
      const allCourses = [
        ...westernCourses,
        ...arabicCourses,
        ...programmingCourses,
      ];
      const enrollments = extract(enrollRes);

      setAllProfiles(profiles);

      const snap: SystemSnapshot = {
        western: {
          students: 0,
          instructors: 0,
          courses: westernCourses.length,
          enrollments: 0,
        },
        arabic: {
          students: 0,
          instructors: 0,
          courses: arabicCourses.length,
          enrollments: 0,
        },
        programming: {
          students: 0,
          instructors: 0,
          courses: programmingCourses.length,
          enrollments: 0,
        },
      };

      profiles.forEach((p) => {
        const d = p.department as keyof SystemSnapshot;
        if (!d || !snap[d]) return;
        if (p.role === "student") snap[d].students++;
        if (["instructor", "teacher"].includes(p.role)) snap[d].instructors++;
      });

      enrollments.forEach((e: any) => {
        const courseId = e.course?.id ?? e.course;
        const course = allCourses.find((c: any) => c.id === courseId);
        if (
          course?.department &&
          snap[course.department as keyof SystemSnapshot]
        ) {
          snap[course.department as keyof SystemSnapshot].enrollments++;
        }
      });

      setSnapshot(snap);

      if (auditRes.status === "fulfilled") {
        const raw = auditRes.value.data?.results ?? auditRes.value.data ?? [];
        setAuditLogs(raw.slice(0, 100));
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.response?.statusText ??
        e?.message ??
        "Unknown error";
      const status = e?.response?.status ? ` (HTTP ${e.response.status})` : "";
      setError(`Failed to load portal data: ${msg}${status}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enterDept = async (dept: (typeof DEPTS)[number]) => {
    navigate(dept.route);
    api
      .post("/audit-logs/", {
        action: "update",
        model_name: "Department",
        object_id: dept.id,
        new_values: { accessed: dept.label },
      })
      .catch(() => {});
  };

  const filtered = allProfiles.filter((p) => {
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

  const fullName = (p: ProfileRow) =>
    `${p.user.first_name} ${p.user.last_name}`.trim() || p.user.username;
  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <div
            className="w-11 h-11 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
            style={{
              borderColor: "#14b8a6 transparent transparent transparent",
            }}
          />
          <p className="text-slate-400 text-sm">Loading portal…</p>
        </div>
      </div>
    );

  const TABS = [
    { id: "departments" as const, label: "🏫 Departments" },
    { id: "users" as const, label: `👥 All Users (${allProfiles.length})` },
    { id: "audit" as const, label: `📋 Audit Log (${auditLogs.length})` },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        className="relative overflow-hidden px-4 sm:px-8 py-7"
        style={{
          background:
            "linear-gradient(135deg,#0a0f1e 0%,#111827 50%,#0a0f1e 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#14b8a6 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="absolute -top-24 right-0 w-96 h-96 rounded-full blur-[150px] opacity-10"
          style={{ background: "#6366f1" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-[120px] opacity-8"
          style={{ background: "#14b8a6" }}
        />

        <div className="relative max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl"
              style={{ background: "linear-gradient(135deg,#14b8a6,#6366f1)" }}
            >
              SA
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Super Admin Portal
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Full system access ·{" "}
                {userData.firstName
                  ? `${userData.firstName} ${userData.lastName ?? ""}`.trim()
                  : userData.username}
              </p>
              {lastUpdated && (
                <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                  {refreshing ? (
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block" />
                  ) : null}
                  Updated {lastUpdated.toLocaleTimeString()}
                  {" · "}
                  <span className="text-teal-400 font-semibold">
                    {allProfiles.length} users loaded
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "#14b8a620",
                color: "#14b8a6",
                border: "1px solid #14b8a630",
              }}
            >
              🔑 Super Admin
            </span>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: "#6366f120",
                color: "#a5b4fc",
                border: "1px solid #6366f130",
              }}
            >
              ⚙️ Admin Dashboard
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl transition-colors disabled:opacity-50"
              style={{
                background: "#ffffff10",
                border: "1px solid #ffffff15",
                color: "#94a3b8",
              }}
              title="Refresh"
            >
              {refreshing ? "⏳" : "🔄"}
            </button>
          </div>
        </div>
      </div>

      <div
        className="sticky top-0 z-20 border-b"
        style={{ background: "#0f172a", borderColor: "#1e293b" }}
      >
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px shrink-0 transition-all ${
                activeSection === tab.id
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded-2xl text-sm flex items-center justify-between font-medium"
              style={{
                background: "#ef444415",
                border: "1px solid #ef444430",
                color: "#ef4444",
              }}
            >
              ⚠️ {error}
              <button
                onClick={() => setError(null)}
                className="opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === "departments" && (
              <div className="space-y-8">
                {/* Global summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Users",
                      value: allProfiles.length,
                      color: "#14b8a6",
                      icon: "👤",
                    },
                    {
                      label: "Students",
                      value: allProfiles.filter((p) => p.role === "student")
                        .length,
                      color: "#3b82f6",
                      icon: "👨‍🎓",
                    },
                    {
                      label: "Instructors",
                      value: allProfiles.filter((p) =>
                        ["instructor", "teacher"].includes(p.role),
                      ).length,
                      color: "#8b5cf6",
                      icon: "👨‍🏫",
                    },
                    {
                      label: "Admins",
                      value: allProfiles.filter((p) =>
                        ["school_admin", "admin", "super_admin"].includes(
                          p.role,
                        ),
                      ).length,
                      color: "#f59e0b",
                      icon: "🔑",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-4 border"
                      style={{
                        background: s.color + "10",
                        borderColor: s.color + "20",
                      }}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div
                        className="text-2xl font-black"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dept cards */}
                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Department Access
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {DEPTS.map((dept, i) => {
                      const stats = snapshot?.[dept.id] ?? null;
                      return (
                        <motion.div
                          key={dept.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative overflow-hidden rounded-2xl cursor-pointer border transition-all hover:shadow-xl"
                          style={{
                            background: "#111827",
                            borderColor: dept.border,
                            boxShadow: `0 0 0 0 ${dept.ring}`,
                          }}
                          onClick={() => enterDept(dept)}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.boxShadow =
                              `0 0 30px ${dept.ring}20`)
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.boxShadow =
                              "")
                          }
                        >
                          {/* Gradient top bar */}
                          <div
                            className="h-1.5 w-full"
                            style={{
                              background: `linear-gradient(${dept.grad})`,
                            }}
                          />

                          <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                              <span className="text-4xl">{dept.icon}</span>
                              <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{
                                  background: dept.bg,
                                  color: dept.text,
                                  border: `1px solid ${dept.border}`,
                                }}
                              >
                                Full Access
                              </span>
                            </div>

                            <h3 className="text-lg font-extrabold text-white mb-1">
                              {dept.label}
                            </h3>
                            <p className="text-xs text-slate-500 mb-5">
                              {dept.desc}
                            </p>

                            {stats && (
                              <div className="grid grid-cols-2 gap-2 mb-5">
                                {[
                                  {
                                    label: "Students",
                                    value: stats.students,
                                    icon: "👨‍🎓",
                                  },
                                  {
                                    label: "Instructors",
                                    value: stats.instructors,
                                    icon: "👨‍🏫",
                                  },
                                  {
                                    label: "Courses",
                                    value: stats.courses,
                                    icon: "📚",
                                  },
                                  {
                                    label: "Enrollments",
                                    value: stats.enrollments,
                                    icon: "🎓",
                                  },
                                ].map((s) => (
                                  <div
                                    key={s.label}
                                    className="rounded-xl p-3 border"
                                    style={{
                                      background: dept.bg,
                                      borderColor: dept.border,
                                    }}
                                  >
                                    <p
                                      className="text-lg font-black"
                                      style={{ color: dept.text }}
                                    >
                                      {s.value}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {s.icon} {s.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                              style={{
                                background: `linear-gradient(${dept.grad})`,
                              }}
                            >
                              Enter Dashboard →
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick actions */}
                <div
                  className="rounded-2xl border p-6"
                  style={{ background: "#111827", borderColor: "#1e293b" }}
                >
                  <h3 className="font-bold text-white mb-4 text-sm">
                    ⚡ Admin Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Manage Users",
                        icon: "👥",
                        route: "/manage-users",
                      },
                      {
                        label: "Admin Dashboard",
                        icon: "⚙️",
                        route: "/admin-dashboard",
                      },
                      { label: "All Courses", icon: "📚", route: "/courses" },
                      {
                        label: "Assignments",
                        icon: "📝",
                        route: "/assignments",
                      },
                      { label: "Payments", icon: "💳", route: "/payments" },
                      {
                        label: "Enrollments",
                        icon: "🎓",
                        route: "/enrollments",
                      },
                      { label: "Analytics", icon: "📊", route: "/analytics" },
                      { label: "AI Help", icon: "🤖", route: "/ai" },
                    ].map((item) => (
                      <motion.button
                        key={item.route}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(item.route)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                        style={{
                          background: "#1e293b",
                          borderColor: "#334155",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#14b8a640";
                          (e.currentTarget as HTMLElement).style.background =
                            "#14b8a608";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#334155";
                          (e.currentTarget as HTMLElement).style.background =
                            "#1e293b";
                        }}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs font-medium text-slate-400 text-center leading-tight">
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ ALL USERS ══════════════════════════════════════════════ */}
            {activeSection === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">All Users</h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {allProfiles.length} total across all departments
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/manage-users")}
                    className="text-sm font-semibold text-teal-400 hover:underline"
                  >
                    Full Management →
                  </button>
                </div>

                {/* Dept breakdown pills */}
                <div className="flex flex-wrap gap-2">
                  {DEPTS.map((d) => {
                    const count = allProfiles.filter(
                      (p) => p.department === d.id,
                    ).length;
                    return (
                      <button
                        key={d.id}
                        onClick={() =>
                          setFilterDept(filterDept === d.id ? "all" : d.id)
                        }
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          background: filterDept === d.id ? d.bg : "#1e293b",
                          color: filterDept === d.id ? d.text : "#64748b",
                          borderColor:
                            filterDept === d.id ? d.border : "#334155",
                        }}
                      >
                        {d.icon} {d.label}: {count}
                      </button>
                    );
                  })}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      🔍
                    </span>
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, username or email…"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                      style={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#14b8a6")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#334155")
                      }
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
                        ["school_admin", "School Admins"],
                        ["admin", "Admins"],
                        ["parent", "Parents"],
                      ],
                    },
                  ].map((s, i) => (
                    <select
                      key={i}
                      value={s.val}
                      onChange={(e) => s.set(e.target.value)}
                      className="px-3 py-2.5 text-sm rounded-xl text-white focus:outline-none"
                      style={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                      }}
                    >
                      {s.opts.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>

                <div className="text-xs text-slate-500 px-1">
                  Showing{" "}
                  <strong className="text-slate-300">{filtered.length}</strong>{" "}
                  of{" "}
                  <strong className="text-teal-400">
                    {allProfiles.length}
                  </strong>{" "}
                  users
                </div>

                {/* Table */}
                <div
                  className="rounded-2xl overflow-hidden border"
                  style={{ background: "#111827", borderColor: "#1e293b" }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "#1e293b" }}>
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
                              className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.015, 0.4) }}
                            className="border-t transition-colors"
                            style={{ borderColor: "#1e293b" }}
                            onMouseEnter={(e) =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.background = "#1e293b")
                            }
                            onMouseLeave={(e) =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.background = "")
                            }
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
                                <span className="font-medium text-white text-sm">
                                  {fullName(p) || (
                                    <span className="italic text-slate-500">
                                      No name
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                              @{p.user.username}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[160px]">
                              {p.user.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Pill role={p.role} />
                            </td>
                            <td className="px-4 py-3 text-slate-400 capitalize text-xs">
                              {p.department || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                              {p.student_class || "—"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-3xl mb-2">🔍</p>
                      <p className="text-slate-500 text-sm">
                        No users match your filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "audit" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    📋 Audit Log
                  </h2>
                  <p className="text-sm text-slate-400">
                    Every create, update, delete, archive, restore and password
                    change is recorded here.
                  </p>
                </div>

                {auditLogs.length === 0 ? (
                  <div
                    className="rounded-2xl p-16 text-center border"
                    style={{ background: "#111827", borderColor: "#1e293b" }}
                  >
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-slate-400 font-semibold">
                      No audit entries yet
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Actions will appear here as you use the system
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl overflow-hidden border"
                    style={{ background: "#111827", borderColor: "#1e293b" }}
                  >
                    {auditLogs.map((log, i) => (
                      <motion.div
                        key={log.id ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        className="flex items-start gap-4 px-5 py-4 border-t transition-colors"
                        style={{ borderColor: "#1e293b" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "#1e293b")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "")
                        }
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            background: "#14b8a615",
                            border: "1px solid #14b8a620",
                          }}
                        >
                          <span className="text-sm">
                            {ACTION_ICON[log.action?.toLowerCase()] ?? "📌"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                              style={{
                                background: "#1e293b",
                                color: "#94a3b8",
                              }}
                            >
                              {log.action}
                            </span>
                            {log.model_name && (
                              <span className="text-xs text-slate-500">
                                {log.model_name} #{log.object_id}
                              </span>
                            )}
                            {log.user?.username && (
                              <span className="text-xs font-medium text-teal-400">
                                by @{log.user.username}
                              </span>
                            )}
                          </div>
                          {log.new_values &&
                            Object.keys(log.new_values).length > 0 && (
                              <p className="text-xs text-slate-600 mt-1 font-mono truncate">
                                {JSON.stringify(log.new_values)}
                              </p>
                            )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500">
                            {fmt(log.timestamp)}
                          </p>
                          {log.ip_address && (
                            <p className="text-[10px] text-slate-700 mt-0.5 font-mono">
                              {log.ip_address}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SuperAdminPortal;
