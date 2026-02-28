import React, { useEffect, useState } from "react";
import api from "../api";

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/enrollments/").then((res) => setEnrollments(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Enrollments</h2>
      <ul className="mt-4 space-y-2">
        {enrollments.map((e) => (
          <li key={e.id}>{e.course}</li>
        ))}
      </ul>
    </div>
  );
};

export default Enrollments;
