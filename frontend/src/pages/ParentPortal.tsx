// frontend/src/pages/ParentPortal.tsx
// Parent can view their child's results, report cards, assignments and attendance.

import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

interface Child {
  id: number;
  student_id: string;
  student_class: string;
  department: string;
  user: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  };
}
interface Result {
  id: number;
  course_title: string;
  term: string;
  academic_year: string;
  test1: number;
  test2: number;
  assignment: number;
  midterm: number;
  ca_total: number;
  exam: number;
  total: number;
  grade: string;
  position: number | null;
  remark: string;
  status: string;
}
interface ReportCard {
  id: number;
  term: string;
  academic_year: string;
  student_class: string;
  average_score: number;
  position_in_class: number | null;
  class_size: number;
  total_score: number;
  is_published: boolean;
  remarks: string;
}
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course_title?: string;
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

const TERMS = ["First Term", "Second Term", "Third Term"];
const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() + 1 - i;
  return `${y}/${y + 1}`;
});
const getCurrentYear = () => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};

const ParentPortal: React.FC = () => {
  const userData = getUserData();
  const parentName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName ?? ""}`.trim()
    : (userData?.username ?? "Parent");

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("First Term");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [activeTab, setActiveTab] = useState<
    "results" | "report" | "assignments"
  >("results");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load children ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api
      .get("/profiles/", { params: { role: "student", page_size: 200 } })
      .then((r) => {
        const d = r.data;
        const list: Child[] = Array.isArray(d) ? d : (d?.results ?? []);
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch(() =>
        notify(
          false,
          "Failed to load children. Check parent_email is set on student profiles.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // ── Load results for selected child ──────────────────────────────────────
  const loadResults = useCallback(async () => {
    if (!selectedChild) return;
    setResultsLoading(true);
    try {
      const [resRes, cardRes, assignRes] = await Promise.allSettled([
        api.get("/results/", {
          params: {
            student: selectedChild.id,
            term: selectedTerm,
            academic_year: selectedYear,
            page_size: 200,
          },
        }),
        api.get("/report-cards/", {
          params: {
            student: selectedChild.id,
            term: selectedTerm,
            academic_year: selectedYear,
          },
        }),
        api.get("/assignments/", {
          params: { student_class: selectedChild.student_class, page_size: 50 },
        }),
      ]);
      if (resRes.status === "fulfilled") {
        const d = resRes.value.data;
        setResults(
          (Array.isArray(d) ? d : (d?.results ?? [])).filter(
            (r: any) => r.status === "published",
          ),
        );
      }
      if (cardRes.status === "fulfilled") {
        const d = cardRes.value.data;
        setReportCards(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (assignRes.status === "fulfilled") {
        const d = assignRes.value.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      }
    } catch {
      notify(false, "Failed to load child data");
    } finally {
      setResultsLoading(false);
    }
  }, [selectedChild, selectedTerm, selectedYear]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const childName = (c: Child) =>
    `${c.user.first_name} ${c.user.last_name}`.trim() || c.user.username;
  const reportCard = reportCards[0] ?? null;
  const totalScore = results.reduce((s, r) => s + r.total, 0);
  const avgScore = results.length ? totalScore / results.length : 0;

  const ordinal = (n: number) =>
    n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium
              ${toast.ok ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {toast.ok ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-600 text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-teal-200">Parent Portal</p>
            <h1 className="text-2xl font-black mt-0.5">
              Welcome, {parentName}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-teal-200">
              {children.length} child{children.length !== 1 ? "ren" : ""}{" "}
              registered
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
            <p className="text-5xl mb-4">👨‍👩‍👧</p>
            <p className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-2">
              No children linked
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Ask the school admin to add your email address to your child's
              profile under "Parent Email".
            </p>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChild(c)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm
                      ${
                        selectedChild?.id === c.id
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-teal-300"
                      }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                      {(
                        c.user.first_name?.[0] ?? c.user.username[0]
                      ).toUpperCase()}
                    </div>
                    {childName(c)}
                  </button>
                ))}
              </div>
            )}

            {selectedChild && (
              <>
                {/* Child info card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-black shrink-0">
                      {(
                        selectedChild.user.first_name?.[0] ??
                        selectedChild.user.username[0]
                      ).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {childName(selectedChild)}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2.5 py-0.5 rounded-full font-semibold">
                          {selectedChild.student_id}
                        </span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                          {selectedChild.student_class?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full capitalize">
                          {selectedChild.department}
                        </span>
                      </div>
                    </div>
                    {/* Quick stats */}
                    {results.length > 0 && (
                      <div className="flex gap-4 text-center shrink-0">
                        <div>
                          <p className="text-2xl font-black text-teal-600">
                            {avgScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-400">Average</p>
                        </div>
                        {reportCard?.position_in_class && (
                          <div>
                            <p className="text-2xl font-black text-blue-600">
                              {reportCard.position_in_class}
                              <sup className="text-sm">
                                {ordinal(reportCard.position_in_class)}
                              </sup>
                            </p>
                            <p className="text-xs text-gray-400">Position</p>
                          </div>
                        )}
                        <div>
                          <p className="text-2xl font-black text-gray-700 dark:text-gray-200">
                            {results.length}
                          </p>
                          <p className="text-xs text-gray-400">Subjects</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Term/Year selector */}
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {resultsLoading && (
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </span>
                  )}
                </div>

                {/* Tab navigation */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 pt-2 gap-1">
                    {[
                      { id: "results", label: "📊 Results" },
                      { id: "report", label: "📋 Report Card" },
                      { id: "assignments", label: "📝 Assignments" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors -mb-px
                          ${
                            activeTab === t.id
                              ? "bg-white dark:bg-gray-900 border border-b-white dark:border-gray-700 dark:border-b-gray-900 text-teal-600 dark:text-teal-400"
                              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {/* RESULTS TAB */}
                    {activeTab === "results" &&
                      (results.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-4xl mb-3">📊</p>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">
                            No published results for {selectedTerm}{" "}
                            {selectedYear}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Results appear here once teachers enter and admin
                            publishes them
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-800 text-white text-xs">
                              <tr>
                                <th className="px-3 py-3 text-left">Subject</th>
                                <th className="px-2 py-3 text-center">1st</th>
                                <th className="px-2 py-3 text-center">2nd</th>
                                <th className="px-2 py-3 text-center">Assg</th>
                                <th className="px-2 py-3 text-center">Mid</th>
                                <th className="px-2 py-3 text-center">CA</th>
                                <th className="px-2 py-3 text-center">Exam</th>
                                <th className="px-2 py-3 text-center font-bold">
                                  Total
                                </th>
                                <th className="px-2 py-3 text-center">Grd</th>
                                <th className="px-2 py-3 text-center">Pos</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {results.map((r, i) => (
                                <tr
                                  key={r.id}
                                  className={
                                    i % 2 === 0
                                      ? "bg-white dark:bg-gray-900"
                                      : "bg-gray-50 dark:bg-gray-800/50"
                                  }
                                >
                                  <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200 max-w-[160px] truncate">
                                    {r.course_title}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-gray-500">
                                    {r.test1}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-gray-500">
                                    {r.test2}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-gray-500">
                                    {r.assignment}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-gray-500">
                                    {r.midterm}
                                  </td>
                                  <td className="px-2 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                                    {r.ca_total}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-gray-500">
                                    {r.exam}
                                  </td>
                                  <td className="px-2 py-2.5 text-center font-black text-gray-900 dark:text-white">
                                    {r.total}
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
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
                                  <td className="px-2 py-2.5 text-center text-xs text-gray-400">
                                    {r.position
                                      ? `${r.position}${ordinal(r.position)}`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                              <tr>
                                <td
                                  className="px-3 py-2.5 font-bold text-gray-700 dark:text-gray-200"
                                  colSpan={6}
                                >
                                  Total ({results.length} subjects)
                                </td>
                                <td className="px-2 py-2.5 text-center font-black text-teal-600 text-base">
                                  {totalScore.toFixed(0)}
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold text-gray-600 text-xs">
                                  Avg: {avgScore.toFixed(1)}
                                </td>
                                <td colSpan={2} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}

                    {/* REPORT CARD TAB */}
                    {activeTab === "report" &&
                      (!reportCard ? (
                        <div className="text-center py-12">
                          <p className="text-4xl mb-3">📋</p>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">
                            No report card for {selectedTerm} {selectedYear}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Generated after results are published and positions
                            computed
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Report header */}
                          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-5 text-white">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                              <div>
                                <p className="text-xs text-teal-100 uppercase tracking-wider">
                                  Term Report Card
                                </p>
                                <h3 className="text-xl font-black mt-0.5">
                                  {reportCard.term} · {reportCard.academic_year}
                                </h3>
                                <p className="text-sm text-teal-100 mt-1">
                                  Class:{" "}
                                  {reportCard.student_class?.replace(/_/g, " ")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-black">
                                  {reportCard.average_score.toFixed(1)}
                                </p>
                                <p className="text-xs text-teal-200">
                                  Average Score
                                </p>
                                {reportCard.position_in_class && (
                                  <p className="text-sm font-bold mt-1">
                                    🏆 {reportCard.position_in_class}
                                    {ordinal(
                                      reportCard.position_in_class,
                                    )} of {reportCard.class_size}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Remarks */}
                          {reportCard.remarks && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3">
                              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                Teacher's Remarks
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {reportCard.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === "assignments" &&
                      (assignments.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-4xl mb-3">📝</p>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">
                            No assignments found
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {assignments.map((a) => {
                            const isDue =
                              a.due_date && new Date(a.due_date) < new Date();
                            return (
                              <div
                                key={a.id}
                                className="flex items-start justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                                    {a.title}
                                  </p>
                                  {a.course_title && (
                                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                                      {a.course_title}
                                    </p>
                                  )}
                                  {a.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                      {a.description}
                                    </p>
                                  )}
                                </div>
                                {a.due_date && (
                                  <span
                                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap
                                    ${isDue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}
                                  >
                                    {isDue ? "⏰ Overdue" : "Due"}{" "}
                                    {new Date(a.due_date).toLocaleDateString(
                                      "en-GB",
                                      { day: "numeric", month: "short" },
                                    )}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;
