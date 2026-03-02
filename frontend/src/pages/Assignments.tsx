import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface Profile {
  id: number;
  user: { username: string; first_name?: string; last_name?: string };
  role: string;
}

interface EnrollmentRow {
  id: number;
  student: {
    id: number;
    user: { username: string; first_name?: string; last_name?: string };
  };
}

interface Submission {
  id: number;
  student: { user: { username: string } };
  score: number;
  published: boolean;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [students, setStudents] = useState<EnrollmentRow[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/assignments/").then((res) => setAssignments(res.data));
    api.get("/profiles/").then((res) => {
      if (res.data.length) setProfile(res.data[0]);
    });
  }, []);

  const loadSubs = (assignmentId: number) => {
    api
      .get(`/assignment-submissions/?assignment=${assignmentId}`)
      .then((res) => setSubs(res.data))
      .catch(() => setSubs([]));
  };

  const loadStudents = async (assignment: any) => {
    // try enrollments for the course
    try {
      const res = await api.get(`/enrollments/?course=${assignment.course}`);
      setStudents(res.data);
      // populate grades map from existing submissions
      const subsRes = await api.get(
        `/assignment-submissions/?assignment=${assignment.id}`,
      );
      const map: Record<string, string> = {};
      subsRes.data.forEach((s: any) => {
        map[String(s.student.id)] = s.grade != null ? String(s.grade) : "";
      });
      setGrades(map);
      setSubs(subsRes.data);
    } catch (e) {
      // fallback: fetch template CSV and parse it
      try {
        const csvResp = await api.get(
          `/assignments/${assignment.id}/download_template/`,
          { responseType: "blob" },
        );
        const text = await csvResp.data.text();
        const lines = text.split("\n").slice(1).filter(Boolean);
        const parsed: EnrollmentRow[] = lines.map((ln: string, idx: number) => {
          const cols = ln.split(",");
          return {
            id: idx + 1,
            student: {
              id: Number(cols[1]) || idx + 1,
              user: { username: cols[0].replace(/\"/g, "") },
            },
          };
        });
        setStudents(parsed);
      } catch (err) {
        setStudents([]);
      }
    }
  };

  const publish = (id: number) => {
    api
      .post(`/assignment-submissions/${id}/publish/`)
      .then(() => loadSubs(selected.id));
  };

  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const callAI = async (submission: any) => {
    const prompt = `Analyze student ${submission.student.user.username} with score ${submission.score} for assignment ${selected?.title || ""}. Provide a short feedback and 3 suggestions to improve.`;
    try {
      const res = await api.post("/ai/", { prompt });
      setAiResults((p) => ({
        ...p,
        [String(submission.id)]: res.data.response,
      }));
    } catch (err) {
      console.error(err);
      setAiResults((p) => ({
        ...p,
        [String(submission.id)]: "AI analysis failed",
      }));
    }
  };

  const handleSelect = (a: any) => {
    setSelected(a);
    loadSubs(a.id);
    loadStudents(a);
  };

  const handleGradeChange = (studentId: number, value: string) => {
    setGrades((prev) => ({ ...prev, [String(studentId)]: value }));
  };

  const exportCSVFromTable = () => {
    const header = ["student_username", "student_id", "student_name", "grade"];
    const rows = students.map((row) => [
      row.student.user.username,
      String(row.student.id),
      `${row.student.user.first_name || ""} ${row.student.user.last_name || ""}`.trim(),
      grades[String(row.student.id)] || "",
    ]);
    let csv =
      header.join(",") +
      "\n" +
      rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assignment_${selected.id || "export"}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadCSV = async (file: File | null) => {
    if (!file || !selected) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/assignments/${selected.id}/upload_results/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadSubs(selected.id);
      // refresh students/grades
      await loadStudents(selected);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveManualGrades = async () => {
    if (!selected) return;
    // build CSV from grades and POST it
    const header = ["student_username", "student_id", "student_name", "grade"];
    const rows = students.map((row) => [
      row.student.user.username,
      String(row.student.id),
      `${row.student.user.first_name || ""} ${row.student.user.last_name || ""}`.trim(),
      grades[String(row.student.id)] || "",
    ]);
    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const file = new File([blob], `assignment_${selected.id}_import.csv`, {
      type: "text/csv",
    });
    await uploadCSV(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Assignments</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold mb-2">Assignments</h4>
          <ul className="mt-4 space-y-2">
            {assignments.map((a) => (
              <li
                key={a.id}
                className={`cursor-pointer hover:underline p-2 rounded ${selected?.id === a.id ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                onClick={() => handleSelect(a)}
              >
                {a.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {selected ? (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selected.title}</h3>
                <div className="space-x-2">
                  <button
                    onClick={exportCSVFromTable}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Download CSV
                  </button>
                  <label className="inline-block px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) =>
                        uploadCSV(e.target.files ? e.target.files[0] : null)
                      }
                    />
                    Upload CSV
                  </label>
                  <button
                    onClick={saveManualGrades}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Save Grades
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <table className="w-full table-auto">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.student.id} className="border-t">
                        <td className="p-2">{s.student.user.username}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={grades[String(s.student.id)] || ""}
                            onChange={(e) =>
                              handleGradeChange(s.student.id, e.target.value)
                            }
                            className="border rounded px-2 py-1 w-24"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Submission Overview</h4>
                  {subs.length === 0 ? (
                    <p className="text-gray-600">No submissions yet.</p>
                  ) : (
                    <>
                      <div className="flex gap-6 items-start">
                        <table className="w-full mt-2 table-auto">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Score</th>
                              <th>Published</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subs.map((s) => (
                              <React.Fragment key={s.id}>
                                <tr className="border-t">
                                  <td>{s.student.user.username}</td>
                                  <td>{s.score}</td>
                                  <td>{s.published ? "Yes" : "No"}</td>
                                  <td className="space-x-2">
                                    {(profile?.role === "teacher" ||
                                      profile?.role === "instructor" ||
                                      profile?.role === "admin") && (
                                      <button
                                        onClick={() => publish(s.id)}
                                        className="text-blue-600"
                                      >
                                        Publish
                                      </button>
                                    )}
                                    <button
                                      onClick={() => callAI(s)}
                                      className="text-indigo-600 ml-2"
                                    >
                                      AI Analyze
                                    </button>
                                    {s.published && (
                                      <a
                                        href={`/api/assignment-submissions/${s.id}/pdf/`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-green-600 ml-2"
                                      >
                                        Download PDF
                                      </a>
                                    )}
                                  </td>
                                </tr>
                                {aiResults[String(s.id)] && (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="p-3 bg-gray-50 dark:bg-gray-800 text-sm"
                                    >
                                      <strong>AI Analysis:</strong>{" "}
                                      {aiResults[String(s.id)]}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>

                        <div className="w-64 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                          <h5 className="font-semibold mb-2">Stats</h5>
                          {/* compute pass/fail/average */}
                          {(() => {
                            const values = subs.map((s) =>
                              s.score != null ? Number(s.score) : 0,
                            );
                            const total = values.length;
                            const avg = total
                              ? values.reduce((a, b) => a + b, 0) / total
                              : 0;
                            const passed = values.filter((v) => v >= 50).length;
                            const failed = total - passed;
                            const passPct = total
                              ? Math.round((passed / total) * 100)
                              : 0;
                            const failPct = total
                              ? Math.round((failed / total) * 100)
                              : 0;
                            return (
                              <div>
                                <p className="text-sm">
                                  Total submissions: <strong>{total}</strong>
                                </p>
                                <p className="text-sm">
                                  Average score:{" "}
                                  <strong>{Math.round(avg * 100) / 100}</strong>
                                </p>
                                <div className="mt-3">
                                  <svg
                                    viewBox="0 0 32 32"
                                    width="120"
                                    height="120"
                                  >
                                    {(() => {
                                      const passAngle =
                                        (passPct / 100) * Math.PI * 2;
                                      const cx = 16,
                                        cy = 16,
                                        r = 12;
                                      const x1 = cx + r;
                                      const y1 = cy;
                                      const x2 = cx + r * Math.cos(passAngle);
                                      const y2 = cy + r * Math.sin(passAngle);
                                      const large = passPct > 50 ? 1 : 0;
                                      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
                                      return (
                                        <g>
                                          <path d={path} fill="#10B981" />
                                          <path
                                            d={`M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
                                            fill="#EF4444"
                                            opacity="0.95"
                                            transform="rotate(180 16 16)"
                                          />
                                        </g>
                                      );
                                    })()}
                                  </svg>
                                  <div className="mt-2 text-sm">
                                    <div>
                                      Passed:{" "}
                                      <strong>
                                        {passed} ({passPct}%)
                                      </strong>
                                    </div>
                                    <div>
                                      Failed:{" "}
                                      <strong>
                                        {failed} ({failPct}%)
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Select an assignment to manage grades.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Assignments;
