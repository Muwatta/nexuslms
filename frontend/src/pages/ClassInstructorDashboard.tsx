import React, { useEffect, useState } from "react";
import api from "../api";
import AnimatedButton from "../components/AnimatedButton";
import { motion } from "framer-motion";

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course: any;
}

interface Student {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    username: string;
  };
  student_id: string;
  student_class: string;
}

interface Instructor {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  instructor_type: string;
}

const ClassInstructorDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState<
    "assignments" | "subjects" | "students" | "results" | "instructors"
  >("students");
  const [loading, setLoading] = useState(true);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [showNewAssignmentForm, setShowNewAssignmentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    email: "",
  });
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch assignments
      const assignRes = await api.get("/assignments/");
      setAssignments(assignRes.data || []);

      // Fetch students
      const studRes = await api.get("/enrollments/");
      const uniqueStudents = Array.from(
        new Map(
          studRes.data.map((enrollment: any) => [
            enrollment.student.id,
            enrollment.student,
          ]),
        ).values(),
      );
      setStudents(uniqueStudents as Student[]);

      // Fetch instructors
      const instrRes = await api.get("/profiles/?role=instructor");
      setInstructors(instrRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/register/", {
        ...newStudent,
        role: "student",
      });
      setNewStudent({
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        email: "",
      });
      setShowNewStudentForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating student:", error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/assignments/", newAssignment);
      setNewAssignment({ title: "", description: "", due_date: "" });
      setShowNewAssignmentForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏫 Class Instructor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your class, students, and academic activities
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { id: "students", label: "👥 Students", icon: "👨‍🎓" },
            { id: "assignments", label: "📝 Assignments", icon: "✉️" },
            { id: "subjects", label: "📖 Subjects", icon: "📚" },
            { id: "results", label: "📊 Results", icon: "📈" },
            {
              id: "instructors",
              label: "👨‍🏫 Instructors",
              icon: "👨‍🏫",
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`p-4 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          {activeTab === "students" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  👥 Class Students
                </h2>
                <AnimatedButton
                  variant="primary"
                  onClick={() => setShowNewStudentForm(!showNewStudentForm)}
                  icon="➕"
                >
                  {showNewStudentForm ? "Cancel" : "Register Student"}
                </AnimatedButton>
              </div>

              {showNewStudentForm && (
                <form
                  onSubmit={handleCreateStudent}
                  className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newStudent.first_name}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        first_name: e.target.value,
                      })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newStudent.last_name}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={newStudent.username}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, username: e.target.value })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newStudent.password}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, password: e.target.value })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <AnimatedButton variant="success" type="submit" icon="✓">
                    Register Student
                  </AnimatedButton>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Student ID</th>
                      <th className="text-left py-2 px-2">Class</th>
                      <th className="text-left py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-2 px-2 dark:text-white">
                          {student.user.first_name} {student.user.last_name}
                        </td>
                        <td className="py-2 px-2 dark:text-gray-400">
                          {student.student_id}
                        </td>
                        <td className="py-2 px-2 dark:text-gray-400">
                          {student.student_class}
                        </td>
                        <td className="py-2 px-2">
                          <AnimatedButton variant="secondary" size="sm">
                            Edit
                          </AnimatedButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📝 Assignments
                </h2>
                <AnimatedButton
                  variant="primary"
                  onClick={() =>
                    setShowNewAssignmentForm(!showNewAssignmentForm)
                  }
                  icon="➕"
                >
                  {showNewAssignmentForm ? "Cancel" : "New Assignment"}
                </AnimatedButton>
              </div>

              {showNewAssignmentForm && (
                <form
                  onSubmit={handleCreateAssignment}
                  className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <input
                    type="text"
                    placeholder="Assignment Title"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newAssignment.due_date}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        due_date: e.target.value,
                      })
                    }
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-600 dark:text-white"
                    required
                  />
                  <AnimatedButton variant="success" type="submit" icon="✓">
                    Create Assignment
                  </AnimatedButton>
                </form>
              )}

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    No assignments created yet.
                  </p>
                ) : (
                  assignments.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      whileHover={{ x: 5 }}
                      className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "subjects" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📖 Subjects
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your class subjects will appear here.
              </p>
            </div>
          )}

          {activeTab === "results" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 Student Results
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-2">Student</th>
                      <th className="text-left py-2 px-2">1st Test</th>
                      <th className="text-left py-2 px-2">2nd Test</th>
                      <th className="text-left py-2 px-2">Attendance</th>
                      <th className="text-left py-2 px-2">Assignment</th>
                      <th className="text-left py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b dark:border-gray-700"
                      >
                        <td className="py-2 px-2 dark:text-white">
                          {student.user.first_name}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="-"
                            className="w-12 p-1 border rounded dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="-"
                            className="w-12 p-1 border rounded dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="-"
                            className="w-12 p-1 border rounded dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="-"
                            className="w-12 p-1 border rounded dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-2 font-bold">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "instructors" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                👨‍🏫 Class Instructors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {instructors.map((instructor) => (
                  <motion.div
                    key={instructor.id}
                    whileHover={{ y: -5 }}
                    className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {instructor.user.first_name} {instructor.user.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Type:{" "}
                      {instructor.instructor_type === "subject"
                        ? "Subject Instructor"
                        : "Class Instructor"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClassInstructorDashboard;
