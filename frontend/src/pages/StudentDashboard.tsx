import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentInfo {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  department: string;
  student_class?: string;
  bio?: string;
  phone?: string;
}
interface Course {
  id: number;
  title: string;
  description?: string;
  department?: string;
  student_class?: string;
  instructor_name?: string;
  instructor_id?: number;
  is_enrolled: boolean;
  total_students: number;
}
interface Enrollment {
  id: number;
  course: number;
  course_title: string;
  course_department?: string;
  academic_year: string;
  term: string;
  status: string;
  enrolled_at: string;
  add_drop_count: number;
  drop_history: DropEvent[];
  instructor_name?: string;
}
interface DropEvent {
  action: "add" | "drop";
  course_id: number;
  course_title: string;
  timestamp: string;
}
interface Assignment {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  course: number;
  course_title?: string;
  max_score?: number;
}
interface FeeStatus {
  academic_year: string;
  term: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: "pending" | "partial" | "paid" | "overdue";
  due_date: string;
}
interface Instructor {
  id: number;
  full_name: string;
  username: string;
  email?: string;
  department?: string;
  instructor_type?: string;
  course_titles: string[];
}
interface ChatThread {
  user_id: number;
  name: string;
  role?: string;
  last_message?: string;
  last_time?: string;
  unread: number;
}
interface ChatMessage {
  id: number;
  sender: number;
  sender_name: string;
  sender_role?: string;
  recipient: number;
  recipient_name: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}
interface Announcement {
  id: string;
  type: string;
  title: string;
  body: string;
  course?: string;
  due?: string;
}

interface DashboardData {
  student: StudentInfo;
  current_year: string;
  current_term: string;
  enrollments: Enrollment[];
  assignments: Assignment[];
  fee_status: FeeStatus | null;
  instructors: Instructor[];
  unread_messages: number;
  add_drop_used: number;
  add_drop_remaining: number;
}

type Tab =
  | "home"
  | "courses"
  | "assignments"
  | "results"
  | "fees"
  | "chat"
  | "instructors";

// ─── Colours ──────────────────────────────────────────────────────────────────
const DEPT_COLOR: Record<string, string> = {
  western: "from-blue-600 to-cyan-500",
  arabic: "from-emerald-600 to-teal-500",
  programming: "from-violet-600 to-purple-500",
};
const FEE_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  partial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};
const STATUS_BADGE: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  promoted:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fullName = (s: StudentInfo) =>
  `${s.first_name} ${s.last_name}`.trim() || s.username;

const initial = (name: string) => name.trim()[0]?.toUpperCase() ?? "?";

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Tab nav config ───────────────────────────────────────────────────────────
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "courses", icon: "📚", label: "Courses" },
  { id: "assignments", icon: "📝", label: "Assignments" },
  { id: "results", icon: "📊", label: "Results" },
  { id: "fees", icon: "💳", label: "Fees" },
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "instructors", icon: "👨‍🏫", label: "Teachers" },
];

// ═══════════════════════════════════════════════════════════════════════════════
const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  // Course add/drop
  const [courseFilter, setCourseFilter] = useState<
    "all" | "enrolled" | "available"
  >("all");
  const [addDropBusy, setAddDropBusy] = useState<number | null>(null);

  // Chat
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Fetch dashboard ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, courseRes, annoRes, histRes] = await Promise.allSettled([
        api.get("/student/dashboard/"),
        api.get("/student/courses/"),
        api.get("/student/announcements/"),
        api.get("/student/enrollments/"),
      ]);
      if (dashRes.status === "fulfilled") setData(dashRes.value.data);
      if (courseRes.status === "fulfilled") {
        const d = courseRes.value.data;
        setCourses(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (annoRes.status === "fulfilled")
        setAnnouncements(annoRes.value.data ?? []);
      if (histRes.status === "fulfilled") {
        const d = histRes.value.data;
        setAllEnrollments(Array.isArray(d) ? d : (d?.results ?? []));
      }
    } catch {
      notify(false, "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Chat fetch ──────────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    try {
      const res = await api.get("/student/chat/");
      setThreads(res.data ?? []);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (userId: number) => {
    setChatLoading(true);
    try {
      const res = await api.get(`/student/chat/?with=${userId}`);
      setMessages(res.data ?? []);
      setTimeout(
        () => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch {
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      fetchThreads();
    }
  }, [activeTab, fetchThreads]);

  useEffect(() => {
    if (activeThread) fetchMessages(activeThread.user_id);
  }, [activeThread, fetchMessages]);

  const sendMessage = async () => {
    if (!activeThread || !chatInput.trim()) return;
    try {
      await api.post("/student/chat/", {
        recipient: activeThread.user_id,
        message: chatInput.trim(),
      });
      setChatInput("");
      fetchMessages(activeThread.user_id);
    } catch {
      notify(false, "Failed to send message");
    }
  };

  // ── Add / Drop ──────────────────────────────────────────────────────────
  const handleEnroll = async (courseId: number) => {
    if (!data || data.add_drop_remaining <= 0) {
      notify(
        false,
        `Add/drop limit reached (${data?.add_drop_used ?? 2}/2 used this term).`,
      );
      return;
    }
    setAddDropBusy(courseId);
    try {
      await api.post(`/student/courses/${courseId}/enroll/`);
      notify(true, "Enrolled successfully");
      fetchAll();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Enroll failed");
    } finally {
      setAddDropBusy(null);
    }
  };

  const handleDrop = async (courseId: number) => {
    if (!data || data.add_drop_remaining <= 0) {
      notify(
        false,
        `Add/drop limit reached (${data?.add_drop_used ?? 2}/2 used this term).`,
      );
      return;
    }
    setAddDropBusy(courseId);
    try {
      await api.post(`/student/courses/${courseId}/drop/`);
      notify(true, "Course dropped");
      fetchAll();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Drop failed");
    } finally {
      setAddDropBusy(null);
    }
  };

  // ── Filtered courses ────────────────────────────────────────────────────
  const filteredCourses = courses.filter((c) => {
    if (courseFilter === "enrolled") return c.is_enrolled;
    if (courseFilter === "available") return !c.is_enrolled;
    return true;
  });

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-900 to-slate-800"
      >
        <div className="text-center">
          <div
            className="w-14 h-14 border-4 border-teal-400 border-t-transparent
            rounded-full animate-spin mx-auto mb-4"
          />
          <p className="text-slate-400 text-sm tracking-wide">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-red-400">
          Could not load student data. Please refresh.
        </p>
      </div>
    );
  }

  const {
    student,
    current_term,
    current_year,
    enrollments,
    assignments,
    fee_status,
    instructors,
    unread_messages,
    add_drop_used,
    add_drop_remaining,
  } = data;

  const deptGrad =
    DEPT_COLOR[student.department] ?? "from-slate-600 to-slate-500";

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* ── Hero / Identity banner ─────────────────────────────────────────── */}
      <div
        className={`bg-gradient-to-r ${deptGrad} px-4 sm:px-8 pt-6 pb-16 relative overflow-hidden`}
      >
        {/* decorative blobs */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full
          bg-white/10 blur-2xl pointer-events-none"
        />
        <div
          className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full
          bg-black/10 blur-xl pointer-events-none"
        />

        <div className="max-w-5xl mx-auto flex items-center gap-5 relative">
          {/* Avatar */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20
            backdrop-blur-sm flex items-center justify-center
            text-white font-black text-2xl sm:text-3xl shrink-0 shadow-lg"
          >
            {initial(fullName(student))}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {fullName(student)}
            </h1>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span
                className="bg-white/20 text-white text-xs font-semibold
                px-3 py-1 rounded-full backdrop-blur-sm"
              >
                🎓 {student.student_id}
              </span>
              <span
                className="bg-white/20 text-white text-xs font-semibold
                px-3 py-1 rounded-full backdrop-blur-sm capitalize"
              >
                {student.department} dept
              </span>
              {student.student_class && (
                <span
                  className="bg-white/20 text-white text-xs font-semibold
                  px-3 py-1 rounded-full backdrop-blur-sm"
                >
                  Class: {student.student_class}
                </span>
              )}
              <span
                className="bg-white/20 text-white text-xs font-semibold
                px-3 py-1 rounded-full backdrop-blur-sm"
              >
                {current_term} · {current_year}
              </span>
            </div>
          </div>
          {/* Unread badge */}
          {unread_messages > 0 && (
            <button
              onClick={() => setActiveTab("chat")}
              className="ml-auto shrink-0 bg-red-500 text-white text-sm
                font-bold px-3 py-1.5 rounded-full shadow animate-pulse"
            >
              💬 {unread_messages}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar (pulled up over banner) ───────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-3 -mt-8 relative z-10">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl
          flex overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[64px] flex flex-col items-center gap-1
                py-3 px-2 text-xs font-semibold transition-colors relative
                ${
                  activeTab === tab.id
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full"
                />
              )}
              {tab.id === "chat" && unread_messages > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl
              shadow-lg text-sm font-medium max-w-sm
              ${
                toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
          >
            {toast.ok ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.15 }}
          >
            {/* ══ HOME ════════════════════════════════════════════════════════ */}
            {activeTab === "home" && (
              <div className="space-y-5">
                {/* Quick stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Enrolled",
                      value: enrollments.filter((e) => e.status === "active")
                        .length,
                      icon: "📚",
                      color:
                        "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300",
                    },
                    {
                      label: "Assignments",
                      value: assignments.length,
                      icon: "📝",
                      color:
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                    },
                    {
                      label: "Add/Drop Left",
                      value: add_drop_remaining,
                      icon: "🔄",
                      color:
                        add_drop_remaining > 0
                          ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                          : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
                    },
                    {
                      label: "Fee Status",
                      value: fee_status?.status ?? "N/A",
                      icon: "💳",
                      color:
                        FEE_BADGE[fee_status?.status ?? ""] ??
                        "bg-gray-100 text-gray-600",
                    },
                  ].map((s) => (
                    <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-2xl font-black">{s.value}</span>
                      </div>
                      <p className="text-xs font-medium opacity-80">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Announcements / News */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
                    📢 Latest Announcements
                  </h2>
                  {announcements.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No announcements yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 p-3 rounded-xl
                            bg-slate-50 dark:bg-slate-700/40"
                        >
                          <span className="text-xl mt-0.5">
                            {a.type === "assignment" ? "📝" : "📣"}
                          </span>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-semibold text-slate-800
                              dark:text-slate-100 truncate"
                            >
                              {a.title}
                            </p>
                            {a.course && (
                              <p className="text-xs text-teal-600 dark:text-teal-400">
                                {a.course}
                              </p>
                            )}
                            {a.body && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {a.body}
                              </p>
                            )}
                            {a.due && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Due {fmtDate(a.due)}
                                {daysUntil(a.due) >= 0 &&
                                  ` · ${daysUntil(a.due)}d left`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current courses quick list */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      📖 My Courses This Term
                    </h2>
                    <button
                      onClick={() => setActiveTab("courses")}
                      className="text-xs text-teal-600 dark:text-teal-400
                        font-medium hover:underline"
                    >
                      Manage →
                    </button>
                  </div>
                  {enrollments.filter((e) => e.status === "active").length ===
                  0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No active enrolments. Go to Courses to enrol.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {enrollments
                        .filter((e) => e.status === "active")
                        .map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between px-3 py-2.5
                            rounded-xl bg-slate-50 dark:bg-slate-700/40"
                          >
                            <div>
                              <p
                                className="text-sm font-semibold text-slate-800
                              dark:text-slate-100"
                              >
                                {e.course_title}
                              </p>
                              {e.instructor_name && (
                                <p className="text-xs text-slate-400">
                                  {e.instructor_name}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${STATUS_BADGE[e.status] ?? ""}`}
                            >
                              {e.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Fee alert */}
                {fee_status && fee_status.status !== "paid" && (
                  <div
                    className={`rounded-2xl p-4 border flex items-start gap-3
                    ${
                      fee_status.status === "overdue"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {fee_status.status === "overdue"
                          ? "Fee Overdue!"
                          : "Outstanding Balance"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Balance: ₦{Number(fee_status.balance).toLocaleString()}{" "}
                        · Due {fmtDate(fee_status.due_date)}
                      </p>
                      <button
                        onClick={() => setActiveTab("fees")}
                        className="mt-2 text-xs font-semibold text-teal-600
                          dark:text-teal-400 hover:underline"
                      >
                        View fee details →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ COURSES ══════════════════════════════════════════════════════ */}
            {activeTab === "courses" && (
              <div className="space-y-4">
                {/* Add/drop limit indicator */}
                <div
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4
                  flex items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Add / Drop Allowance — {current_term}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {add_drop_used} of 2 changes used · {add_drop_remaining}{" "}
                      remaining
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all
                        ${
                          add_drop_remaining === 0
                            ? "bg-red-500"
                            : add_drop_remaining === 1
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${(add_drop_used / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-3xl font-black
                    ${add_drop_remaining === 0 ? "text-red-500" : "text-emerald-500"}`}
                  >
                    {add_drop_remaining}
                  </span>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  {(["all", "enrolled", "available"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCourseFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold
                        transition-colors capitalize
                        ${
                          courseFilter === f
                            ? "bg-teal-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Course cards */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {filteredCourses.map((c) => {
                    const busy = addDropBusy === c.id;
                    return (
                      <motion.div
                        key={c.id}
                        layout
                        className={`bg-white dark:bg-slate-800 rounded-2xl
                          shadow-sm p-5 border-2 transition-colors
                          ${
                            c.is_enrolled
                              ? "border-teal-400 dark:border-teal-600"
                              : "border-transparent"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className="font-bold text-slate-800 dark:text-slate-100
                            leading-tight"
                          >
                            {c.title}
                          </h3>
                          {c.is_enrolled && (
                            <span
                              className="shrink-0 text-xs bg-teal-100
                              dark:bg-teal-900/40 text-teal-700 dark:text-teal-300
                              px-2 py-0.5 rounded-full font-medium"
                            >
                              Enrolled
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                            {c.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {c.instructor_name && (
                            <span
                              className="text-xs bg-slate-100 dark:bg-slate-700
                              text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full"
                            >
                              👨‍🏫 {c.instructor_name}
                            </span>
                          )}
                          <span
                            className="text-xs bg-slate-100 dark:bg-slate-700
                            text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full"
                          >
                            👥 {c.total_students} students
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            c.is_enrolled
                              ? handleDrop(c.id)
                              : handleEnroll(c.id)
                          }
                          disabled={
                            busy || (add_drop_remaining <= 0 && !c.is_enrolled)
                          }
                          className={`w-full py-2 rounded-xl text-sm font-semibold
                            transition-colors disabled:opacity-50
                            ${
                              c.is_enrolled
                                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                                : add_drop_remaining > 0
                                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                          {busy
                            ? "…"
                            : c.is_enrolled
                              ? "− Drop Course"
                              : add_drop_remaining > 0
                                ? "+ Enrol"
                                : "Limit Reached"}
                        </button>
                      </motion.div>
                    );
                  })}
                  {filteredCourses.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400">
                      <p className="text-3xl mb-2">📚</p>
                      <p className="text-sm">No courses found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ ASSIGNMENTS ══════════════════════════════════════════════════ */}
            {activeTab === "assignments" && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  📝 Assignments
                </h2>
                {assignments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-sm">No assignments yet</p>
                  </div>
                ) : (
                  assignments.map((a) => {
                    const days = daysUntil(a.deadline);
                    const urgent = days <= 3 && days >= 0;
                    const overdue = days < 0;
                    return (
                      <div
                        key={a.id}
                        className={`bg-white dark:bg-slate-800 rounded-2xl
                          shadow-sm p-5 border-l-4
                          ${
                            overdue
                              ? "border-red-400"
                              : urgent
                                ? "border-amber-400"
                                : "border-teal-400"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {a.title}
                            </p>
                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                              {a.course_title ?? `Course #${a.course}`}
                            </p>
                            {a.description && (
                              <p
                                className="text-sm text-slate-500 dark:text-slate-400
                                mt-1.5 line-clamp-2"
                              >
                                {a.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full
                              ${
                                overdue
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                  : urgent
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              }`}
                            >
                              {overdue
                                ? "⚠️ Overdue"
                                : days === 0
                                  ? "🔥 Today"
                                  : `${days}d left`}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">
                              Due {fmtDate(a.deadline)}
                            </p>
                            {a.max_score && (
                              <p className="text-xs text-slate-400">
                                Max: {a.max_score}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ══ RESULTS ══════════════════════════════════════════════════════ */}
            {activeTab === "results" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  📊 My Results
                </h2>
                {enrollments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-3xl mb-2">📊</p>
                    <p className="text-sm">No results available yet</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase">
                        <tr>
                          {[
                            "Course",
                            "Instructor",
                            "Status",
                            "Term",
                            "Year",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left font-semibold
                              text-slate-600 dark:text-slate-300"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {enrollments.map((e) => (
                          <tr
                            key={e.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/40
                              transition-colors"
                          >
                            <td
                              className="px-4 py-3 font-medium text-slate-800
                              dark:text-slate-100"
                            >
                              {e.course_title}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {e.instructor_name ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium
                                ${STATUS_BADGE[e.status] ?? ""}`}
                              >
                                {e.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {e.term}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {e.academic_year}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ FEES ═════════════════════════════════════════════════════════ */}
            {activeTab === "fees" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  💳 School Fees
                </h2>

                {!fee_status ? (
                  <div
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-10
                    text-center text-slate-400"
                  >
                    <p className="text-3xl mb-2">✅</p>
                    <p className="font-semibold">No fee record for this term</p>
                    <p className="text-xs mt-1">
                      Contact admin if you believe this is an error
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-slate-400">
                          {current_term} · {current_year}
                        </p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          Fee Statement
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold px-4 py-1.5 rounded-full capitalize
                        ${FEE_BADGE[fee_status.status]}`}
                      >
                        {fee_status.status}
                      </span>
                    </div>

                    {/* Fee breakdown */}
                    <div className="space-y-3 mb-6">
                      {[
                        {
                          label: "Total Amount",
                          value: `₦${Number(fee_status.total_amount).toLocaleString()}`,
                          bold: false,
                        },
                        {
                          label: "Amount Paid",
                          value: `₦${Number(fee_status.amount_paid).toLocaleString()}`,
                          bold: false,
                        },
                        {
                          label: "Balance Due",
                          value: `₦${Number(fee_status.balance).toLocaleString()}`,
                          bold: true,
                        },
                      ].map((r) => (
                        <div
                          key={r.label}
                          className="flex justify-between items-center py-2.5
                            border-b border-slate-100 dark:border-slate-700"
                        >
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {r.label}
                          </span>
                          <span
                            className={`text-sm ${
                              r.bold
                                ? "font-black text-slate-800 dark:text-slate-100"
                                : "font-medium text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Payment progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Payment progress</span>
                        <span>
                          {Math.round(
                            (Number(fee_status.amount_paid) /
                              Number(fee_status.total_amount)) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all
                          ${
                            fee_status.status === "paid"
                              ? "bg-emerald-500"
                              : fee_status.status === "overdue"
                                ? "bg-red-500"
                                : "bg-amber-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(fee_status.amount_paid) /
                                Number(fee_status.total_amount)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Due date: {fmtDate(fee_status.due_date)}
                      {fee_status.status !== "paid" && (
                        <span className="ml-2 text-amber-500 font-medium">
                          · Contact admin to make payment
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══ CHAT ═════════════════════════════════════════════════════════ */}
            {activeTab === "chat" && (
              <div className="flex gap-4 h-[500px]">
                {/* Thread list */}
                <div
                  className={`${activeThread ? "hidden sm:flex" : "flex"} flex-col
                  w-full sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-sm
                  overflow-hidden`}
                >
                  <div className="p-4 border-b dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      💬 Messages
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {threads.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center p-6">
                        No conversations yet. Message an instructor from the
                        Teachers tab.
                      </p>
                    ) : (
                      threads.map((t) => (
                        <button
                          key={t.user_id}
                          onClick={() => setActiveThread(t)}
                          className={`w-full flex items-center gap-3 px-4 py-3
                            text-left hover:bg-slate-50 dark:hover:bg-slate-700/50
                            transition-colors border-b dark:border-slate-700/50
                            ${
                              activeThread?.user_id === t.user_id
                                ? "bg-teal-50 dark:bg-teal-900/20"
                                : ""
                            }`}
                        >
                          <div
                            className="w-9 h-9 rounded-full bg-gradient-to-br
                            from-teal-500 to-indigo-600 flex items-center justify-center
                            text-white font-bold text-sm shrink-0"
                          >
                            {initial(t.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className="text-xs font-semibold text-slate-800
                                dark:text-slate-100 truncate"
                              >
                                {t.name}
                              </p>
                              {t.unread > 0 && (
                                <span
                                  className="shrink-0 w-4 h-4 rounded-full bg-red-500
                                  text-white text-[10px] flex items-center justify-center font-bold"
                                >
                                  {t.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {t.last_message ?? "No messages yet"}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Message window */}
                {activeThread ? (
                  <div
                    className="flex-1 flex flex-col bg-white dark:bg-slate-800
                    rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3
                      border-b dark:border-slate-700"
                    >
                      <button
                        onClick={() => setActiveThread(null)}
                        className="sm:hidden text-slate-400 hover:text-slate-600 mr-1"
                      >
                        ←
                      </button>
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-br
                        from-teal-500 to-indigo-600 flex items-center justify-center
                        text-white font-bold text-sm shrink-0"
                      >
                        {initial(activeThread.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {activeThread.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {activeThread.role}
                        </p>
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div
                            className="w-6 h-6 border-2 border-teal-500
                            border-t-transparent rounded-full animate-spin"
                          />
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">
                          Start the conversation
                        </p>
                      ) : (
                        messages.map((m) => {
                          const mine = m.sender !== activeThread.user_id;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm
                                ${
                                  mine
                                    ? "bg-teal-600 text-white rounded-br-sm"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                                }`}
                              >
                                <p>{m.message}</p>
                                <p
                                  className={`text-xs mt-1 ${mine ? "text-teal-200" : "text-slate-400"}`}
                                >
                                  {fmtTime(m.timestamp)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={msgEndRef} />
                    </div>
                    {/* Input */}
                    <div className="p-3 border-t dark:border-slate-700 flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && sendMessage()
                        }
                        placeholder="Type a message…"
                        className="flex-1 px-4 py-2.5 text-sm rounded-xl border
                          border-slate-200 dark:border-slate-600
                          bg-slate-50 dark:bg-slate-700
                          text-slate-800 dark:text-slate-100
                          focus:outline-none focus:ring-2 focus:ring-teal-500
                          placeholder:text-slate-400"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!chatInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-teal-600
                          hover:bg-teal-700 disabled:bg-slate-200 dark:disabled:bg-slate-700
                          text-white disabled:text-slate-400 transition-colors text-sm font-medium"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="hidden sm:flex flex-1 items-center justify-center
                    bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400"
                  >
                    <div className="text-center">
                      <p className="text-3xl mb-2">💬</p>
                      <p className="text-sm">Select a conversation</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ INSTRUCTORS ══════════════════════════════════════════════════ */}
            {activeTab === "instructors" && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  👨‍🏫 My Teachers & Instructors
                </h2>
                {instructors.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-3xl mb-2">👨‍🏫</p>
                    <p className="text-sm">
                      No instructors linked to your courses yet
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {instructors.map((ins) => (
                      <div
                        key={ins.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl
                          shadow-sm p-5 flex items-start gap-4"
                      >
                        <div
                          className="w-12 h-12 rounded-xl bg-gradient-to-br
                          from-indigo-500 to-violet-600 flex items-center justify-center
                          text-white font-black text-lg shrink-0"
                        >
                          {initial(ins.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            {ins.full_name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            @{ins.username}
                            {ins.instructor_type &&
                              ` · ${ins.instructor_type} instructor`}
                          </p>
                          {ins.course_titles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {ins.course_titles.map((t) => (
                                <span
                                  key={t}
                                  className="text-xs bg-teal-50 dark:bg-teal-900/30
                                    text-teal-700 dark:text-teal-300
                                    px-2 py-0.5 rounded-full"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              // Start chat with this instructor
                              setActiveThread({
                                user_id: ins.id,
                                name: ins.full_name,
                                role: ins.instructor_type ?? "instructor",
                                unread: 0,
                              });
                              setActiveTab("chat");
                            }}
                            className="mt-3 flex items-center gap-1.5 text-xs
                              font-semibold text-teal-600 dark:text-teal-400
                              hover:underline"
                          >
                            💬 Send message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/drop history */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 mt-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-sm">
                    🔄 Add / Drop History
                  </h3>
                  {allEnrollments.flatMap((e) => e.drop_history ?? [])
                    .length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No add/drop activity yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allEnrollments
                        .flatMap((e) =>
                          (e.drop_history ?? []).map((ev, i) => ({
                            ...ev,
                            key: `${e.id}-${i}`,
                            term: e.term,
                            year: e.academic_year,
                          })),
                        )
                        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                        .map((ev) => (
                          <div
                            key={ev.key}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl
                            bg-slate-50 dark:bg-slate-700/40"
                          >
                            <span
                              className={`text-sm ${ev.action === "add" ? "text-emerald-500" : "text-red-400"}`}
                            >
                              {ev.action === "add" ? "➕" : "➖"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {ev.action === "add" ? "Added" : "Dropped"}:{" "}
                                {ev.course_title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {(ev as any).term} · {(ev as any).year}
                              </p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {fmtDate(ev.timestamp)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentDashboard;
