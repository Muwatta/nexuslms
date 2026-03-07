import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import StatsCard from "../components/StatsCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Instructor {
  id: number;
  name: string;
  subject: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  course: string;
  due_date: string;
  file_url?: string;
  status: "pending" | "submitted" | "graded";
  grade?: number;
  feedback?: string;
  max_score: number;
}

interface TestResult {
  id: number;
  title: string;
  type: "test" | "exam" | "quiz";
  score: number;
  max_score: number;
  date: string;
  class_average: number;
  highest_score: number;
  lowest_score: number;
  rank: number;
  total_students: number;
}

interface FeeInfo {
  academic_year: string;
  term: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: "paid" | "partial" | "pending" | "overdue";
  due_date: string;
  payments: { date: string; amount: number; reference: string }[];
}

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  file_url?: string;
  timestamp: string;
  is_read: boolean;
}

interface AnalyticsData {
  subject: string;
  current_score: number;
  previous_score: number;
  class_average: number;
  trend: "up" | "down" | "stable";
}

// ─── Profile shape from /profiles/me/ ────────────────────────────────────────
// API returns snake_case — use those field names directly
interface ApiProfile {
  id?: number;
  role?: string;
  department?: string;
  student_class?: string;
  student_id?: string;
  user?: {
    id?: number;
    first_name?: string; // ← snake_case from Django
    last_name?: string; // ← snake_case from Django
    username?: string;
    email?: string;
  };
}

type TabId =
  | "overview"
  | "assignments"
  | "tests"
  | "fees"
  | "chat"
  | "analytics";

// ─── Component ────────────────────────────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = getUserData(); // camelCase localStorage snapshot
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // API profile with correct snake_case fields
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatFile, setChatFile] = useState<File | null>(null);

  // Assignment submission
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        profileRes,
        instructorsRes,
        assignmentsRes,
        testsRes,
        feesRes,
        chatRes,
        analyticsRes,
      ] = await Promise.all([
        api.get("/profiles/me/"),
        api.get("/instructors/my-instructors/"),
        api.get("/assignments/my-assignments/"),
        api.get("/results/my-results/"),
        api.get("/fees/my-fees/"),
        api.get("/chat/unread-count/"),
        api.get("/analytics/my-performance/"),
      ]);

      setProfile(profileRes.data);
      setInstructors(instructorsRes.data);
      setAssignments(assignmentsRes.data);
      setTestResults(testsRes.data);
      setFeeInfo(feesRes.data);
      setUnreadCount(chatRes.data.count);
      setAnalytics(analyticsRes.data);

      if (instructorsRes.data.length > 0) {
        const chatHistoryRes = await api.get(
          `/chat/history/${instructorsRes.data[0].id}/`,
        );
        setChatMessages(chatHistoryRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const calculateAverageGrade = () => {
    const graded = assignments.filter((a) => a.grade !== undefined);
    if (!graded.length) return 0;
    return Math.round(
      graded.reduce((sum, a) => sum + ((a.grade ?? 0) / a.max_score) * 100, 0) /
        graded.length,
    );
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
    if (["mp4", "avi", "mov"].includes(ext)) return "video";
    return "other";
  };

  // ── Resolved display values (snake_case from API, camelCase fallback) ───────
  // This is the KEY fix — profile.user.first_name not profile.user.firstName
  const displayFirstName =
    profile?.user?.first_name || // ✅ snake_case from Django API
    storedUser?.firstName || // camelCase fallback from localStorage
    profile?.user?.username ||
    storedUser?.username ||
    "";

  const displayClass = profile?.student_class ?? "";
  const displayDepartment = profile?.department ?? storedUser?.department ?? "";

  // ── File submission ────────────────────────────────────────────────────────
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", submissionFile);
    formData.append("assignment_id", selectedAssignment.id.toString());
    formData.append("file_type", getFileType(submissionFile.name));
    try {
      await api.post(
        `/assignments/${selectedAssignment.id}/submit/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const res = await api.get("/assignments/my-assignments/");
      setAssignments(res.data);
      setSelectedAssignment(null);
      setSubmissionFile(null);
      alert("Assignment submitted successfully!");
    } catch {
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!selectedInstructor || (!newMessage && !chatFile)) return;
    const formData = new FormData();
    formData.append("recipient_id", selectedInstructor.id.toString());
    if (newMessage) formData.append("message", newMessage);
    if (chatFile) formData.append("file", chatFile);
    try {
      await api.post("/chat/send/", formData);
      setNewMessage("");
      setChatFile(null);
      const res = await api.get(`/chat/history/${selectedInstructor.id}/`);
      setChatMessages(res.data);
    } catch {
      /* handle silently */
    }
  };

  const loadChatHistory = async (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    try {
      const res = await api.get(`/chat/history/${instructor.id}/`);
      setChatMessages(res.data);
      await api.post(`/chat/mark-read/${instructor.id}/`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* handle silently */
    }
  };

 
  const renderOverview = () => (
    <div className="space-y-5">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5 sm:p-6 text-white">
        
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate">
          Welcome back, {displayFirstName || "Student"}!
        </h1>
        <p className="text-blue-100 text-sm sm:text-base">
          {displayClass && (
            <>
              Class: <span className="font-medium">{displayClass}</span>
            </>
          )}
          {displayClass && displayDepartment && " · "}
          {displayDepartment && (
            <>
              Department:{" "}
              <span className="font-medium capitalize">
                {displayDepartment}
              </span>
            </>
          )}
        </p>
        {profile?.student_id && (
          <p className="text-xs sm:text-sm mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">
            Student ID: {profile.student_id}
          </p>
        )}
      </div>

      {/* Quick stats — 2 cols on mobile, 4 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon="📝"
          label="Pending"
          value={assignments.filter((a) => a.status === "pending").length}
          color="yellow"
        />
        <StatsCard
          icon="✅"
          label="Submitted"
          value={assignments.filter((a) => a.status === "submitted").length}
          color="green"
        />
        <StatsCard
          icon="📊"
          label="Avg Grade"
          value={`${calculateAverageGrade()}%`}
          color="blue"
        />
        <StatsCard
          icon="💬"
          label="Unread Msgs"
          value={unreadCount}
          color="purple"
        />
      </div>

      {/* My Instructors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">
          My Instructors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {instructors.map((instructor) => (
            <motion.div
              key={instructor.id}
              whileHover={{ scale: 1.02 }}
              className="border dark:border-gray-700 rounded-lg p-4 cursor-pointer
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => loadChatHistory(instructor)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full
                  flex items-center justify-center text-xl sm:text-2xl shrink-0"
                >
                  {instructor.avatar || "👨‍🏫"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold dark:text-white truncate">
                    {instructor.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {instructor.subject}
                  </p>
                </div>
              </div>
              <button
                className="mt-3 w-full text-sm bg-blue-100 dark:bg-blue-900
                text-blue-700 dark:text-blue-300 py-1.5 rounded-lg transition-colors
                hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                💬 Chat
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white">
            Recent Assignments
          </h2>
          <button
            onClick={() => setActiveTab("assignments")}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 whitespace-nowrap"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {assignments.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between
                gap-2 p-3 border dark:border-gray-700 rounded-lg"
            >
              <div className="min-w-0">
                <h3 className="font-medium dark:text-white truncate">
                  {a.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {a.course} · Due: {new Date(a.due_date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`self-start sm:self-center shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-medium
                ${
                  a.status === "graded"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : a.status === "submitted"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                }`}
              >
                {a.status === "graded"
                  ? `Graded: ${a.grade}/${a.max_score}`
                  : a.status === "submitted"
                    ? "Submitted"
                    : "Pending"}
              </span>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              No assignments yet
            </p>
          )}
        </div>
      </div>

      {/* Fee Status */}
      {feeInfo && (
        <div
          className={`rounded-xl p-4 sm:p-6 border
          ${
            feeInfo.status === "paid"
              ? "bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800"
              : feeInfo.status === "overdue"
                ? "bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold dark:text-white">
                School Fees — {feeInfo.term}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due: {new Date(feeInfo.due_date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`self-start shrink-0 px-3 py-1 rounded-full text-sm font-medium
              ${
                feeInfo.status === "paid"
                  ? "bg-green-200  text-green-800"
                  : feeInfo.status === "overdue"
                    ? "bg-red-200    text-red-800"
                    : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {feeInfo.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              {
                label: "Total",
                value: feeInfo.total_amount,
                color: "text-gray-900 dark:text-white",
              },
              {
                label: "Paid",
                value: feeInfo.amount_paid,
                color: "text-green-600",
              },
              {
                label: "Balance",
                value: feeInfo.balance,
                color: "text-red-600",
              },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-lg sm:text-2xl font-bold ${color}`}>
                  ₦{value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {feeInfo.balance > 0 && (
            <button
              onClick={() => setActiveTab("fees")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg
                text-sm font-medium transition-colors"
            >
              Make Payment
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: ASSIGNMENTS
  // ══════════════════════════════════════════════════════════════════════════
  const renderAssignments = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold dark:text-white">
        My Assignments
      </h2>
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold dark:text-white">
                  {assignment.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {assignment.course}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Due: {new Date(assignment.due_date).toLocaleString()}
                </p>
              </div>
              <span
                className={`self-start shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-medium
                ${
                  assignment.status === "graded"
                    ? "bg-green-100 text-green-800"
                    : assignment.status === "submitted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {assignment.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {assignment.description}
            </p>
            {assignment.file_url && (
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mb-4"
              >
                📎 Download Assignment Material
              </a>
            )}
            {assignment.status === "pending" && (
              <div className="border-t dark:border-gray-700 pt-4">
                {!selectedAssignment ||
                selectedAssignment.id !== assignment.id ? (
                  <button
                    onClick={() => setSelectedAssignment(assignment)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Submit Assignment
                  </button>
                ) : (
                  <form onSubmit={handleFileSubmit} className="space-y-3">
                    <div
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600
                      rounded-lg p-4 text-center"
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                        onChange={(e) =>
                          setSubmissionFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id={`file-${assignment.id}`}
                      />
                      <label
                        htmlFor={`file-${assignment.id}`}
                        className="cursor-pointer block text-sm"
                      >
                        {submissionFile ? (
                          <span className="text-green-600">
                            ✓ {submissionFile.name}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Tap to upload (PDF, Word, Image, Video)
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!submissionFile || submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                          text-white py-2 rounded-lg text-sm transition-colors"
                      >
                        {submitting ? "Uploading..." : "Submit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(null);
                          setSubmissionFile(null);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200
                          rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {assignment.status === "graded" && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-800 dark:text-green-200 text-sm">
                    Grade
                  </span>
                  <span className="text-xl font-bold text-green-800 dark:text-green-200">
                    {assignment.grade}/{assignment.max_score}
                  </span>
                </div>
                {assignment.feedback && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Feedback: {assignment.feedback}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: TESTS
  // ══════════════════════════════════════════════════════════════════════════
  const renderTests = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold dark:text-white">
        Tests & Results
      </h2>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {["Test/Exam", "Type", "Score", "Class Stats", "Rank"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {testResults.map((result) => (
              <tr
                key={result.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 dark:text-white text-sm">
                  {result.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium
                    ${
                      result.type === "exam"
                        ? "bg-red-100 text-red-800"
                        : result.type === "test"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {result.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-bold text-sm
                    ${
                      result.score / result.max_score >= 0.7
                        ? "text-green-600"
                        : result.score / result.max_score >= 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {result.score}/{result.max_score}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({((result.score / result.max_score) * 100).toFixed(1)}%)
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  Avg: {result.class_average} · High: {result.highest_score} ·
                  Low: {result.lowest_score}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-blue-600 text-sm">
                    #{result.rank} of {result.total_students}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — shown only on mobile */}
      <div className="md:hidden space-y-3">
        {testResults.map((result) => (
          <div
            key={result.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold dark:text-white text-sm flex-1 pr-2">
                {result.title}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium shrink-0
                ${
                  result.type === "exam"
                    ? "bg-red-100 text-red-800"
                    : result.type === "test"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {result.type.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span
                className={`font-bold
                ${
                  result.score / result.max_score >= 0.7
                    ? "text-green-600"
                    : result.score / result.max_score >= 0.5
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {result.score}/{result.max_score} (
                {((result.score / result.max_score) * 100).toFixed(1)}%)
              </span>
              <span className="font-bold text-blue-600">
                #{result.rank}/{result.total_students}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full
                ${
                  result.score / result.max_score >= 0.7
                    ? "bg-green-500"
                    : result.score / result.max_score >= 0.5
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${(result.score / result.max_score) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Class avg: {result.class_average} · High: {result.highest_score} ·
              Low: {result.lowest_score}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: FEES
  // ══════════════════════════════════════════════════════════════════════════
  const renderFees = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold dark:text-white">
        School Fees
      </h2>
      {feeInfo ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-6">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">
                {feeInfo.term} — {feeInfo.academic_year}
              </h3>
              <p className="text-gray-500 text-sm">
                Due: {new Date(feeInfo.due_date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`self-start px-4 py-1.5 rounded-full font-medium text-sm
              ${
                feeInfo.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : feeInfo.status === "overdue"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {feeInfo.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
            {[
              {
                label: "Total Amount",
                value: feeInfo.total_amount,
                cls: "text-gray-900 dark:text-white",
              },
              {
                label: "Amount Paid",
                value: feeInfo.amount_paid,
                cls: "text-green-600",
              },
              {
                label: "Balance Due",
                value: feeInfo.balance,
                cls: "text-red-600",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className={`text-lg sm:text-3xl font-bold ${cls}`}>
                  ₦{value.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {feeInfo.balance > 0 && (
            <div className="border-t dark:border-gray-700 pt-4 sm:pt-6">
              <h4 className="font-semibold mb-3 dark:text-white text-sm sm:text-base">
                Make Payment
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3
                  rounded-lg font-medium text-sm transition-colors"
                >
                  Pay Full (₦{feeInfo.balance.toLocaleString()})
                </button>
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3
                  rounded-lg font-medium text-sm transition-colors"
                >
                  Pay Partial
                </button>
              </div>
            </div>
          )}
          {feeInfo.payments.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h4 className="font-semibold mb-3 dark:text-white text-sm sm:text-base">
                Payment History
              </h4>
              <div className="space-y-2">
                {feeInfo.payments.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3
                    bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium dark:text-white text-sm">
                        ₦{p.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ref: {p.reference}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(p.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No fee information available</p>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: CHAT  (mobile-first: stacked on mobile, side-by-side on md+)
  // ══════════════════════════════════════════════════════════════════════════
  const renderChat = () => (
    <div
      className="flex flex-col md:flex-row gap-4"
      style={{ height: "calc(100vh - 220px)", minHeight: 400 }}
    >
      {/* Instructor list — full width on mobile when no instructor selected */}
      <div
        className={`${selectedInstructor ? "hidden md:flex" : "flex"} 
        flex-col w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden`}
      >
        <div className="p-4 border-b dark:border-gray-700 shrink-0">
          <h3 className="font-bold dark:text-white text-sm">My Instructors</h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              onClick={() => loadChatHistory(instructor)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700
                border-b dark:border-gray-700 transition-colors
                ${selectedInstructor?.id === instructor.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  {instructor.avatar || "👨‍🏫"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium dark:text-white text-sm truncate">
                    {instructor.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {instructor.subject}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area — full width on mobile when instructor selected */}
      <div
        className={`${selectedInstructor ? "flex" : "hidden md:flex"}
        flex-1 flex-col bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden`}
      >
        {selectedInstructor ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 shrink-0">
              {/* Back button on mobile */}
              <button
                className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 p-1"
                onClick={() => setSelectedInstructor(null)}
              >
                ←
              </button>
              <div>
                <h3 className="font-bold dark:text-white text-sm">
                  {selectedInstructor.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedInstructor.subject}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === profile?.user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 text-sm
                    ${
                      msg.sender_id === profile?.user?.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 dark:text-white"
                    }`}
                  >
                    <p>{msg.message}</p>
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline mt-1 block"
                      >
                        📎 Attachment
                      </a>
                    )}
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 sm:p-4 border-t dark:border-gray-700 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg
                    dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="file"
                  onChange={(e) => setChatFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="chat-file"
                />
                <label
                  htmlFor="chat-file"
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer
                    text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  📎
                </label>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage && !chatFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                    text-white rounded-lg text-sm transition-colors"
                >
                  Send
                </button>
              </div>
              {chatFile && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  📎 {chatFile.name}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8 text-center">
            Select an instructor to start chatting
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════
  const renderAnalytics = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold dark:text-white">
        Performance Analytics
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">
          Score Trends
        </h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="current_score"
                stroke="#3B82F6"
                name="Current"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="previous_score"
                stroke="#9CA3AF"
                name="Previous"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="class_average"
                stroke="#10B981"
                name="Class Avg"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-4">
        {analytics.map((subject) => (
          <motion.div
            key={subject.subject}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold dark:text-white text-sm sm:text-base">
                {subject.subject}
              </h3>
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm
                ${
                  subject.trend === "up"
                    ? "bg-green-100 text-green-800"
                    : subject.trend === "down"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {subject.trend === "up"
                  ? "📈 Improving"
                  : subject.trend === "down"
                    ? "📉 Declining"
                    : "➡️ Stable"}
              </span>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Your Score",
                  value: subject.current_score,
                  color:
                    subject.current_score >= 70
                      ? "bg-green-500"
                      : subject.current_score >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500",
                },
                {
                  label: "Class Average",
                  value: subject.class_average,
                  color: "bg-blue-500",
                },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span className="dark:text-gray-300">{label}</span>
                    <span className="font-bold dark:text-white">{value}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-500`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full
            animate-spin mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Tab bar — horizontally scrollable on mobile so nothing wraps */}
      <div
        className="flex gap-1 sm:gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1
        border-b dark:border-gray-700 scrollbar-none"
      >
        {(
          [
            { id: "overview", label: "Overview", icon: "🏠" },
            { id: "assignments", label: "Assignments", icon: "📝" },
            { id: "tests", label: "Tests", icon: "📊" },
            { id: "fees", label: "Fees", icon: "💰" },
            {
              id: "chat",
              label: unreadCount > 0 ? `Chat (${unreadCount})` : "Chat",
              icon: "💬",
            },
            { id: "analytics", label: "Analytics", icon: "📈" },
          ] as { id: TabId; label: string; icon: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium
              text-xs sm:text-sm whitespace-nowrap transition-colors shrink-0
              ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "assignments" && renderAssignments()}
          {activeTab === "tests" && renderTests()}
          {activeTab === "fees" && renderFees()}
          {activeTab === "chat" && renderChat()}
          {activeTab === "analytics" && renderAnalytics()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
