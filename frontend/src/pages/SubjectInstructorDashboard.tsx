import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import AnimatedButton from "../components/AnimatedButton";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_id?: string;
  student_class?: string;
  department?: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface Course {
  id: number;
  title: string;
  description?: string;
  department?: string;
  student_class?: string;
  total_students?: number;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course: number;
  course_title?: string;
}

interface Enrollment {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  course: number;
  course_title: string;
  status: string;
}

type TabId = "assignments" | "subjects" | "students" | "results";

const TABS: { id: TabId; label: string }[] = [
  { id: "assignments", label: "📝 Assignments" },
  { id: "subjects", label: "📖 My Courses" },
  { id: "students", label: "👥 Students" },
  { id: "results", label: "📊 Results" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const SubjectInstructorDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("assignments");
  const [loading, setLoading] = useState(true);

  // Assignment form
  const [showForm, setShowForm] = useState(false);
  const [newAssign, setNewAssign] = useState({
    title: "",
    description: "",
    due_date: "",
    course: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Result scores keyed by enrollment id
  const [scores, setScores] = useState<
    Record<number, Partial<Record<string, number>>>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch all data ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, assignRes, courseRes, enrollRes] =
        await Promise.allSettled([
          // ✅ FIX 1: was /enrollments/ which returns enrollment.student as a plain
          //    ID integer — can't build a student list from that.
          //    /instructor/profiles/ returns full nested student profile objects
          //    already filtered to students enrolled in THIS instructor's courses.
          api.get("/instructor/profiles/"),

          // ✅ FIX 2: was /assignments/ (all system assignments).
          //    /instructor/assignments/ returns only this instructor's assignments.
          api.get("/instructor/assignments/"),

          api.get("/courses/"),

          // enrollments used in the Results tab for grading
          api.get("/instructor/results/"),
        ]);

      if (studRes.status === "fulfilled") {
        const d = studRes.value.data;
        setStudents(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (assignRes.status === "fulfilled") {
        const d = assignRes.value.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (courseRes.status === "fulfilled") {
        const d = courseRes.value.data;
        setCourses(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (enrollRes.status === "fulfilled") {
        const d = enrollRes.value.data;
        setEnrollments(Array.isArray(d) ? d : (d?.results ?? []));
      }
    } catch {
      notify(false, "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Create assignment ─────────────────────────────────────────────────
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssign.course) {
      notify(false, "Please select a course");
      return;
    }
    setSubmitting(true);
    try {
      // ✅ FIX 3: post to /instructor/assignments/ — the backend permission check
      //    ensures the instructor can only create for their own courses
      await api.post("/instructor/assignments/", {
        ...newAssign,
        course: Number(newAssign.course),
      });
      notify(true, "Assignment created successfully");
      setNewAssign({ title: "", description: "", due_date: "", course: "" });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      notify(
        false,
        err?.response?.data?.error ??
          err?.response?.data?.detail ??
          "Failed to create assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Save result ───────────────────────────────────────────────────────
  // ✅ FIX 4: was only console.log — now actually POSTs to the backend
  const handleSaveResult = async (enrollmentId: number) => {
    const payload = scores[enrollmentId];
    if (!payload || Object.keys(payload).length === 0) {
      notify(false, "Enter at least one score before saving");
      return;
    }
    setSavingId(enrollmentId);
    try {
      await api.post(
        `/instructor/results/${enrollmentId}/update_result/`,
        payload,
      );
      notify(true, "Result saved");
    } catch (err: any) {
      notify(false, err?.response?.data?.error ?? "Failed to save result");
    } finally {
      setSavingId(null);
    }
  };

  const setScore = (enrollId: number, field: string, raw: string) => {
    const num =
      raw === "" ? undefined : Math.min(100, Math.max(0, Number(raw)));
    setScores((prev) => ({
      ...prev,
      [enrollId]: { ...prev[enrollId], [field]: num },
    }));
  };

  const fullName = (s: Student) =>
    `${s.user.first_name} ${s.user.last_name}`.trim() || s.user.username;

  const initial = (s: Student) =>
    (s.user.first_name?.[0] ?? s.user.username[0]).toUpperCase();

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent
            rounded-full animate-spin mx-auto mb-3"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📚 Subject Instructor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your courses, assignments, and students
          </p>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-lg text-sm font-medium
                ${
                  toast.ok
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                }`}
            >
              {toast.ok ? "✅" : "❌"} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-lg font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              {tab.label}
              {tab.id === "students" && ` (${students.length})`}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            {/* ── ASSIGNMENTS ─────────────────────────────────────────── */}
            {activeTab === "assignments" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    📝 Assignments
                  </h2>
                  <AnimatedButton
                    variant="primary"
                    icon={showForm ? "✕" : "➕"}
                    onClick={() => setShowForm((v) => !v)}
                  >
                    {showForm ? "Cancel" : "New Assignment"}
                  </AnimatedButton>
                </div>

                <AnimatePresence>
                  {showForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateAssignment}
                      className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg
                        space-y-3 overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Assignment Title *"
                        value={newAssign.title}
                        required
                        onChange={(e) =>
                          setNewAssign((p) => ({ ...p, title: e.target.value }))
                        }
                        className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={newAssign.description}
                        rows={3}
                        onChange={(e) =>
                          setNewAssign((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newAssign.due_date}
                          required
                          onChange={(e) =>
                            setNewAssign((p) => ({
                              ...p,
                              due_date: e.target.value,
                            }))
                          }
                          className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                        />
                        <select
                          value={newAssign.course}
                          required
                          onChange={(e) =>
                            setNewAssign((p) => ({
                              ...p,
                              course: e.target.value,
                            }))
                          }
                          className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                        >
                          <option value="">— Select course —</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <AnimatedButton
                        variant="success"
                        type="submit"
                        icon="✓"
                        disabled={submitting}
                      >
                        {submitting ? "Creating…" : "Create Assignment"}
                      </AnimatedButton>
                    </motion.form>
                  )}
                </AnimatePresence>

                {assignments.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No assignments created yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((a) => (
                      <motion.div
                        key={a.id}
                        whileHover={{ x: 5 }}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {a.title}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                              {a.course_title ?? `Course #${a.course}`}
                            </p>
                            {a.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {a.description}
                              </p>
                            )}
                          </div>
                          {a.due_date && (
                            <span
                              className="shrink-0 text-xs bg-amber-100
                              dark:bg-amber-900/40 text-amber-700 dark:text-amber-300
                              px-2 py-1 rounded-full whitespace-nowrap"
                            >
                              Due {new Date(a.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── COURSES ─────────────────────────────────────────────── */}
            {activeTab === "subjects" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📖 My Courses
                </h2>
                {courses.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No courses assigned yet.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {courses.map((c) => (
                      <motion.div
                        key={c.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {c.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {c.description || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {c.department && (
                            <span
                              className="text-xs bg-blue-100 dark:bg-blue-900/40
                              text-blue-700 dark:text-blue-300 px-2 py-1 rounded capitalize"
                            >
                              {c.department}
                            </span>
                          )}
                          {c.student_class && (
                            <span
                              className="text-xs bg-violet-100 dark:bg-violet-900/40
                              text-violet-700 dark:text-violet-300 px-2 py-1 rounded"
                            >
                              {c.student_class}
                            </span>
                          )}
                          <span
                            className="text-xs bg-gray-200 dark:bg-gray-600
                            text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                          >
                            {c.total_students ?? 0} students
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STUDENTS ─────────────────────────────────────────────── */}
            {activeTab === "students" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  👥 My Students
                </h2>

                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">👨‍🎓</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      No students enrolled in your courses yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {["Name", "Student ID", "Username", "Class"].map(
                            (h) => (
                              <th
                                key={h}
                                className="text-left py-3 px-3 font-medium
                              text-gray-700 dark:text-gray-300"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full
                                  bg-gradient-to-br from-blue-500 to-indigo-600
                                  flex items-center justify-center text-white
                                  font-bold text-xs shrink-0"
                                >
                                  {initial(s)}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {fullName(s)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-gray-400">
                              {s.student_id ?? "—"}
                            </td>
                            <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                              @{s.user.username}
                            </td>
                            <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
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

            {/* ── RESULTS ──────────────────────────────────────────────── */}
            {activeTab === "results" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📊 Student Results
                </h2>

                {enrollments.length === 0 ? (
                  <p className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No enrollments to grade yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {[
                            "Student",
                            "Course",
                            "1st Test",
                            "2nd Test",
                            "Attendance",
                            "Assignment",
                            "",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left py-3 px-3 font-medium
                              text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {enrollments.map((enr) => {
                          const sc = scores[enr.id] ?? {};
                          const isSaving = savingId === enr.id;
                          return (
                            <tr
                              key={enr.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td
                                className="py-3 px-3 font-medium text-gray-900
                                dark:text-white whitespace-nowrap"
                              >
                                {enr.student_name}
                              </td>
                              <td
                                className="py-3 px-3 text-xs text-gray-500
                                dark:text-gray-400 whitespace-nowrap"
                              >
                                {enr.course_title}
                              </td>
                              {[
                                "first_test_score",
                                "second_test_score",
                                "attendance_score",
                                "assignment_score",
                              ].map((field) => (
                                <td key={field} className="py-3 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="—"
                                    value={sc[field] ?? ""}
                                    onChange={(e) =>
                                      setScore(enr.id, field, e.target.value)
                                    }
                                    className="w-16 p-1 text-center border rounded
                                      dark:bg-gray-700 dark:text-white
                                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                              ))}
                              <td className="py-3 px-3">
                                <AnimatedButton
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleSaveResult(enr.id)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? "Saving…" : "💾 Save"}
                                </AnimatedButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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

export default SubjectInstructorDashboard;
