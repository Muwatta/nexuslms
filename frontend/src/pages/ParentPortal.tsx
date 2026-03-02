import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface Child {
  id: number;
  user: { username: string; first_name?: string; last_name?: string };
  department: string;
  student_class?: string;
}

interface ChildProgress {
  childId: number;
  childName: string;
  enrollments: Array<{ id: number; course: string }>;
  completedAssignments: number;
  totalAssignments: number;
  averageQuizScore: number;
  achievements: number;
}

const ParentPortal: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [quizScores, setQuizScores] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  const fetchChildren = async () => {
    try {
      // Fetch the parent's profile to get department
      const profileRes = await api.get("/profiles/");
      const parentProfile = profileRes.data?.[0];

      if (parentProfile && parentProfile.department) {
        // Fetch students in same department to show as "children"
        const studentsRes = await api.get(
          "/profiles/?role=student&department=" + parentProfile.department,
        );
        const studentsData = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : [];
        setChildren(studentsData);
      }
    } catch (err) {
      console.error("Failed to fetch children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildProgress = async (child: Child) => {
    setSelectedChild(child);
    try {
      // Fetch enrollments
      const enrollRes = await api.get(`/enrollments/?student=${child.id}`);
      const enrollData = Array.isArray(enrollRes.data) ? enrollRes.data : [];
      setEnrollments(enrollData);

      // Fetch submissions
      const subRes = await api.get(
        `/assignment-submissions/?student=${child.id}`,
      );
      const subData = Array.isArray(subRes.data) ? subRes.data : [];
      setSubmissions(subData);

      // Fetch quiz scores
      const quizRes = await api.get(`/quiz-submissions/?student=${child.id}`);
      const quizData = Array.isArray(quizRes.data) ? quizRes.data : [];
      setQuizScores(quizData);

      // Fetch achievements
      const achRes = await api.get(`/achievements/?student=${child.id}`);
      const achData = Array.isArray(achRes.data) ? achRes.data : [];
      setAchievements(achData);

      // Calculate progress
      const progressData: ChildProgress = {
        childId: child.id,
        childName: `${child.user.first_name || ""} ${child.user.last_name || child.user.username}`,
        enrollments: enrollData,
        completedAssignments: subData.filter((s: any) => s.published).length,
        totalAssignments: subData.length,
        averageQuizScore:
          quizData.length > 0
            ? quizData.reduce(
                (sum: number, q: any) => sum + (q.score || 0),
                0,
              ) / quizData.length
            : 0,
        achievements: achData.length,
      };
      setProgress(progressData);
    } catch (err) {
      console.error("Failed to fetch child progress:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-900 min-h-screen"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          👨‍👩‍👧 Parent Portal
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Monitor your child's academic progress, assignments, and achievements.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : children.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No students found in your department to monitor. Contact
            administration for access.
          </p>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {/* Children List */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
                Students
              </h2>
              <ul className="space-y-2">
                {children.map((child) => (
                  <li key={child.id}>
                    <button
                      onClick={() => fetchChildProgress(child)}
                      className={`w-full text-left p-2 rounded transition ${
                        selectedChild?.id === child.id
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-semibold">{child.user.username}</div>
                      <div className="text-xs opacity-75">
                        {child.student_class || "Unassigned"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress Details */}
            <div className="md:col-span-3">
              {progress ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-4 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Enrolled Courses
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                        {progress.enrollments.length}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-green-100 dark:bg-green-900 p-4 rounded-lg"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Assignments Done
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                        {progress.completedAssignments}/
                        {progress.totalAssignments}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Avg Quiz Score
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                        {Math.round(progress.averageQuizScore)}%
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Achievements
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                        {progress.achievements}
                      </div>
                    </motion.div>
                  </div>

                  {/* Enrollments */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-gray-900 dark:text-white">
                      📚 Courses
                    </h3>
                    {enrollments.length > 0 ? (
                      <ul className="space-y-2">
                        {enrollments.map((e) => (
                          <li
                            key={e.id}
                            className="text-gray-700 dark:text-gray-300 text-sm"
                          >
                            • {e.course}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No enrollments yet.
                      </p>
                    )}
                  </div>

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-bold mb-3 text-gray-900 dark:text-white">
                        🏆 Achievements
                      </h3>
                      <ul className="space-y-2">
                        {achievements.map((a) => (
                          <li
                            key={a.id}
                            className="p-2 bg-yellow-50 dark:bg-yellow-900 rounded text-sm text-gray-700 dark:text-gray-300"
                          >
                            <div className="font-semibold">{a.title}</div>
                            <div className="text-xs opacity-75">
                              {a.achievement_type}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recent Quizzes */}
                  {quizScores.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-bold mb-3 text-gray-900 dark:text-white">
                        ❓ Recent Quizzes
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {quizScores.map((q) => (
                          <div
                            key={q.id}
                            className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {q.quiz}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-300">
                              {q.score}/{q.total_marks || "?"} (
                              {Math.round(
                                (q.score / (q.total_marks || 1)) * 100,
                              )}
                              %)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Select a student to view progress
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParentPortal;
