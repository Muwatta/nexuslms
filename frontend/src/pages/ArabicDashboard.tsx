// frontend/src/pages/ArabicDashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

const DEPT = "arabic";
const A = {
  emerald: "#10b981",
  teal: "#14b8a6",
  amber: "#f59e0b",
  rose: "#fb7185",
};
const heroBg = "linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)";
const dotPat = {
  backgroundImage:
    "radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)",
  backgroundSize: "28px 28px",
};

const ARABIC_CLASSES = [
  ["ibtidaai_1", "الصف الأول الابتدائي"],
  ["ibtidaai_2", "الصف الثاني الابتدائي"],
  ["ibtidaai_3", "الصف الثالث الابتدائي"],
  ["ibtidaai_4", "الصف الرابع الابتدائي"],
  ["ibtidaai_5", "الصف الخامس الابتدائي"],
  ["ibtidaai_6", "الصف السادس الابتدائي"],
  ["mutawassit_1", "الصف الأول المتوسط"],
  ["mutawassit_2", "الصف الثاني المتوسط"],
  ["mutawassit_3", "الصف الثالث المتوسط"],
  ["thanawi_1", "الصف الأول الثانوي"],
  ["thanawi_2", "الصف الثاني الثانوي"],
  ["thanawi_3", "الصف الثالث الثانوي"],
];

const PUB_TERMS = ["First Term", "Second Term", "Third Term"];
const PUB_YEARS = Array.from({ length: 8 }, (_, i) => {
  const y = new Date().getFullYear() + 2 - i;
  return `${y}/${y + 1}`;
});
const getCurrentYear = () => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};

const GRADE_BG: Record<string, string> = {
  A: "#dcfce7",
  B: "#dbeafe",
  C: "#fef9c3",
  D: "#ffedd5",
  E: "#fee2e2",
  F: "#fecaca",
};
const GRADE_FG: Record<string, string> = {
  A: "#15803d",
  B: "#1d4ed8",
  C: "#a16207",
  D: "#c2410c",
  E: "#b91c1c",
  F: "#991b1b",
};

type Tab = "overview" | "students" | "teachers" | "publish";

const ArabicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [pubClass, setPubClass] = useState("");
  const [pubTerm, setPubTerm] = useState("First Term");
  const [pubYear, setPubYear] = useState(getCurrentYear);
  const [pubResults, setPubResults] = useState<any[]>([]);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubLoaded, setPubLoaded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get("/profiles/", { params: { department: DEPT, page_size: 200 } }),
      api.get("/courses/", { params: { department: DEPT, page_size: 500 } }),
    ])
      .then(([pRes, cRes]) => {
        if (pRes.status === "fulfilled")
          setProfiles(
            Array.isArray(pRes.value.data)
              ? pRes.value.data
              : (pRes.value.data?.results ?? []),
          );
        if (cRes.status === "fulfilled")
          setCourses(
            Array.isArray(cRes.value.data)
              ? cRes.value.data
              : (cRes.value.data?.results ?? []),
          );
      })
      .finally(() => setLoading(false));
  }, []);

  const loadPubResults = useCallback(async () => {
    if (!pubClass) {
      setPubError("Select a class first");
      return;
    }
    setPubLoading(true);
    setPubLoaded(false);
    setPubResults([]);
    setPubError(null);
    try {
      const r = await api.get("/results/", {
        params: {
          student_class: pubClass,
          term: pubTerm,
          academic_year: pubYear,
          page_size: 500,
        },
      });
      setPubResults(Array.isArray(r.data) ? r.data : (r.data?.results ?? []));
      setPubLoaded(true);
    } catch {
      setPubError("Failed to load results");
    } finally {
      setPubLoading(false);
    }
  }, [pubClass, pubTerm, pubYear]);

  const publishAll = useCallback(async () => {
    const toPublish = pubResults.filter((r: any) =>
      ["reviewed", "submitted"].includes(r.status),
    );
    if (!toPublish.length) {
      setPubError("No reviewed/submitted results to publish");
      return;
    }
    setPublishing(true);
    try {
      await Promise.allSettled(
        toPublish.map((r: any) => api.post(`/results/${r.id}/publish/`)),
      );
      await api
        .post("/report-cards/generate/", {
          student_class: pubClass,
          term: pubTerm,
          academic_year: pubYear,
        })
        .catch(() => {});
      loadPubResults();
    } catch {
      setPubError("Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [pubResults, pubClass, pubTerm, pubYear, loadPubResults]);

  const students = profiles.filter((p) => p.role === "student");
  const teachers = profiles.filter((p) =>
    ["teacher", "instructor"].includes(p.role),
  );
  const getName = (p: any) =>
    `${p.user?.first_name ?? ""} ${p.user?.last_name ?? ""}`.trim() ||
    p.user?.username ||
    "—";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "📊 Overview" },
    { id: "students", label: `🎓 Students (${students.length})` },
    { id: "teachers", label: `👨‍🏫 Teachers (${teachers.length})` },
    { id: "publish", label: "📝 Publish Results" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div
        className="relative overflow-hidden px-6 py-10"
        style={{ background: heroBg }}
      >
        <div className="absolute inset-0" style={dotPat} />
        <div className="relative max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              🕌
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Arabic / Islamic Studies
              </h1>
              <p className="text-emerald-200 text-sm">
                {students.length} students · {teachers.length} teachers ·{" "}
                {courses.length} courses
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/manage-users")}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              👥 Manage Users
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: A.amber + "20",
                color: A.amber,
                border: `1px solid ${A.amber}35`,
              }}
            >
              📚 Courses
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap
                ${activeTab === t.id ? "" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              style={
                activeTab === t.id
                  ? { borderColor: A.emerald, color: A.emerald }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      📖 Recent Courses
                    </h2>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: A.emerald }}
                    >
                      View all →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {courses.slice(0, 8).map((c) => (
                      <div
                        key={c.id}
                        className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate"
                            dir="rtl"
                          >
                            {c.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.student_class}
                          </p>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={{
                            background: A.emerald + "15",
                            color: A.emerald,
                          }}
                        >
                          Active
                        </span>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <p className="text-center py-10 text-slate-400 text-sm">
                        No courses yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      📊 Stats
                    </p>
                    {[
                      {
                        label: "Students",
                        value: students.length,
                        color: A.emerald,
                      },
                      {
                        label: "Teachers",
                        value: teachers.length,
                        color: A.amber,
                      },
                      {
                        label: "Courses",
                        value: courses.length,
                        color: A.teal,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
                      >
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {s.label}
                        </span>
                        <span
                          className="font-black text-lg"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      ⚡ Quick Actions
                    </p>
                    {[
                      {
                        label: "Publish Results",
                        icon: "📝",
                        action: () => setActiveTab("publish"),
                      },
                      {
                        label: "Add Student",
                        icon: "➕",
                        action: () => navigate("/manage-users"),
                      },
                      {
                        label: "Assignments",
                        icon: "📋",
                        action: () => navigate("/assignments"),
                      },
                    ].map((a) => (
                      <button
                        key={a.label}
                        onClick={a.action}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>{a.icon}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS / TEACHERS */}
            {(activeTab === "students" || activeTab === "teachers") &&
              (() => {
                const list = activeTab === "students" ? students : teachers;
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {list.length} {activeTab} in Arabic/Islamic Studies
                        department
                      </p>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800 text-white text-xs">
                        <tr>
                          <th className="px-5 py-3 text-left">#</th>
                          <th className="px-5 py-3 text-left">Name</th>
                          <th className="px-5 py-3 text-left">Username</th>
                          <th className="px-5 py-3 text-left">Class / Type</th>
                          <th className="px-5 py-3 text-left">Student ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {list.map((p: any, i: number) => (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/20"}`}
                          >
                            <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                              {i + 1}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                  style={{
                                    background: `linear-gradient(135deg,${A.emerald},${A.teal})`,
                                  }}
                                >
                                  {(
                                    p.user?.first_name?.[0] ??
                                    p.user?.username?.[0] ??
                                    "?"
                                  ).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-100">
                                  {getName(p)}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-400">
                              @{p.user?.username}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  background: A.emerald + "15",
                                  color: A.emerald,
                                }}
                              >
                                {p.student_class
                                  ? p.class_section
                                    ? `${p.student_class} (${p.class_section})`
                                    : p.student_class
                                  : p.teacher_type || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-400">
                              {p.student_id || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {list.length === 0 && (
                      <p className="text-center py-12 text-slate-400 text-sm">
                        No {activeTab} found
                      </p>
                    )}
                  </div>
                );
              })()}

            {/* PUBLISH RESULTS */}
            {activeTab === "publish" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600">
                    <h3 className="font-black text-white">
                      📝 Publish Results
                    </h3>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      Select class + term + session → publish to students
                    </p>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Class *
                      </label>
                      <select
                        value={pubClass}
                        onChange={(e) => {
                          setPubClass(e.target.value);
                          setPubLoaded(false);
                          setPubError(null);
                        }}
                        className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">— Select class —</option>
                        {ARABIC_CLASSES.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Term *
                      </label>
                      <select
                        value={pubTerm}
                        onChange={(e) => {
                          setPubTerm(e.target.value);
                          setPubLoaded(false);
                        }}
                        className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        {PUB_TERMS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Session *
                      </label>
                      <select
                        value={pubYear}
                        onChange={(e) => {
                          setPubYear(e.target.value);
                          setPubLoaded(false);
                        }}
                        className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
                        className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
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

                {pubError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    ❌ {pubError}
                  </div>
                )}

                {pubLoaded &&
                  (() => {
                    const draft = pubResults.filter(
                      (r: any) => r.status === "draft",
                    ).length;
                    const sub = pubResults.filter(
                      (r: any) => r.status === "submitted",
                    ).length;
                    const rev = pubResults.filter(
                      (r: any) => r.status === "reviewed",
                    ).length;
                    const pub = pubResults.filter(
                      (r: any) => r.status === "published",
                    ).length;
                    const can = rev + sub;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              l: "Draft",
                              n: draft,
                              bg: "bg-slate-100 dark:bg-slate-700",
                              fg: "text-slate-600 dark:text-slate-300",
                            },
                            {
                              l: "Submitted",
                              n: sub,
                              bg: "bg-amber-50 dark:bg-amber-900/20",
                              fg: "text-amber-700 dark:text-amber-300",
                            },
                            {
                              l: "Reviewed",
                              n: rev,
                              bg: "bg-emerald-50 dark:bg-emerald-900/20",
                              fg: "text-emerald-700 dark:text-emerald-300",
                            },
                            {
                              l: "Published",
                              n: pub,
                              bg: "bg-green-50 dark:bg-green-900/20",
                              fg: "text-green-700 dark:text-green-300",
                            },
                          ].map((s) => (
                            <div
                              key={s.l}
                              className={`${s.bg} rounded-xl p-4 text-center`}
                            >
                              <p className={`text-3xl font-black ${s.fg}`}>
                                {s.n}
                              </p>
                              <p
                                className={`text-xs font-semibold mt-1 ${s.fg}`}
                              >
                                {s.l}
                              </p>
                            </div>
                          ))}
                        </div>
                        {can > 0 ? (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-amber-800 dark:text-amber-200">
                                {can} results ready to publish
                              </p>
                              <p className="text-sm text-amber-600 dark:text-amber-300 mt-0.5">
                                Scores visible immediately. Report cards
                                auto-generated.
                              </p>
                            </div>
                            <button
                              onClick={publishAll}
                              disabled={publishing}
                              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center gap-2 shrink-0 transition-colors"
                            >
                              {publishing ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Publishing…
                                </>
                              ) : (
                                `🚀 Publish All (${can})`
                              )}
                            </button>
                          </div>
                        ) : pub > 0 ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 text-center">
                            <p className="text-2xl mb-1">✅</p>
                            <p className="font-bold text-green-700 dark:text-green-300">
                              All {pub} results published
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center">
                            <p className="font-bold text-slate-600 dark:text-slate-300">
                              No reviewable results yet
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Teachers must enter and submit first
                            </p>
                          </div>
                        )}
                        {pubResults.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {pubResults.length} results · {pubTerm} ·{" "}
                                {pubYear}
                              </p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-800 text-white text-xs">
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
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {pubResults.map((r: any, i: number) => (
                                    <tr
                                      key={r.id}
                                      className={
                                        i % 2 === 0
                                          ? "bg-white dark:bg-slate-900"
                                          : "bg-slate-50 dark:bg-slate-800/50"
                                      }
                                    >
                                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {r.student_name ?? `#${r.student}`}
                                      </td>
                                      <td
                                        className="px-3 py-2.5 text-xs text-slate-500 max-w-[140px] truncate"
                                        dir="rtl"
                                      >
                                        {r.course_title ?? `#${r.course}`}
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-black text-slate-800 dark:text-slate-100">
                                        {r.total ?? "—"}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        {r.grade && (
                                          <span
                                            className="px-2 py-0.5 rounded-full text-xs font-black"
                                            style={{
                                              background:
                                                GRADE_BG[r.grade] ?? "#f3f4f6",
                                              color:
                                                GRADE_FG[r.grade] ?? "#374151",
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
                                              ? "bg-emerald-100 text-emerald-700"
                                              : r.status === "submitted"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-slate-100 text-slate-500"
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
                      </div>
                    );
                  })()}

                {!pubLoaded && !pubLoading && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center">
                    <p className="text-5xl mb-3">📊</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No results loaded
                    </p>
                    <p className="text-sm text-slate-400">
                      Select class, term and session then click Load Results
                    </p>
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

export default ArabicDashboard;
