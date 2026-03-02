import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface Profile {
  id: number;
  user: { username: string };
  role: string;
  department: string;
  student_class?: string;
}

const ManageUsers: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [me, setMe] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    department: "western",
    student_class: "B1",
  });
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    api.get("/profiles/").then((res) => setProfiles(res.data));
    api.get("/profiles/").then((res) => {
      if (res.data.length) setMe(res.data[0]);
    });
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSyncGroups = async () => {
    if (selected.length === 0) return;
    try {
      const userIds = profiles
        .filter((p) => selected.includes(p.id))
        .map((p) => p.user.id);
      const resp = await api.post("/admin/sync-groups/", { user_ids: userIds });
      setMessage(`Synced ${resp.data.processed.length} users`);
      setSelected([]);
    } catch (err: any) {
      setMessage("Sync failed: " + (err.response?.data || err.message));
    }
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewUser((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/register/", newUser);
      setMessage("Created user, reload page");
      setShowForm(false);
    } catch (err: any) {
      setMessage("Failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-6 bg-white dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Manage Users
        </h1>
        {me &&
          (me.role === "admin" ||
            me.role === "teacher" ||
            me.role === "instructor") && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add User
            </button>
          )}
        {message && <p className="mb-4 text-green-500">{message}</p>}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="username"
                placeholder="username"
                value={newUser.username}
                onChange={handleInput}
                required
                className="border p-2"
              />
              <input
                name="password"
                type="password"
                placeholder="password"
                value={newUser.password}
                onChange={handleInput}
                required
                className="border p-2"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <select
                name="role"
                value={newUser.role}
                onChange={handleInput}
                className="border p-2"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
              <select
                name="department"
                value={newUser.department}
                onChange={handleInput}
                className="border p-2"
              >
                <option value="western">Western</option>
                <option value="arabic">Arabic</option>
                <option value="programming">Programming</option>
              </select>
            </div>
            {newUser.role === "student" && (
              <div className="mt-2">
                <select
                  name="student_class"
                  value={newUser.student_class}
                  onChange={handleInput}
                  className="border p-2"
                >
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="B3">B3</option>
                  <option value="B4">B4</option>
                  <option value="B5">B5</option>
                  <option value="JSS1">JSS1</option>
                  <option value="JSS2">JSS2</option>
                  <option value="JSS3">JSS3</option>
                  <option value="SS1">SS1</option>
                  <option value="SS2">SS2</option>
                  <option value="SS3">SS3</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
            >
              Create
            </button>
          </form>
        )}
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="p-2"> </th>
              <th className="p-2">Username</th>
              <th className="p-2">Role</th>
              <th className="p-2">Dept</th>
              <th className="p-2">Class</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                </td>
                <td className="p-2">{p.user.username}</td>
                <td className="p-2 capitalize">{p.role}</td>
                <td className="p-2">{p.department}</td>
                <td className="p-2">{p.student_class}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <button
            onClick={handleSyncGroups}
            disabled={selected.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            Sync groups for selected
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ManageUsers;
