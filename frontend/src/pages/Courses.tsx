import React, { useEffect, useState } from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import BackButton from "../components/BackButton";

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const userData = getUserData();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    api
      .get("/courses/")
      .then((res) => {
        setCourses(res.data.results || []);
      })
      .catch((err) => {
        setError("Failed to load courses");
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/courses/", newCourse);
      setNewCourse({ title: "", description: "" });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setError("Failed to add course");
    }
  };

  const isInstructor = userData?.role === "instructor";

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Courses</h2>
        {isInstructor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showForm ? "Cancel" : "Add Course"}
          </button>
        )}
      </div>

      {showForm && isInstructor && (
        <form
          onSubmit={handleAddCourse}
          className="mb-4 p-4 bg-gray-100 rounded"
        >
          <div className="mb-2">
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              value={newCourse.title}
              onChange={(e) =>
                setNewCourse({ ...newCourse, title: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse({ ...newCourse, description: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Course
          </button>
        </form>
      )}

      <ul className="mt-4 space-y-2">
        {courses.map((c) => (
          <li key={c.id} className="p-2 bg-gray-100 rounded">
            {c.title} — {c.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Courses;
