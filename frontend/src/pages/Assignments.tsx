import React, { useEffect, useState } from "react";
import api from "../api";

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/assignments/").then((res) => setAssignments(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Assignments</h2>
      <ul className="mt-4 space-y-2">
        {assignments.map((a) => (
          <li key={a.id}>{a.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Assignments;
