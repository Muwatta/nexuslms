import React, { useState } from "react";
import api from "../api";

const Analytics: React.FC = () => {
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchCourse = async () => {
    const resp = await api.get(`/analytics/course/${courseId}/`);
    setData(resp.data);
  };

  const fetchStudent = async () => {
    const resp = await api.get(`/analytics/student/${studentId}/`);
    setData(resp.data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <div className="mt-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="course id"
            value={courseId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCourseId(e.target.value)
            }
            className="border p-2 mr-2"
          />
          <button
            onClick={fetchCourse}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Course
          </button>
        </div>
        <div>
          <input
            type="text"
            placeholder="student id"
            value={studentId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStudentId(e.target.value)
            }
            className="border p-2 mr-2"
          />
          <button
            onClick={fetchStudent}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Student
          </button>
        </div>
      </div>
      {data && (
        <pre className="mt-4 bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Analytics;
