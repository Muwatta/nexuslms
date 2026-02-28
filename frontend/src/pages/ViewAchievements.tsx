import React, { useEffect, useState } from "react";
import api from "../api";

interface Achievement {
  id: number;
  student: number;
  course: number;
  title: string;
  achievement_type: string;
  date_earned: string;
}

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api
      .get("/achievements/")
      .then((res) => setAchievements(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAchievements =
    filter === "all"
      ? achievements
      : achievements.filter((a) => a.achievement_type === filter);

  const achievementTypes = [
    ...new Set(achievements.map((a) => a.achievement_type)),
  ];

  const getIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      certificate: "📜",
      badge: "🎖️",
      award: "🏆",
      milestone: "🌟",
      completion: "✅",
    };
    return icons[type] || "⭐";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-900">
            🏆 My Achievements
          </h1>
          <p className="text-yellow-700 mt-2">
            Celebrate your learning journey with earned certificates and badges
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full font-medium transition ${
              filter === "all"
                ? "bg-yellow-500 text-white"
                : "bg-white text-yellow-700 border border-yellow-200 hover:border-yellow-500"
            }`}
          >
            All ({achievements.length})
          </button>
          {achievementTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === type
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-yellow-700 border border-yellow-200 hover:border-yellow-500"
              }`}
            >
              {type} (
              {achievements.filter((a) => a.achievement_type === type).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-yellow-600">Loading achievements...</p>
          </div>
        ) : filteredAchievements.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 border-t-4 border-yellow-500"
              >
                <div className="text-5xl mb-4 text-center">
                  {getIcon(achievement.achievement_type)}
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {achievement.title}
                </h2>
                <p className="text-sm text-gray-600 text-center mb-3">
                  {achievement.achievement_type}
                </p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <span className="mr-2">📅</span>
                  {new Date(achievement.date_earned).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-2xl text-gray-500">
              No achievements yet. Keep learning! 📚
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
