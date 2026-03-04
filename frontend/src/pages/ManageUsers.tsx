import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface Profile {
  id: number;
  user: { id: number; username: string };
  role: string;
  department: string;
  student_class?: string;
  student_id?: string;
}

const ManageUsers: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [me, setMe] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    department: "western",
    student_class: "JSS1",
  });
  const [classChoices, setClassChoices] = useState<
    { value: string; label: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    api.get("/profiles/").then((res) => setProfiles(res.data));
    api.get("/profiles/").then((res) => {
      if (res.data.length) setMe(res.data[0]);
    });
  }, []);

  // fetch class choices whenever department changes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const resp = await api.get(
          `/class-choices/?department=${newUser.department}`,
        );
        setClassChoices(resp.data.classes);
        if (
          !resp.data.classes.find((c: any) => c.value === newUser.student_class)
        ) {
          setNewUser((u) => ({
            ...u,
            student_class: resp.data.classes[0]?.value || "",
          }));
        }
      } catch (e) {}
    };
    if (newUser.role === "student") fetchClasses();
  }, [newUser.department, newUser.role]);

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

  const handleEdit = (profile: any) => {
    setEditingId(profile.id);
    setShowForm(true);
    setNewUser({
      username: profile.user.username,
      password: "",
      role: profile.role,
      department: profile.department || "western",
      student_class: profile.student_class || "",
    });
  };

  const handleDelete = async (profile: any) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/profiles/${profile.id}/`);
      setMessage("User deleted");
      const res = await api.get("/profiles/");
      setProfiles(res.data);
    } catch (err: any) {
      setMessage("Delete failed: " + (err.response?.data || err.message));
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
      if (editingId) {
        // update existing profile (omit password if blank)
        const payload: any = { ...newUser };
        if (!payload.password) delete payload.password;
        await api.patch(`/profiles/${editingId}/`, payload);
        setMessage("Updated user");
      } else {
        await api.post("/register/", newUser);
        setMessage("Created user");
      }
      setShowForm(false);
      setEditingId(null);
      // refresh list
      const res = await api.get("/profiles/");
      setProfiles(res.data);
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
            <h3 className="text-lg font-semibold mb-2">
              {editingId ? "Edit User" : "Add User"}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="username"
                placeholder="username"
                value={newUser.username}
                onChange={handleInput}
                required
                disabled={!!editingId}
                className="border p-2 bg-gray-100"
              />
              <input
                name="password"
                type="password"
                placeholder="password"
                value={newUser.password}
                onChange={handleInput}
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
                  {classChoices.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </div>
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
              <th className="p-2">Student ID</th>
              <th className="p-2">Actions</th>
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
                <td className="p-2">{p.student_id || "-"}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-red-600 hover:underline mr-2"
                  >
                    Delete
                  </button>
                  <button
                    onClick={async () => {
                      const pwd = window.prompt("Enter new password:");
                      if (pwd) {
                        try {
                          await api.post(`/profiles/${p.id}/set_password/`, {
                            password: pwd,
                          });
                          setMessage("Password updated");
                        } catch (err: any) {
                          setMessage(
                            "Password change failed: " +
                              (err.response?.data || err.message),
                          );
                        }
                      }
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Reset password
                  </button>
                </td>
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
