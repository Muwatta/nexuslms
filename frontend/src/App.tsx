import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ArabicDashboard from "./pages/ArabicDashboard";
import WesternDashboard from "./pages/WesternDashboard";
import ProgrammingDashboard from "./pages/ProgrammingDashboard";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollments";
import Assignments from "./pages/Assignments";
import Payments from "./pages/Payments";
import Quizzes from "./pages/Quizzes";
import Analytics from "./pages/Analytics";
import ViewAchievements from "./pages/ViewAchievements";
import ViewProjects from "./pages/ViewProjects";
import ViewMilestones from "./pages/ViewMilestones";
import AIHelp from "./pages/AIHelp";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Programs from "./pages/Programs";
import Locations from "./pages/Locations";
import Contact from "./pages/Contact";
import PracticeQuestions from "./pages/PracticeQuestions";
import ManageUsers from "./pages/ManageUsers";
import ParentPortal from "./pages/ParentPortal";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AIChat from "./components/AIChat";
import Notifications from "./components/Notifications";
import { getDashboardRouteByRole, getUserData } from "./utils/authUtils";

const HomeRouter: React.FC = () => {
  const token = localStorage.getItem("access_token");

  if (token) {
    const userData = getUserData();
    if (userData) {
      const dashboardRoute = getDashboardRouteByRole(userData.role, userData.department);
      return <Navigate to={dashboardRoute} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const token = localStorage.getItem("access_token");

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar toggleSidebar={() => setSidebarOpen((v) => !v)} />
        {token && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className={`pt-16 ${token ? "md:ml-64" : ""}`}>
          <Routes>
            {/* Home Route - redirects to appropriate dashboard if logged in */}
            <Route path="/" element={<HomeRouter />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/western-dashboard"
              element={
                <ProtectedRoute>
                  <WesternDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/arabic-dashboard"
              element={
                <ProtectedRoute>
                  <ArabicDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programming-dashboard"
              element={
                <ProtectedRoute>
                  <ProgrammingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollments"
              element={
                <ProtectedRoute>
                  <Enrollments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes"
              element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <ViewAchievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ViewProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milestones"
              element={
                <ProtectedRoute>
                  <ViewMilestones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai"
              element={
                <ProtectedRoute>
                  <AIHelp />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/practice" element={<PracticeQuestions />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route
              path="/parent-portal"
              element={
                <ProtectedRoute>
                  <ParentPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <AIChat />
        <Notifications />
      </div>
    </BrowserRouter>
  );
}

export default App;
