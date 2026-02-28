import React, { useEffect, useState } from "react";
import api from "../api";

interface Project {
  id: number;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  course: number;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    api
      .get("/projects/")
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects =
    filterStatus === "all"
      ? projects
      : projects.filter((p) => p.status === filterStatus);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: "bg-green-100 text-green-800 border-green-300",
      completed: "bg-blue-100 text-blue-800 border-blue-300",
      archived: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      active: "🚀",
      completed: "✅",
      archived: "📦",
    };
    return icons[status] || "📋";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-900">📋 Projects</h1>
          <p className="text-purple-700 mt-2">
            Track your course projects and see what you've been working on
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "active", "completed", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full font-medium transition capitalize ${
                filterStatus === status
                  ? "bg-purple-500 text-white"
                  : "bg-white text-purple-700 border border-purple-200 hover:border-purple-500"
              }`}
            >
              {status === "all"
                ? `All (${projects.length})`
                : `${status} (${projects.filter((p) => p.status === status).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-purple-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const startDate = new Date(project.start_date);
              const endDate = new Date(project.end_date);
              const today = new Date();
              const totalDays =
                (endDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24);
              const elapsedDays =
                (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
              const progress = Math.min(
                100,
                Math.max(0, (elapsedDays / totalDays) * 100),
              );

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-purple-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {project.title}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}
                        >
                          {getStatusIcon(project.status)} {project.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4 text-sm text-gray-600">
                    <p>
                      📅 Started: {startDate.toLocaleDateString()} | Due:{" "}
                      {endDate.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {project.status === "active" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-purple-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium">
                      View Details
                    </button>
                    {project.status === "active" && (
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium">
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-2xl text-gray-500">
              No projects in this category yet 📭
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
