import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollments";
import Assignments from "./pages/Assignments";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import ViewAchievements from "./pages/ViewAchievements";
import ViewProjects from "./pages/ViewProjects";
import ViewMilestones from "./pages/ViewMilestones";
import AIHelp from "./pages/AIHelp";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
