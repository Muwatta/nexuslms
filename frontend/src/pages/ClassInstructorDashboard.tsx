// frontend/src/pages/ClassInstructorDashboard.tsx
// Class teacher dashboard — Edves-style with TeacherLayout sidebar.
// Responsibilities: review submitted results, generate report cards, manage class.

import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";
import TeacherLayout from "../components/TeacherLayout";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_id: string;
  student_class: string;
  user: { first_name: string; last_name: string; username: string };
}
interface ResultRecord {
  id: number;
  student: number;
  student_name: string;
  course: number;
  course_title: string;
  term: string;
  academic_year: string;
  test1: number;
  test2: number;
  assignment: number;
  midterm: number;
  exam: number;
  ca_total: number;
  total: number;
  grade: string;
  status: "draft" | "submitted" | "reviewed" | "published";
  remark: string;
  position: number | null;
}
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course: any;
}

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

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  submitted:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  published:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const getCurrentYear = () => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};
const TERMS = ["First Term", "Second Term", "Third Term"];
const YEARS = Array.from({ length: 8 }, (_, i) => {
  const y = new Date().getFullYear() + 2 - i;
  return `${y}/${y + 1}`;
});

// ── Component ─────────────────────────────────────────────────────────────────
const ClassInstructorDashboard: React.FC = () => {
  const userData = getUserData();
  const dept = userData?.department ?? "western";

  const [activeSection, setActiveSection] = useState<
    "overview" | "review" | "students" | "assignments"
  >("overview");

  // Filters
  const [filterTerm, setFilterTerm] = useState("First Term");
  const [filterYear, setFilterYear] = useState(getCurrentYear());
  const [filterClass, setFilterClass] = useState("");

  // Data
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Actions
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [newAssign, setNewAssign] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [submittingA, setSubmittingA] = useState(false);

  // Available classes from results
  const [classOptions, setClassOptions] = useState<string[]>([]);

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Fetch results ─────────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        term: filterTerm,
        academic_year: filterYear,
        page_size: "500",
      };
      if (filterClass) params.student_class = filterClass;
      const [resRes, studRes, assignRes] = await Promise.allSettled([
        api.get("/results/", { params }),
        api.get("/profiles/", {
          params: { role: "student", department: dept, page_size: "200" },
        }),
        api.get("/assignments/", { params: { page_size: "200" } }),
      ]);
      if (resRes.status === "fulfilled") {
        const d = resRes.value.data;
        const list: ResultRecord[] = Array.isArray(d) ? d : (d?.results ?? []);
        setResults(list);
        // Extract unique classes
        const classes = Array.from(
          new Set(list.map((r: any) => r.student_class).filter(Boolean)),
        ) as string[];
        setClassOptions(classes);
        if (!filterClass && classes.length > 0) setFilterClass(classes[0]);
      }
      if (studRes.status === "fulfilled") {
        const d = studRes.value.data;
        setStudents(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (assignRes.status === "fulfilled") {
        const d = assignRes.value.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      }
    } catch {
      notify(false, "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filterTerm, filterYear, filterClass, dept]);

  useEffect(() => {
    fetchResults();
  }, [filterTerm, filterYear, dept]);

  // ── Review single result ──────────────────────────────────────────────────
  const handleReview = async (id: number) => {
    setReviewingId(id);
    try {
      await api.post(`/results/${id}/review/`);
      notify(true, "Result reviewed ✅");
      fetchResults();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Review failed");
    } finally {
      setReviewingId(null);
    }
  };

  // ── Review all submitted ──────────────────────────────────────────────────
  const handleReviewAll = async () => {
    const submitted = results.filter((r) => r.status === "submitted");
    if (submitted.length === 0) {
      notify(false, "No submitted results to review");
      return;
    }
    setReviewingId(-1);
    try {
      await Promise.allSettled(
        submitted.map((r) => api.post(`/results/${r.id}/review/`)),
      );
      notify(true, `✅ ${submitted.length} results reviewed`);
      fetchResults();
    } catch {
      notify(false, "Some reviews failed");
    } finally {
      setReviewingId(null);
    }
  };

  // ── Generate report cards ─────────────────────────────────────────────────
  const handleGenerateReportCards = async () => {
    const cls = filterClass || classOptions[0];
    if (!cls) {
      notify(false, "No class found — filter by class first");
      return;
    }
    setGenerating(true);
    try {
      await api.post("/report-cards/generate/", {
        student_class: cls,
        term: filterTerm,
        academic_year: filterYear,
      });
      notify(true, "📋 Report cards generated successfully");
    } catch (e: any) {
      notify(
        false,
        e?.response?.data?.detail ?? "Failed to generate report cards",
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── Create assignment ─────────────────────────────────────────────────────
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingA(true);
    try {
      await api.post("/assignments/", newAssign);
      notify(true, "Assignment created ✅");
      setNewAssign({ title: "", description: "", due_date: "" });
      setShowAssign(false);
      fetchResults();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmittingA(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const draftCount = results.filter((r) => r.status === "draft").length;
  const submittedCount = results.filter((r) => r.status === "submitted").length;
  const reviewedCount = results.filter((r) => r.status === "reviewed").length;
  const publishedCount = results.filter((r) => r.status === "published").length;

  // Group results by student name
  const resultsByStudent: Record<string, ResultRecord[]> = {};
  results.forEach((r) => {
    const key = r.student_name || `Student #${r.student}`;
    if (!resultsByStudent[key]) resultsByStudent[key] = [];
    resultsByStudent[key].push(r);
  });

  const studentName = (s: Student) =>
    `${s.user.first_name} ${s.user.last_name}`.trim() || s.user.username;

  return (
    <TeacherLayout
      activeSection={activeSection}
      onSectionChange={(s) => setActiveSection(s as any)}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium max-w-xs
              ${toast.ok ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {toast.ok ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section nav */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex gap-2 flex-wrap">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "review", label: "✅ Review Results" },
          { id: "students", label: "👥 My Students" },
          { id: "assignments", label: "📝 Assignments" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors
              ${activeSection === s.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700"}`}
          >
            {s.label}
            {s.id === "review" && submittedCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {submittedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
        {/* ══ OVERVIEW ════════════════════════════════════════════════════ */}
        {activeSection === "overview" && (
          <div className="space-y-5">
            {/* Filter row */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="font-black text-gray-900 dark:text-white mb-4">
                📊 Class Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Class
                  </label>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All classes</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Term
                  </label>
                  <select
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Session
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchResults}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {loading ? "Loading…" : "🔄 Refresh"}
                  </button>
                </div>
              </div>

              {/* Status summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Draft",
                    count: draftCount,
                    bg: "bg-gray-100 dark:bg-gray-700",
                    text: "text-gray-600 dark:text-gray-300",
                  },
                  {
                    label: "Submitted",
                    count: submittedCount,
                    bg: "bg-amber-50 dark:bg-amber-900/20",
                    text: "text-amber-700 dark:text-amber-300",
                  },
                  {
                    label: "Reviewed",
                    count: reviewedCount,
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                    text: "text-blue-700 dark:text-blue-300",
                  },
                  {
                    label: "Published",
                    count: publishedCount,
                    bg: "bg-green-50 dark:bg-green-900/20",
                    text: "text-green-700 dark:text-green-300",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`${s.bg} rounded-xl p-4 text-center`}
                  >
                    <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
                    <p className={`text-xs font-semibold mt-1 ${s.text}`}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReviewAll}
                disabled={submittedCount === 0 || reviewingId === -1}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {reviewingId === -1 ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Reviewing…
                  </>
                ) : (
                  `✅ Review All Submitted (${submittedCount})`
                )}
              </button>
              <button
                onClick={handleGenerateReportCards}
                disabled={generating || reviewedCount === 0}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  "📋 Generate Report Cards"
                )}
              </button>
              {reviewedCount > 0 && (
                <p className="text-xs text-gray-400 self-center">
                  {reviewedCount} results ready — ask admin to publish so
                  students can see them
                </p>
              )}
            </div>
          </div>
        )}

        {/* ══ REVIEW RESULTS ═════════════════════════════════════════════ */}
        {activeSection === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ✅ Review Results
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filterTerm} · {filterYear}
                  {submittedCount > 0 && (
                    <span className="ml-2 text-amber-600 font-semibold">
                      {submittedCount} awaiting review
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {submittedCount > 0 && (
                  <button
                    onClick={handleReviewAll}
                    disabled={reviewingId === -1}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {reviewingId === -1
                      ? "Reviewing…"
                      : `✅ Review All (${submittedCount})`}
                  </button>
                )}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  No results for {filterTerm} {filterYear}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Subject teachers need to enter and submit results first
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(resultsByStudent).map(
                  ([studentName, studentResults]) => {
                    const allReviewed = studentResults.every(
                      (r) =>
                        r.status === "reviewed" || r.status === "published",
                    );
                    const hasSubmitted = studentResults.some(
                      (r) => r.status === "submitted",
                    );
                    return (
                      <div
                        key={studentName}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Student header */}
                        <div
                          className={`flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800
                        ${allReviewed ? "bg-green-50 dark:bg-green-900/10" : hasSubmitted ? "bg-amber-50 dark:bg-amber-900/10" : "bg-gray-50 dark:bg-gray-800"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {studentName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {studentName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {studentResults.length} subject
                                {studentResults.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {allReviewed && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                All Reviewed ✅
                              </span>
                            )}
                            {hasSubmitted && !allReviewed && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                {
                                  studentResults.filter(
                                    (r) => r.status === "submitted",
                                  ).length
                                }{" "}
                                pending review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Results table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                              <tr>
                                <th className="px-4 py-2.5 text-left font-semibold">
                                  Subject
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  1st
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  2nd
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Assg
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Mid
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  CA
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Exam
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Total
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Grd
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Status
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {studentResults.map((r) => (
                                <tr
                                  key={r.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                                    {r.course_title}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                    {r.test1}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                    {r.test2}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                    {r.assignment}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                    {r.midterm}
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                                    {r.ca_total}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                    {r.exam}
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-black text-gray-900 dark:text-white">
                                    {r.total}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {r.grade && (
                                      <span
                                        className="px-2 py-0.5 rounded-full text-xs font-black"
                                        style={{
                                          background:
                                            GRADE_BG[r.grade] ?? "#f3f4f6",
                                          color: GRADE_FG[r.grade] ?? "#374151",
                                        }}
                                      >
                                        {r.grade}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[r.status] ?? ""}`}
                                    >
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {r.status === "submitted" && (
                                      <button
                                        onClick={() => handleReview(r.id)}
                                        disabled={reviewingId === r.id}
                                        className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 transition-colors"
                                      >
                                        {reviewingId === r.id ? "…" : "Review"}
                                      </button>
                                    )}
                                    {(r.status === "reviewed" ||
                                      r.status === "published") && (
                                      <span className="text-xs text-green-600 font-semibold">
                                        ✓
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ STUDENTS ══════════════════════════════════════════════════ */}
        {activeSection === "students" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              👥 My Students
            </h2>
            {students.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-4xl mb-2">👨‍🎓</p>
                <p className="text-gray-500 dark:text-gray-400">
                  No students found in your department
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {students.length} students · {dept} dept
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 dark:bg-gray-950 text-white text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Student ID</th>
                      <th className="px-4 py-3 text-left">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"}`}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(
                                s.user.first_name?.[0] ?? s.user.username[0]
                              ).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {studentName(s)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {s.student_id ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {s.student_class ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ ASSIGNMENTS ═══════════════════════════════════════════════ */}
        {activeSection === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📝 Assignments
              </h2>
              <button
                onClick={() => setShowAssign((v) => !v)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                  ${showAssign ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                {showAssign ? "✕ Cancel" : "+ New Assignment"}
              </button>
            </div>

            <AnimatePresence>
              {showAssign && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateAssignment}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Assignment title *"
                    required
                    value={newAssign.title}
                    onChange={(e) =>
                      setNewAssign((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    rows={3}
                    value={newAssign.description}
                    onChange={(e) =>
                      setNewAssign((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <input
                    type="date"
                    required
                    value={newAssign.due_date}
                    onChange={(e) =>
                      setNewAssign((p) => ({ ...p, due_date: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingA}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
                  >
                    {submittingA ? "Creating…" : "✓ Create Assignment"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {assignments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-4xl mb-2">📝</p>
                <p className="text-gray-500 dark:text-gray-400">
                  No assignments yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <motion.div
                    key={a.id}
                    whileHover={{ x: 3 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {a.title}
                        </p>
                        {a.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {a.description}
                          </p>
                        )}
                      </div>
                      {a.due_date && (
                        <span className="shrink-0 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                          Due{" "}
                          {new Date(a.due_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default ClassInstructorDashboard;
