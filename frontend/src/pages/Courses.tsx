import React, { useEffect, useState } from "react";
import api from "../api";

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/courses/")
      .then((res) => {
        // Handle paginated response: {count, results}
        setCourses(res.data.results || []);
      })
      .catch((err) => {
        setError("Failed to load courses");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold">Courses</h2>
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
