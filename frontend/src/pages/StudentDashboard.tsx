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
  BarChart,
  Bar,
} from "recharts";

// Types
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
  payments: {
    date: string;
    amount: number;
    reference: string;
  }[];
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

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData = getUserData();
  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "tests" | "fees" | "chat" | "analytics"
  >("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat state
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatFile, setChatFile] = useState<File | null>(null);

  // Assignment submission state
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

      // Fetch all data in parallel
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

      // Load chat history if any
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

  // File submission handler
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", submissionFile);
    formData.append("assignment_id", selectedAssignment.id.toString());

    // Determine file type
    const fileType = getFileType(submissionFile.name);
    formData.append("file_type", fileType);

    try {
      await api.post(
        `/assignments/${selectedAssignment.id}/submit/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      // Refresh assignments
      const res = await api.get("/assignments/my-assignments/");
      setAssignments(res.data);
      setSelectedAssignment(null);
      setSubmissionFile(null);
      alert("Assignment submitted successfully!");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return "pdf";
    if (["doc", "docx"].includes(ext || "")) return "doc";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return "image";
    if (["mp4", "avi", "mov"].includes(ext || "")) return "video";
    return "other";
  };

  // Chat handlers
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

      // Refresh chat
      const res = await api.get(`/chat/history/${selectedInstructor.id}/`);
      setChatMessages(res.data);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const loadChatHistory = async (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    try {
      const res = await api.get(`/chat/history/${instructor.id}/`);
      setChatMessages(res.data);
      // Mark as read
      await api.post(`/chat/mark-read/${instructor.id}/`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.user?.first_name || profile?.user?.username}!
        </h1>
        <p className="text-blue-100">
          Class: {profile?.student_class} | Department: {profile?.department}
        </p>
        {profile?.student_id && (
          <p className="text-sm mt-2 bg-white/20 inline-block px-3 py-1 rounded">
            Student ID: {profile.student_id}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon="📝"
          label="Pending Assignments"
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
          label="Average Grade"
          value={`${calculateAverageGrade()}%`}
          color="blue"
        />
        <StatsCard
          icon="💬"
          label="Unread Messages"
          value={unreadCount}
          color="purple"
        />
      </div>

      {/* My Instructors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          My Instructors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {instructors.map((instructor) => (
            <motion.div
              key={instructor.id}
              whileHover={{ scale: 1.02 }}
              className="border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => loadChatHistory(instructor)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  {instructor.avatar || "👨‍🏫"}
                </div>
                <div>
                  <h3 className="font-semibold dark:text-white">
                    {instructor.name}
                  </h3>
                  <p className="text-sm text-gray-500">{instructor.subject}</p>
                </div>
              </div>
              <button className="mt-3 w-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-1 rounded">
                💬 Chat
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">
            Recent Assignments
          </h2>
          <button
            onClick={() => setActiveTab("assignments")}
            className="text-blue-600 hover:text-blue-800"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {assignments.slice(0, 3).map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg"
            >
              <div>
                <h3 className="font-medium dark:text-white">
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {assignment.course} • Due:{" "}
                  {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  assignment.status === "graded"
                    ? "bg-green-100 text-green-800"
                    : assignment.status === "submitted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {assignment.status === "graded"
                  ? `Graded: ${assignment.grade}/${assignment.max_score}`
                  : assignment.status === "submitted"
                    ? "Submitted"
                    : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Status */}
      {feeInfo && (
        <div
          className={`rounded-lg p-6 ${
            feeInfo.status === "paid"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200"
              : feeInfo.status === "overdue"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200"
                : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold mb-1">
                School Fees - {feeInfo.term}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Due: {new Date(feeInfo.due_date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                feeInfo.status === "paid"
                  ? "bg-green-200 text-green-800"
                  : feeInfo.status === "overdue"
                    ? "bg-red-200 text-red-800"
                    : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {feeInfo.status.toUpperCase()}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{feeInfo.total_amount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                ₦{feeInfo.amount_paid.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                ₦{feeInfo.balance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Balance</p>
            </div>
          </div>
          {feeInfo.balance > 0 && (
            <button
              onClick={() => setActiveTab("fees")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              Make Payment
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">My Assignments</h2>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  {assignment.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {assignment.course}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Due: {new Date(assignment.due_date).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
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

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {assignment.description}
            </p>

            {assignment.file_url && (
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Submit Assignment
                  </button>
                ) : (
                  <form onSubmit={handleFileSubmit} className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
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
                        className="cursor-pointer block"
                      >
                        {submissionFile ? (
                          <span className="text-green-600">
                            ✓ {submissionFile.name}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Click to upload (PDF, Word, Image, Video)
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!submissionFile || submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 rounded-lg"
                      >
                        {submitting ? "Uploading..." : "Submit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(null);
                          setSubmissionFile(null);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
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
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    Grade
                  </span>
                  <span className="text-2xl font-bold text-green-800 dark:text-green-200">
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

  const renderTests = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">Tests & Results</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Test/Exam
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Score
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Class Stats
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Rank
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {testResults.map((result) => (
              <tr
                key={result.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 dark:text-white">{result.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
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
                    className={`font-bold ${
                      result.score / result.max_score >= 0.7
                        ? "text-green-600"
                        : result.score / result.max_score >= 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {result.score}/{result.max_score}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({((result.score / result.max_score) * 100).toFixed(1)}%)
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  Avg: {result.class_average} | High: {result.highest_score} |
                  Low: {result.lowest_score}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-blue-600">
                    #{result.rank} of {result.total_students}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Result Cards */}
      <div className="grid gap-4">
        {testResults.map((result) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  {result.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(result.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  result.score / result.max_score >= 0.7
                    ? "bg-green-100 text-green-800"
                    : result.score / result.max_score >= 0.5
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {result.score / result.max_score >= 0.7
                  ? "Excellent"
                  : result.score / result.max_score >= 0.5
                    ? "Good"
                    : "Needs Improvement"}
              </span>
            </div>

            {/* Score Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="dark:text-gray-300">Your Score</span>
                <span className="font-bold dark:text-white">
                  {((result.score / result.max_score) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    result.score / result.max_score >= 0.7
                      ? "bg-green-500"
                      : result.score / result.max_score >= 0.5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${(result.score / result.max_score) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <p className="text-gray-500">Class Average</p>
                <p className="font-bold dark:text-white">
                  {result.class_average}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <p className="text-gray-500">Highest</p>
                <p className="font-bold dark:text-white">
                  {result.highest_score}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <p className="text-gray-500">Your Rank</p>
                <p className="font-bold text-blue-600">#{result.rank}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderFees = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">School Fees</h2>

      {feeInfo ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold dark:text-white">
                {feeInfo.term} - {feeInfo.academic_year}
              </h3>
              <p className="text-gray-500">
                Due Date: {new Date(feeInfo.due_date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-medium ${
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

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₦{feeInfo.total_amount.toLocaleString()}
              </p>
              <p className="text-gray-500">Total Amount</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                ₦{feeInfo.amount_paid.toLocaleString()}
              </p>
              <p className="text-gray-500">Amount Paid</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                ₦{feeInfo.balance.toLocaleString()}
              </p>
              <p className="text-gray-500">Balance Due</p>
            </div>
          </div>

          {feeInfo.balance > 0 && (
            <div className="border-t dark:border-gray-700 pt-6">
              <h4 className="font-semibold mb-4 dark:text-white">
                Make Payment
              </h4>
              <div className="flex gap-4">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium">
                  Pay Full Amount (₦{feeInfo.balance.toLocaleString()})
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium">
                  Pay Partial Amount
                </button>
              </div>
            </div>
          )}

          {/* Payment History */}
          {feeInfo.payments.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-4 dark:text-white">
                Payment History
              </h4>
              <div className="space-y-2">
                {feeInfo.payments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ref: {payment.reference}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No fee information available</p>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Instructors List */}
      <div className="w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-bold dark:text-white">My Instructors</h3>
        </div>
        <div className="overflow-y-auto h-full">
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              onClick={() => loadChatHistory(instructor)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 ${
                selectedInstructor?.id === instructor.id
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {instructor.avatar || "👨‍🏫"}
                </div>
                <div>
                  <p className="font-medium dark:text-white">
                    {instructor.name}
                  </p>
                  <p className="text-sm text-gray-500">{instructor.subject}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
        {selectedInstructor ? (
          <>
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-bold dark:text-white">
                {selectedInstructor.name}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedInstructor.subject}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === profile?.user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
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
                        className="text-sm underline mt-1 block"
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

            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="file"
                  onChange={(e) => setChatFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="chat-file"
                />
                <label
                  htmlFor="chat-file"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                >
                  📎
                </label>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage && !chatFile}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
                >
                  Send
                </button>
              </div>
              {chatFile && (
                <p className="text-sm text-gray-500 mt-1">
                  File: {chatFile.name}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an instructor to start chatting
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">
        Performance Analytics
      </h2>

      {/* Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Score Trends
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
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

      {/* Subject Breakdown */}
      <div className="grid gap-4">
        {analytics.map((subject) => (
          <motion.div
            key={subject.subject}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold dark:text-white">
                {subject.subject}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
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
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="dark:text-gray-300">Your Score</span>
                  <span className="font-bold dark:text-white">
                    {subject.current_score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      subject.current_score >= 70
                        ? "bg-green-500"
                        : subject.current_score >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${subject.current_score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="dark:text-gray-300">Class Average</span>
                  <span className="font-bold dark:text-white">
                    {subject.class_average}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${subject.class_average}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Helper function
  const calculateAverageGrade = () => {
    const graded = assignments.filter((a) => a.grade !== undefined);
    if (graded.length === 0) return 0;
    const total = graded.reduce(
      (sum, a) => sum + ((a.grade || 0) / a.max_score) * 100,
      0,
    );
    return Math.round(total / graded.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-700 pb-2">
        {[
          { id: "overview", label: "🏠 Overview", icon: "🏠" },
          { id: "assignments", label: "📝 Assignments", icon: "📝" },
          { id: "tests", label: "📊 Tests & Results", icon: "📊" },
          { id: "fees", label: "💰 Fees", icon: "💰" },
          {
            id: "chat",
            label: `💬 Chat ${unreadCount > 0 ? `(${unreadCount})` : ""}`,
            icon: "💬",
          },
          { id: "analytics", label: "📈 Analytics", icon: "📈" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
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
