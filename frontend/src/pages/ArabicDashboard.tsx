import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import StatsCard from "../components/StatsCard";
import PaymentSection from "../components/PaymentSection";
import { getUserData } from "../utils/authUtils";

const ArabicDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userData = getUserData();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api
        .get("/profiles/")
        .then((res) => {
          const profiles = res.data;
          if (profiles.length > 0) setProfile(profiles[0]);
        })
        .catch(() => {}),
      api
        .get("/achievements/")
        .then((res) => setAchievements(res.data.results || []))
        .catch(() => {}),
      api
        .get("/courses/")
        .then((res) => setCourses(res.data.results || []))
        .catch(() => {}),
    ])
      .then(() => {
        if (profile?.role === "instructor") {
          // Load additional data for instructors
          Promise.all([
            api
              .get("/profiles/")
              .then((res) =>
                setStudents(res.data.filter((p: any) => p.role === "student")),
              ),
            api
              .get("/quiz-submissions/")
              .then((res) => setSubmissions(res.data.results || [])),
            api.get("/assignment-submissions/").then((res) => {
              const assignmentSubs = res.data.results || [];
              setSubmissions((prev) => [...prev, ...assignmentSubs]);
            }),
          ]).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [profile?.role]);

  // Access control check
  useEffect(() => {
    if (profile && userData) {
      const userRole = profile.role;
      const userDepartment = profile.department;

      // Admins can access all dashboards
      if (userRole === "admin" || userRole === "school_admin" || userRole === "super_admin") {
        return;
      }

      // Instructors and students can only access their department's dashboard
      if (
        (userRole === "instructor" || userRole === "student") &&
        userDepartment !== "arabic"
      ) {
        navigate("/unauthorized");
        return;
      }

      // If role is not recognized, redirect
      if (!["admin", "school_admin", "super_admin", "instructor", "student"].includes(userRole)) {
        navigate("/unauthorized");
      }
    }
  }, [profile, userData, navigate]);

  // Function to format name for greeting
  const getGreetingName = (): string => {
    if (profile?.user?.first_name) {
      return profile.user.first_name;
    }
    return profile?.user?.username || userData?.username || "User";
  };

  const isInstructor = profile?.role === "instructor";

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gradient-to-b from-green-50 dark:from-green-900">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-2">🕌</div>
        <h1 className="text-4xl font-bold text-green-900 dark:text-green-300">
          {isInstructor
            ? `مرحبا ${getGreetingName()} - لوحة المعلم`
            : `مرحبا ${getGreetingName()} إلى أكاديمية الموطأ`}
        </h1>
        <p className="text-lg text-green-700 dark:text-green-400">
          {isInstructor
            ? "Arabic School Instructor Dashboard"
            : "Arabic School Excellence"}
        </p>
        {profile && !isInstructor && (
          <>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              الفصل: {profile.student_class}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              استخدم شريط التنقل لعرض الدروس، الواجبات، والمزيد. قم بالتبديل بين
              الوضع الداكن والنهاري باستخدام الأيقونة في الأعلى.
            </p>
          </>
        )}
        {profile && !isInstructor && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-green-900 dark:text-green-300">
              Payments
            </h2>
            <PaymentSection profile={profile} />
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {isInstructor ? (
          <>
            <StatsCard
              icon="📖"
              label="الدروس"
              value={courses.length}
              color="cool"
            />
            <StatsCard
              icon="👥"
              label="الطلاب"
              value={students.length}
              color="cool"
            />
            <StatsCard
              icon="📝"
              label="التسليمات"
              value={submissions.length}
              color="cool"
            />
            <StatsCard
              icon="📊"
              label="التقييمات"
              value="Pending"
              color="cool"
            />
          </>
        ) : (
          <>
            <StatsCard
              icon="📖"
              label="الدروس"
              value={courses.length}
              color="cool"
            />
            <StatsCard
              icon="📜"
              label="شهادات"
              value={achievements.length}
              color="cool"
            />
            <StatsCard icon="🎓" label="المحاضرات" value="8" color="cool" />
            <StatsCard icon="📈" label="التقدم" value="78%" color="cool" />
          </>
        )}
      </div>

      {isInstructor && (
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/courses")}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              إضافة درس جديد
            </button>
            <button
              onClick={() => navigate("/manage-users")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              إضافة طالب جديد
            </button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Courses */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-4">
              {isInstructor ? "دروسي" : "دروسي"}
            </h2>
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 6).map((course) => (
                  <div
                    key={course.id}
                    className="p-4 border border-green-100 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-700 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {course.description?.substring(0, 50)}...
                        </p>
                        {isInstructor && (
                          <div className="mt-2 flex gap-2">
                            <button className="text-xs bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                              عرض التسليمات
                            </button>
                            <button className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              إضافة واجب
                            </button>
                          </div>
                        )}
                      </div>
                      {!isInstructor && (
                        <div className="text-right">
                          <div className="w-16 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: "72%" }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                            72%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">لا توجد دروس</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-t-4 border-emerald-500">
          {isInstructor ? (
            <>
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mb-4">
                التسليمات الأخيرة
              </h2>
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.slice(0, 6).map((submission) => (
                    <div
                      key={submission.id}
                      className="p-3 border border-emerald-100 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-700 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {submission.quiz?.title ||
                              submission.assignment?.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {submission.student?.user?.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    لا توجد تسليمات
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mb-4">
                العلامات
              </h2>
              {achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 6).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-3 border border-emerald-100 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-700 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌟</span>
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {achievement.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {achievement.achievement_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    لا توجد علامات حتى الآن
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Message */}
      <div className="mt-8 bg-green-100 dark:bg-green-700 border-l-4 border-green-500 dark:border-green-300 p-4 rounded">
        <p className="text-green-900 dark:text-green-200 font-medium">
          {isInstructor
            ? "🌙 جزاك الله خيراً على تعليمك - Keep inspiring!"
            : "🌙 جزاك الله خيراً على التفاني في دراستك - Keep excelling!"}
        </p>
      </div>
    </div>
  );
};

export default ArabicDashboard;
