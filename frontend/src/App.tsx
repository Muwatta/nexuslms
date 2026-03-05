import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import LoadingAnimation from "./components/LoadingAnimation";

// Lazy load all pages for better performance
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ArabicDashboard = React.lazy(() => import("./pages/ArabicDashboard"));
const WesternDashboard = React.lazy(() => import("./pages/WesternDashboard"));
const DigitalDashboard = React.lazy(() => import("./pages/DigitalDashboard"));
const Courses = React.lazy(() => import("./pages/Courses"));
const Enrollments = React.lazy(() => import("./pages/Enrollments"));
const Assignments = React.lazy(() => import("./pages/Assignments"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Quizzes = React.lazy(() => import("./pages/Quizzes"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const ViewAchievements = React.lazy(() => import("./pages/ViewAchievements"));
const ViewProjects = React.lazy(() => import("./pages/ViewProjects"));
const ViewMilestones = React.lazy(() => import("./pages/ViewMilestones"));
const AIHelp = React.lazy(() => import("./pages/AIHelp"));
const Unauthorized = React.lazy(() => import("./pages/Unauthorized"));
const About = React.lazy(() => import("./pages/About"));
const Programs = React.lazy(() => import("./pages/Programs"));
const Locations = React.lazy(() => import("./pages/Locations"));
const Contact = React.lazy(() => import("./pages/Contact"));
const PracticeQuestions = React.lazy(() => import("./pages/PracticeQuestions"));
const ManageUsers = React.lazy(() => import("./pages/ManageUsers"));
const ParentPortal = React.lazy(() => import("./pages/ParentPortal"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Landing = React.lazy(() => import("./pages/Landing"));
const Profile = React.lazy(() => import("./pages/Profile"));
const InstructorDashboard = React.lazy(
  () => import("./pages/InstructorDashboard"),
);
const SubjectInstructorDashboard = React.lazy(
  () => import("./pages/SubjectInstructorDashboard"),
);
const ClassInstructorDashboard = React.lazy(
  () => import("./pages/ClassInstructorDashboard"),
);

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
      const dashboardRoute = getDashboardRouteByRole(
        userData.role,
        userData.department,
        userData.instructor_type,
      );
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
          <Suspense
            fallback={<LoadingAnimation fullScreen message="Loading page..." />}
          >
            <Routes>
              {/* Home Route - redirects to appropriate dashboard if logged in */}
              <Route path="/" element={<HomeRouter />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
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
                path="/digital-dashboard"
                element={
                  <ProtectedRoute>
                    <DigitalDashboard />
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
              <Route
                path="/instructor-dashboard"
                element={
                  <ProtectedRoute>
                    <InstructorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subject-instructor-dashboard"
                element={
                  <ProtectedRoute>
                    <SubjectInstructorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class-instructor-dashboard"
                element={
                  <ProtectedRoute>
                    <ClassInstructorDashboard />
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
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
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
          </Suspense>
        </main>
        <AIChat />
        <Notifications />
      </div>
    </BrowserRouter>
  );
}

export default App;
