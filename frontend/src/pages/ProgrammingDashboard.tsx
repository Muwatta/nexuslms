import React, { useEffect, useState } from "react";
import api from "../api";
import StatsCard from "../components/StatsCard";
import PaymentSection from "../components/PaymentSection";

const ProgrammingDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
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
      api
        .get("/projects/")
        .then((res) => setProjects(res.data))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-black min-h-screen text-white">
      {/* Header with Terminal Style */}
      <div className="mb-8 font-mono">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💻</span>
          <h1 className="text-4xl font-bold text-cyan-400">
            PROGRAMMING ACADEMY
          </h1>
        </div>
        <p className="text-gray-400 text-lg">&gt; Build. Code. Innovate.</p>
        {profile && (
          <>
            <p className="text-gray-500 mt-2">
              user@nexuslms ~ $ {profile.user?.username} | level:{" "}
              {profile.student_class}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Navigate using the menu to explore courses, projects, and badges.
              Dark mode toggle is available at the top.
            </p>
          </>
        )}
        {profile && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400">Payments</h2>
            <PaymentSection profile={profile} />
          </div>
        )}
      </div>

      {/* Tech Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon="📦"
          label="Projects"
          value={projects.length}
          color="cool"
        />
        <StatsCard
          icon="✅"
          label="Courses Complete"
          value={courses.length}
          color="cool"
        />
        <StatsCard icon="🐙" label="GitHub Repos" value="5" color="cool" />
        <StatsCard icon="⚡" label="Skill Points" value="2,450" color="cool" />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="md:col-span-2">
          <div className="bg-slate-700 border border-cyan-500 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 font-mono">
              &gt; Active Projects
            </h2>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="bg-slate-600 border border-slate-500 rounded p-4 hover:border-cyan-500 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-cyan-300 font-mono">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Status:{" "}
                          <span
                            className={`${
                              project.status === "active"
                                ? "text-emerald-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {project.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-24 h-2 bg-slate-500 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            style={{ width: "78%" }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          78% Complete
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  No active projects. Start coding!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skills & Badges */}
        <div className="bg-slate-700 border border-purple-500 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-purple-400 mb-4 font-mono">
            &gt; Badges
          </h2>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-slate-600 border border-purple-500 rounded p-3 text-center hover:bg-slate-500 transition"
                >
                  <p className="text-2xl mb-1">🎖️</p>
                  <p className="text-xs font-bold text-purple-300">
                    {achievement.achievement_type}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No badges earned yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Resources */}
      <div className="mt-6 bg-slate-700 border border-slate-600 rounded-lg p-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-3 font-mono">
          &gt; Learning Resources
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Git & GitHub", icon: "🐙", color: "gray" },
            { name: "Web Development", icon: "🌐", color: "blue" },
            { name: "Data Structures", icon: "🔗", color: "amber" },
          ].map((resource, i) => (
            <div
              key={i}
              className="bg-slate-600 border border-slate-500 rounded p-4 hover:border-cyan-500 transition text-center"
            >
              <p className="text-2xl mb-2">{resource.icon}</p>
              <p className="font-mono text-sm text-gray-300">{resource.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="mt-6 bg-slate-800 border-l-4 border-cyan-500 p-4 rounded font-mono">
        <p className="text-cyan-400">
          $ Keep building amazing projects! Your journey to becoming a coding
          expert starts here.
        </p>
      </div>
    </div>
  );
};

export default ProgrammingDashboard;
