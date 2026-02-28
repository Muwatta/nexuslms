import React, { useEffect, useState } from "react";
import api from "../api";

interface Milestone {
  id: number;
  title: string;
  progress_percentage: number;
  related_to: string;
  course: number;
}

const Milestones: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/milestones/")
      .then((res) => setMilestones(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getMilestoneIcon = (relatedTo: string) => {
    const icons: { [key: string]: string } = {
      enrollment: "📚",
      assignment: "📝",
      quiz: "📊",
      project: "🚀",
    };
    return icons[relatedTo] || "⭐";
  };

  // Group by related_to
  const groupedMilestones = milestones.reduce(
    (groups, milestone) => {
      const key = milestone.related_to || "other";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(milestone);
      return groups;
    },
    {} as { [key: string]: Milestone[] },
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900">🏁 Milestones</h1>
          <p className="text-emerald-700 mt-2">
            Track your progress toward course completion and learning goals
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Milestones",
              value: milestones.length,
              icon: "🎯",
              color: "emerald",
            },
            {
              label: "Average Progress",
              value:
                milestones.length > 0
                  ? Math.round(
                      milestones.reduce(
                        (a, b) => a + b.progress_percentage,
                        0,
                      ) / milestones.length,
                    ) + "%"
                  : "0%",
              icon: "📈",
              color: "teal",
            },
            {
              label: "Completed",
              value: milestones.filter((m) => m.progress_percentage === 100)
                .length,
              icon: "✅",
              color: "green",
            },
            {
              label: "In Progress",
              value: milestones.filter(
                (m) => m.progress_percentage > 0 && m.progress_percentage < 100,
              ).length,
              icon: "⚡",
              color: "yellow",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-${stat.color}-100 border-lg border-${stat.color}-300 p-4 rounded-lg`}
            >
              <p className="text-2xl mb-2">{stat.icon}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-emerald-600">Loading milestones...</p>
          </div>
        ) : milestones.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedMilestones).map(([category, items]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-3xl">{getMilestoneIcon(category)}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                  Milestones
                </h2>

                <div className="space-y-4">
                  {items.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {milestone.title}
                        </h3>
                        <span
                          className={`text-sm font-bold px-3 py-1 rounded-full ${
                            milestone.progress_percentage === 100
                              ? "bg-green-100 text-green-800"
                              : milestone.progress_percentage >= 75
                                ? "bg-blue-100 text-blue-800"
                                : milestone.progress_percentage >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {milestone.progress_percentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              milestone.progress_percentage === 100
                                ? "bg-green-500"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500"
                            }`}
                            style={{
                              width: `${milestone.progress_percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Milestone Details */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {milestone.progress_percentage === 100
                            ? "✨ Completed!"
                            : milestone.progress_percentage > 0
                              ? "🔄 In Progress"
                              : "🔴 Not Started"}
                        </span>
                        <button className="text-emerald-600 hover:text-emerald-800 font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-2xl text-gray-500">
              No milestones yet. Start your courses to unlock milestones! 🚀
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Milestones;
