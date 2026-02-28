import React, { useEffect, useState } from "react";
import api from "../api";
import StatsCard from "../components/StatsCard";

const WesternDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .then((res) => setAchievements(res.data))
        .catch(() => {}),
      api
        .get("/courses/")
        .then((res) => setCourses(res.data))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Western School
        </h1>
        {profile && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Student: {profile.user?.username} | Class: {profile.student_class}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon="📚"
          label="Enrolled Courses"
          value={courses.length}
          color="cool"
        />
        <StatsCard
          icon="🏆"
          label="Achievements"
          value={achievements.length}
          color="cool"
        />
        <StatsCard icon="📝" label="Assignments Due" value="3" color="cool" />
        <StatsCard icon="📊" label="Quiz Average" value="85%" color="cool" />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Courses section */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              My Courses
            </h2>
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {course.description?.substring(0, 50)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-cool-dark rounded-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        65%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No courses enrolled yet
              </p>
            )}
          </div>
        </div>

        {/* Achievements section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Achievements
          </h2>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="border rounded p-3 dark:border-gray-700"
                >
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {achievement.achievement_type}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No achievements yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WesternDashboard;
