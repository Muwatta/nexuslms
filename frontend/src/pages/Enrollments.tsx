import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";

interface Enrollment {
  id: number;
  course: number;
  course_title: string;
  course_department?: string;
  student?: number;
  student_name?: string;
  academic_year: string;
  status: "active" | "pending" | "completed" | "dropped" | "promoted";
  enrolled_at: string;
  term?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Check if development mode using import.meta.env (Vite) or process (Node)
const isDev = import.meta.env?.DEV || import.meta.env?.MODE === "development";

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const response = await api.get("/enrollments/");
      const data = response.data;

      // Handle different response formats
      const enrollmentList = Array.isArray(data)
        ? data
        : data.results || data.data || [];

      // Validate enrollment data
      const validatedEnrollments = validateEnrollments(enrollmentList);
      setEnrollments(validatedEnrollments);
    } catch (err: any) {
      console.error("Enrollment fetch error:", err);
      setError(
        err?.response?.data?.detail ||
          "Failed to load enrollments. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const validateEnrollments = (data: any[]): Enrollment[] => {
    const errors: ValidationError[] = [];
    const valid: Enrollment[] = [];

    data.forEach((item, index) => {
      if (!item.id) {
        errors.push({
          field: `item[${index}].id`,
          message: "Missing enrollment ID",
        });
      }
      if (!item.course) {
        errors.push({
          field: `item[${index}].course`,
          message: "Missing course reference",
        });
      }
      if (!item.academic_year) {
        errors.push({
          field: `item[${index}].academic_year`,
          message: "Missing academic year",
        });
      }

      const validStatuses = [
        "active",
        "pending",
        "completed",
        "dropped",
        "promoted",
      ];
      if (item.status && !validStatuses.includes(item.status)) {
        errors.push({
          field: `item[${index}].status`,
          message: `Invalid status: ${item.status}`,
        });
      }

      if (item.id && item.course) {
        valid.push({
          id: item.id,
          course: item.course,
          course_title: item.course_title || `Course #${item.course}`,
          course_department: item.course_department,
          student: item.student,
          student_name: item.student_name,
          academic_year: item.academic_year || "Unknown",
          status: item.status || "pending",
          enrolled_at: item.enrolled_at || new Date().toISOString(),
          term: item.term,
        });
      }
    });

    if (errors.length > 0) {
      console.warn("Enrollment validation errors:", errors);
      setValidationErrors(errors);
    }

    return valid;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      pending:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      promoted:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case "pending":
        return <Clock size={16} className="text-amber-600" />;
      case "completed":
        return <GraduationCap size={16} className="text-blue-600" />;
      case "dropped":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-blue-600 mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">
            Loading enrollments...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Enrollments
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            My Enrollments
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your course enrollments and track your progress
          </p>
        </motion.div>

        {/* Validation Warnings */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle size={18} />
                Data Validation Warnings ({validationErrors.length})
              </h4>
              {isDev && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs text-amber-600 hover:text-amber-800 underline"
                >
                  {showDebug ? "Hide" : "Show"} Debug
                </button>
              )}
            </div>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {validationErrors.slice(0, 3).map((err, idx) => (
                <li key={idx}>
                  {err.field}: {err.message}
                </li>
              ))}
              {validationErrors.length > 3 && !showDebug && (
                <li>...and {validationErrors.length - 3} more issues</li>
              )}
            </ul>

            {/* Debug Panel */}
            {showDebug && isDev && (
              <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg">
                <pre className="text-xs text-amber-800 dark:text-amber-200 overflow-x-auto">
                  {JSON.stringify(validationErrors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Enrollments List */}
        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Enrollments Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              You haven't enrolled in any courses yet.
            </p>
            <a
              href="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {enrollment.course_title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          enrollment.status,
                        )}`}
                      >
                        {getStatusIcon(enrollment.status)}
                        {enrollment.status.charAt(0).toUpperCase() +
                          enrollment.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {enrollment.academic_year}
                      </span>
                      {enrollment.term && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {enrollment.term}
                        </span>
                      )}
                      {enrollment.course_department && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                          {enrollment.course_department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">
                      Enrolled{" "}
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Enrollments;
