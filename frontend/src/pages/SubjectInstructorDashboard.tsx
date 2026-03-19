// frontend/src/pages/SubjectInstructorDashboard.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import { AnimatePresence, motion } from "framer-motion";
import TeacherLayout from "../components/TeacherLayout";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Course {
  id: number;
  title: string;
  department?: string;
  student_class?: string;
}
interface StudentRow {
  profile_id: number;
  student_id: string;
  full_name: string;
  test1: number;
  test2: number;
  assignment: number;
  midterm: number;
  exam: number;
  total: number;
  grade: string;
  result_id: number | null;
  status: string;
}
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course: number;
  course_title?: string;
}

// ── Class label map ───────────────────────────────────────────────────────────
const CL: Record<string, string> = {
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
  ibtidaai_1: "الصف الأول الابتدائي",
  ibtidaai_2: "الصف الثاني الابتدائي",
  ibtidaai_3: "الصف الثالث الابتدائي",
  ibtidaai_4: "الصف الرابع الابتدائي",
  ibtidaai_5: "الصف الخامس الابتدائي",
  ibtidaai_6: "الصف السادس الابتدائي",
  mutawassit_1: "الصف الأول المتوسط",
  mutawassit_2: "الصف الثاني المتوسط",
  mutawassit_3: "الصف الثالث المتوسط",
  thanawi_1: "الصف الأول الثانوي",
  thanawi_2: "الصف الثاني الثانوي",
  thanawi_3: "الصف الثالث الثانوي",
  ai_ml_beginner: "AI & ML — Beginner",
  ai_ml_junior: "AI & ML — Junior",
  ai_ml_intermediate: "AI & ML — Intermediate",
  ai_ml_advanced: "AI & ML — Advanced",
  data_science_beginner: "Data Science — Beginner",
  data_science_junior: "Data Science — Junior",
  data_science_intermediate: "Data Science — Intermediate",
  data_science_advanced: "Data Science — Advanced",
  scratch_beginner: "Scratch — Beginner",
  scratch_junior: "Scratch — Junior",
  scratch_intermediate: "Scratch — Intermediate",
  scratch_advanced: "Scratch — Advanced",
  frontend_beginner: "Frontend — Beginner",
  frontend_junior: "Frontend — Junior",
  frontend_intermediate: "Frontend — Intermediate",
  frontend_advanced: "Frontend — Advanced",
  backend_beginner: "Backend — Beginner",
  backend_junior: "Backend — Junior",
  backend_intermediate: "Backend — Intermediate",
  backend_advanced: "Backend — Advanced",
  ai_automation_beginner: "AI Automation — Beginner",
  ai_automation_junior: "AI Automation — Junior",
  ai_automation_intermediate: "AI Automation — Intermediate",
  ai_automation_advanced: "AI Automation — Advanced",
};

const TERMS = ["FIRST TERM", "SECOND TERM", "THIRD TERM"];
const TERM_KEY: Record<string, string> = {
  "FIRST TERM": "First Term",
  "SECOND TERM": "Second Term",
  "THIRD TERM": "Third Term",
};
const grade = (t: number) =>
  t >= 70
    ? "A"
    : t >= 60
      ? "B"
      : t >= 50
        ? "C"
        : t >= 45
          ? "D"
          : t >= 40
            ? "E"
            : "F";
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

const yr = () => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};
const YEARS = Array.from({ length: 12 }, (_, i) => {
  const y = new Date().getFullYear() + 3 - i;
  return `${y}/${y + 1}`;
});

// ── Component ─────────────────────────────────────────────────────────────────
const SubjectInstructorDashboard: React.FC = () => {
  const userData = getUserData();
  const dept = userData?.department ?? "western";

  // ── Section controlled by TeacherLayout sidebar ───────────────────────────
  const [activeSection, setActiveSection] = useState<"entry" | "assignments">(
    "entry",
  );

  // ── Courses state ─────────────────────────────────────────────────────────
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [coursesReady, setCoursesReady] = useState(false);

  // ── Result entry filters ──────────────────────────────────────────────────
  const [selClass, setSelClass] = useState("");
  const [selCourse, setSelCourse] = useState<number | "">("");
  const [selTerm, setSelTerm] = useState("FIRST TERM");
  const [selYear, setSelYear] = useState(yr());

  // ── Score sheet ───────────────────────────────────────────────────────────
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Assignments ───────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignClass, setAssignClass] = useState("");
  const [assignCourse, setAssignCourse] = useState<number | "">("");
  const [newAssign, setNewAssign] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Load courses ──────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/courses/", { params: { department: dept, page_size: 500 } })
      .then((r) => {
        const d = r.data;
        const list: Course[] = Array.isArray(d) ? d : (d?.results ?? []);
        setAllCourses(list);
        setCoursesReady(true);
        if (list.length === 0)
          notify(
            false,
            `No courses found for ${dept}. Check backend course.py is updated.`,
          );
      })
      .catch((e) => {
        notify(
          false,
          "Failed to load courses — " +
            (e?.response?.status ?? "network error"),
        );
        setCoursesReady(true);
      });
  }, [dept]);

  // ── Load assignments ──────────────────────────────────────────────────────
  const loadAssignments = useCallback(() => {
    api
      .get("/assignments/", { params: { page_size: 200 } })
      .then((r) => {
        const d = r.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Classes = unique student_class values from all courses
  const classOptions = Array.from(
    new Set(allCourses.map((c) => c.student_class).filter(Boolean)),
  ) as string[];

  // Subjects for selected class
  const subjectOptions = selClass
    ? allCourses.filter((c) => c.student_class === selClass)
    : [];

  // Subjects for assignment class
  const assignSubjects = assignClass
    ? allCourses.filter((c) => c.student_class === assignClass)
    : allCourses;

  // ── Load score sheet ──────────────────────────────────────────────────────
  const loadSheet = useCallback(async () => {
    if (!selCourse || !selClass) {
      notify(false, "Select class and subject first");
      return;
    }
    setSheetBusy(true);
    setSheetLoaded(false);
    setRows([]);
    try {
      const [enrollRes, resultRes, profileRes] = await Promise.all([
        api.get("/enrollments/", {
          params: { course: selCourse, page_size: 200 },
        }),
        api.get("/results/", {
          params: {
            course: selCourse,
            term: TERM_KEY[selTerm],
            academic_year: selYear,
            page_size: 200,
          },
        }),
        api.get("/profiles/", {
          params: { student_class: selClass, role: "student", page_size: 200 },
        }),
      ]);
      const enrollments: any[] = Array.isArray(enrollRes.data)
        ? enrollRes.data
        : (enrollRes.data?.results ?? []);
      const existing: any[] = Array.isArray(resultRes.data)
        ? resultRes.data
        : (resultRes.data?.results ?? []);
      const profiles: any[] = Array.isArray(profileRes.data)
        ? profileRes.data
        : (profileRes.data?.results ?? []);

      console.log(
        `[Sheet] enr=${enrollments.length} profiles=${profiles.length} existing=${existing.length}`,
      );

      // Build profile map by id
      const pmap: Record<number, any> = {};
      profiles.forEach((p) => {
        pmap[p.id] = p;
      });

      // Get student IDs from enrollments (student field is integer ID)
      const enrolledIds = enrollments
        .map((e: any) => {
          if (typeof e.student === "number") return e.student;
          if (typeof e.student === "object" && e.student?.id)
            return e.student.id;
          return null;
        })
        .filter(Boolean) as number[];

      // Merge: enrolled students that are in the class profiles
      // If no enrollments found, fall back to all profiles in the class
      const studentIds =
        enrolledIds.length > 0
          ? Array.from(new Set(enrolledIds)).filter((id) => pmap[id])
          : profiles.map((p) => p.id);

      if (studentIds.length === 0 && profiles.length === 0) {
        notify(
          false,
          `No students found in ${CL[selClass] ?? selClass}. Check enrollments.`,
        );
        setSheetBusy(false);
        return;
      }
      // If profiles exist but no enrollments for this course, show all class students
      const finalIds =
        studentIds.length > 0 ? studentIds : profiles.map((p) => p.id);

      const built: StudentRow[] = finalIds.map((pid) => {
        const p = pmap[pid] ?? {};
        const u = p.user ?? {};
        const ex = existing.find((r: any) => r.student === pid);
        return {
          profile_id: pid,
          student_id: p.student_id ?? `#${pid}`,
          full_name:
            `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
            u.username ||
            `Student #${pid}`,
          test1: ex?.test1 ?? 0,
          test2: ex?.test2 ?? 0,
          assignment: ex?.assignment ?? 0,
          midterm: ex?.midterm ?? 0,
          exam: ex?.exam ?? 0,
          total: ex?.total ?? 0,
          grade: ex?.grade ?? "",
          result_id: ex?.id ?? null,
          status: ex?.status ?? "draft",
        };
      });
      setRows(built);
      setSheetLoaded(true);
    } catch (err: any) {
      console.error("[Sheet]", err?.response?.status, err?.response?.data);
      notify(
        false,
        err?.response?.data?.detail ?? "Failed to load sheet — check backend",
      );
    } finally {
      setSheetBusy(false);
    }
  }, [selCourse, selClass, selTerm, selYear]);

  // ── Score update with auto-save ───────────────────────────────────────────
  const updateScore = (idx: number, field: string, raw: string) => {
    const mx: Record<string, number> = {
      test1: 10,
      test2: 10,
      assignment: 10,
      midterm: 10,
      exam: 60,
    };
    const val =
      raw === "" ? 0 : Math.min(mx[field] ?? 100, Math.max(0, Number(raw)));
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx], [field]: val };
      const t = row.test1 + row.test2 + row.assignment + row.midterm + row.exam;
      row.total = Math.round(t * 10) / 10;
      row.grade = grade(t);
      next[idx] = row;
      return next;
    });
    setSavedAt(null);
    if (autoSave) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(false), 2000);
    }
  };

  const save = async (toast_ = true) => {
    if (!selCourse || rows.length === 0) return;
    setSaving(true);
    try {
      await api.post("/results/bulk_entry/", {
        course: selCourse,
        term: TERM_KEY[selTerm],
        academic_year: selYear,
        results: rows.map((r) => ({
          student: r.profile_id,
          test1: r.test1,
          test2: r.test2,
          assignment: r.assignment,
          midterm: r.midterm,
          exam: r.exam,
        })),
      });
      setSavedAt(new Date());
      if (toast_) notify(true, "Results saved ✅");
    } catch (e: any) {
      if (toast_) notify(false, e?.response?.data?.detail ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    await save(false);
    try {
      const r = await api.get("/results/", {
        params: {
          course: selCourse,
          term: TERM_KEY[selTerm],
          academic_year: selYear,
          page_size: 200,
        },
      });
      const all = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
      await Promise.allSettled(
        all
          .filter((x: any) => x.status === "draft")
          .map((x: any) => api.post(`/results/${x.id}/submit/`)),
      );
      notify(true, "Submitted for class teacher review ✅");
      loadSheet();
    } catch {
      notify(false, "Submit failed");
    }
  };

  // ── Create assignment ─────────────────────────────────────────────────────
  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCourse) {
      notify(false, "Select a subject");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/assignments/", {
        ...newAssign,
        course: Number(assignCourse),
      });
      notify(true, "Assignment created ✅");
      setNewAssign({ title: "", description: "", due_date: "" });
      setAssignClass("");
      setAssignCourse("");
      setShowForm(false);
      loadAssignments();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const courseName = allCourses.find((c) => c.id === selCourse)?.title ?? "";
  const classLabel = selClass ? (CL[selClass] ?? selClass) : "";

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* Section nav pills */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex gap-2">
        {[
          { id: "entry", label: "📊 Result Entry" },
          { id: "assignments", label: "📝 Assignments" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors
              ${activeSection === s.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {s.label}
          </button>
        ))}
        {/* Course loading indicator */}
        {!coursesReady && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading courses…
          </span>
        )}
        {coursesReady && allCourses.length > 0 && (
          <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
            ✅ {allCourses.length} courses loaded
          </span>
        )}
      </div>

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        {/* ══ RESULT ENTRY ══════════════════════════════════════════════════ */}
        {activeSection === "entry" && (
          <>
            {/* Filter card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4">
                <h2 className="text-white font-black text-base">
                  📋 Result Entry
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  Select class → subject → term → session, then load score sheet
                </p>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Class */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Class / Grade *
                    </label>
                    <select
                      value={selClass}
                      onChange={(e) => {
                        setSelClass(e.target.value);
                        setSelCourse("");
                        setSheetLoaded(false);
                        setRows([]);
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">— Select class —</option>
                      {classOptions.map((c) => (
                        <option key={c} value={c}>
                          {CL[c] ?? c}
                        </option>
                      ))}
                    </select>
                    {classOptions.length === 0 && coursesReady && (
                      <p className="text-xs text-red-500 mt-1">
                        No classes found
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Subject *{" "}
                      {selClass && (
                        <span className="text-blue-500 normal-case font-normal">
                          ({subjectOptions.length})
                        </span>
                      )}
                    </label>
                    <select
                      value={selCourse}
                      onChange={(e) => {
                        setSelCourse(
                          e.target.value ? Number(e.target.value) : "",
                        );
                        setSheetLoaded(false);
                        setRows([]);
                      }}
                      disabled={!selClass}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">— Select subject —</option>
                      {subjectOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Term */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Term *
                    </label>
                    <select
                      value={selTerm}
                      onChange={(e) => {
                        setSelTerm(e.target.value);
                        setSheetLoaded(false);
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TERMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Session *
                    </label>
                    <select
                      value={selYear}
                      onChange={(e) => {
                        setSelYear(e.target.value);
                        setSheetLoaded(false);
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Load button */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={loadSheet}
                    disabled={sheetBusy || !selCourse || !selClass}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {sheetBusy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "🔄 Load Score Sheet"
                    )}
                  </button>
                  {sheetLoaded && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ✅ {rows.length} student{rows.length !== 1 ? "s" : ""}{" "}
                      loaded
                    </span>
                  )}
                  {savedAt && (
                    <span className="text-xs text-gray-400 ml-auto">
                      Last saved{" "}
                      {savedAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score sheet */}
            {sheetLoaded && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Sheet header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">
                      End of Term Report Entry
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {courseName}
                      </span>
                      {" · "}
                      <span className="font-semibold">{classLabel}</span>
                      {" · "}
                      {selTerm}
                      {" · "}
                      {selYear}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setAutoSave((v) => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${autoSave ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoSave ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Autosave {autoSave ? "ON" : "OFF"}
                    </span>
                  </label>
                </div>

                {/* Score guide */}
                <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex flex-wrap gap-4">
                  {[
                    ["1st Test", "10"],
                    ["2nd Test", "10"],
                    ["Assignment", "10"],
                    ["Mid-term", "10"],
                    ["Exam", "60"],
                    ["Total", "100"],
                  ].map(([l, m]) => (
                    <span
                      key={l}
                      className={`text-xs font-semibold ${l === "Total" ? "text-green-700 dark:text-green-300 font-black" : l === "Exam" ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300"}`}
                    >
                      {l} <span className="opacity-60">/{m}</span>
                    </span>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 dark:bg-gray-950 text-white text-xs">
                        <th className="px-3 py-3 text-left font-semibold w-8">
                          #
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[90px]">
                          ADM. NO.
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[160px]">
                          FULL NAME
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          1ST
                          <br />
                          <span className="text-[10px] opacity-50">/10</span>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          2ND
                          <br />
                          <span className="text-[10px] opacity-50">/10</span>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          ASSG
                          <br />
                          <span className="text-[10px] opacity-50">/10</span>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          MID
                          <br />
                          <span className="text-[10px] opacity-50">/10</span>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-20">
                          EXAM
                          <br />
                          <span className="text-[10px] opacity-50">/60</span>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          TOTAL
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-12">
                          GRD
                        </th>
                        <th className="px-3 py-3 text-center font-semibold w-24">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {rows.map((row, i) => (
                        <tr
                          key={row.profile_id}
                          className={
                            i % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50 dark:bg-gray-800/50"
                          }
                        >
                          <td className="px-3 py-2 text-gray-400 text-xs font-mono">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {row.student_id}
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white text-xs">
                            {row.full_name}
                          </td>
                          {(
                            [
                              "test1",
                              "test2",
                              "assignment",
                              "midterm",
                              "exam",
                            ] as const
                          ).map((f) => {
                            const mx = {
                              test1: 10,
                              test2: 10,
                              assignment: 10,
                              midterm: 10,
                              exam: 60,
                            };
                            const v = row[f] as number;
                            return (
                              <td key={f} className="px-1 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={mx[f]}
                                  value={v === 0 ? "" : v}
                                  placeholder="—"
                                  onChange={(e) =>
                                    updateScore(i, f, e.target.value)
                                  }
                                  className={`w-14 px-1 py-1.5 text-center text-sm border rounded-lg
                                    dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400
                                    transition-colors
                                    ${
                                      v > 0 && v < mx[f] * 0.4
                                        ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    }`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center">
                            <span
                              className="font-black text-sm"
                              style={{
                                color:
                                  row.total > 0
                                    ? (GRADE_FG[row.grade] ?? "#374151")
                                    : "#9ca3af",
                              }}
                            >
                              {row.total > 0 ? row.total : "—"}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {row.grade && (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-black"
                                style={{
                                  background: GRADE_BG[row.grade] ?? "#f3f4f6",
                                  color: GRADE_FG[row.grade] ?? "#374151",
                                }}
                              >
                                {row.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                              ${
                                row.status === "published"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : row.status === "reviewed"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : row.status === "submitted"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action bar */}
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => save(true)}
                    disabled={saving || rows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "💾 Save Results"
                    )}
                  </button>
                  <button
                    onClick={submit}
                    disabled={saving || rows.length === 0}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    📤 Submit for Review
                  </button>
                  <div className="ml-auto text-xs text-gray-400">
                    {rows.length} student{rows.length !== 1 ? "s" : ""} ·{" "}
                    {selTerm} · {selYear}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!sheetLoaded && !sheetBusy && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
                <p className="text-5xl mb-3">📋</p>
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">
                  No score sheet loaded
                </p>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  {!coursesReady
                    ? "Loading courses from server…"
                    : classOptions.length === 0
                      ? "⚠️ No classes found. Make sure course.py and filters.py are updated in backend."
                      : "Select a class, subject, term and session above, then click Load Score Sheet"}
                </p>
              </div>
            )}
          </>
        )}

        {/* ══ ASSIGNMENTS ══════════════════════════════════════════════════ */}
        {activeSection === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📝 My Assignments
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {assignments.length} assignment
                  {assignments.length !== 1 ? "s" : ""} created
                </p>
              </div>
              <button
                onClick={() => setShowForm((v) => !v)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                  ${showForm ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "bg-blue-700 hover:bg-blue-800 text-white"}`}
              >
                {showForm ? "✕ Cancel" : "+ New Assignment"}
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={createAssignment}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 overflow-hidden"
                >
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    New Assignment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                        Class *
                      </label>
                      <select
                        value={assignClass}
                        onChange={(e) => {
                          setAssignClass(e.target.value);
                          setAssignCourse("");
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select class —</option>
                        {classOptions.map((c) => (
                          <option key={c} value={c}>
                            {CL[c] ?? c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                        Subject *
                      </label>
                      <select
                        value={assignCourse}
                        onChange={(e) =>
                          setAssignCourse(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        disabled={!assignClass}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">— Select subject —</option>
                        {assignSubjects.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newAssign.due_date}
                      onChange={(e) =>
                        setNewAssign((p) => ({
                          ...p,
                          due_date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !assignCourse}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Creating…" : "✓ Create Assignment"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {assignments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-4xl mb-2">📝</p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No assignments yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "+ New Assignment" to create one
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
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          {a.course_title ?? `Course #${a.course}`}
                        </p>
                        {a.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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

export default SubjectInstructorDashboard;
