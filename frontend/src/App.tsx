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
import About from "./pages/About";
import Programs from "./pages/Programs";
import Locations from "./pages/Locations";
import Contact from "./pages/Contact";
import PracticeQuestions from "./pages/PracticeQuestions";
import ManageUsers from "./pages/ManageUsers";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AIChat from "./components/AIChat";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/practice" element={<PracticeQuestions />} />
            <Route path="/manage-users" element={<ManageUsers />} />
          </Routes>
        </main>
        <AIChat />
      </div>
    </BrowserRouter>
  );
}

export default App;
