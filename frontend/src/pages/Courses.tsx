import React, { useEffect, useState } from "react";
import api from "../api";

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    api.get("/courses/").then((res) => setCourses(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Courses</h2>
      <ul className="mt-4 space-y-2">
        {courses.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Courses;
