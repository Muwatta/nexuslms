import React, { useEffect, useState } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/BackButton";
import AnimatedButton from "../components/AnimatedButton";

interface Profile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  role: string;
  instructor_type?: string;
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
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student",
    department: "western",
    student_class: "JSS1",
    instructor_type: "",
  });
  const [classChoices, setClassChoices] = useState<
    { value: string; label: string }[]
  >([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      setMessage({
        type: "success",
        text: `Synced ${resp.data.processed.length} users`,
      });
      setSelected([]);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Sync failed: " + (err.response?.data || err.message),
      });
    }
  };

  const handleEdit = (profile: any) => {
    setEditingId(profile.id);
    setShowForm(true);
    setNewUser({
      username: profile.user.username,
      password: "",
      first_name: profile.user.first_name || "",
      last_name: profile.user.last_name || "",
      role: profile.role,
      department: profile.department || "western",
      student_class: profile.student_class || "",
    });
  };

  const handleDelete = async (profile: any) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/profiles/${profile.id}/`);
      setMessage({ type: "success", text: "User deleted successfully" });
      const res = await api.get("/profiles/");
      setProfiles(res.data);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Delete failed: " + (err.response?.data || err.message),
      });
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
        const payload: any = { ...newUser };
        if (!payload.password) delete payload.password;
        await api.patch(`/profiles/${editingId}/`, payload);
        setMessage({ type: "success", text: "User updated successfully" });
      } else {
        await api.post("/register/", newUser);
        setMessage({ type: "success", text: "User created successfully" });
      }
      setShowForm(false);
      setEditingId(null);
      setNewUser({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "student",
        department: "western",
        student_class: "JSS1",
      });
      const res = await api.get("/profiles/");
      setProfiles(res.data);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text:
          "Failed: " +
          (err.response?.data?.username?.[0] ||
            err.response?.data ||
            err.message),
      });
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const roleMatch = filterRole === "all" || p.role === filterRole;
    const deptMatch = filterDept === "all" || p.department === filterDept;
    return roleMatch && deptMatch;
  });

  const stats = {
    total: profiles.length,
    students: profiles.filter((p) => p.role === "student").length,
    instructors: profiles.filter((p) => p.role === "instructor").length,
    admins: profiles.filter((p) => p.role === "admin").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            👥 User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all system users, roles, and permissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Users",
              value: stats.total,
              icon: "👥",
              color: "blue",
            },
            {
              label: "Students",
              value: stats.students,
              icon: "🎓",
              color: "green",
            },
            {
              label: "Instructors",
              value: stats.instructors,
              icon: "👨‍🏫",
              color: "purple",
            },
            { label: "Admins", value: stats.admins, icon: "⚙️", color: "red" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ translateY: -4 }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-${stat.color}-500`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message Notification */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-3 flex-wrap">
            {me &&
              (me.role === "admin" ||
                me.role === "teacher" ||
                me.role === "instructor") && (
                <AnimatedButton
                  variant="primary"
                  onClick={() => {
                    setEditingId(null);
                    setNewUser({
                      username: "",
                      password: "",
                      first_name: "",
                      last_name: "",
                      role: "student",
                      department: "western",
                      student_class: "JSS1",
                      instructor_type: "",
                    });
                    setShowForm(true);
                  }}
                  icon="➕"
                >
                  Add New User
                </AnimatedButton>
              )}
            {selected.length > 0 && (
              <AnimatedButton
                variant="secondary"
                icon="🔄"
                onClick={handleSyncGroups}
              >
                Sync Groups ({selected.length})
              </AnimatedButton>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="parent">Parents</option>
            </select>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              <option value="western">Western School</option>
              <option value="arabic">Arabic School</option>
              <option value="programming">Programming</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selected.length === filteredProfiles.length &&
                        filteredProfiles.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(filteredProfiles.map((p) => p.id));
                        } else {
                          setSelected([]);
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {`${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() ||
                              p.user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {p.user.first_name} {p.user.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            p.role === "admin"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : p.role === "instructor"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : p.role === "student"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {p.role.charAt(0).toUpperCase() + p.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {p.department === "western"
                          ? "Western"
                          : p.department === "arabic"
                            ? "Arabic"
                            : "Programming"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {p.student_class || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {p.student_id || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <AnimatedButton
                            size="sm"
                            variant="primary"
                            icon="✏️"
                            onClick={() => handleEdit(p)}
                          >
                            Edit
                          </AnimatedButton>
                          <AnimatedButton
                            size="sm"
                            variant="danger"
                            icon="🗑️"
                            onClick={() => handleDelete(p)}
                          >
                            Delete
                          </AnimatedButton>
                          <AnimatedButton
                            size="sm"
                            variant="secondary"
                            icon="🔒"
                            onClick={async () => {
                              const pwd = window.prompt("Enter new password:");
                              if (pwd) {
                                try {
                                  await api.post(
                                    `/profiles/${p.id}/set_password/`,
                                    {
                                      password: pwd,
                                    },
                                  );
                                  setMessage({
                                    type: "success",
                                    text: "Password updated",
                                  });
                                  setTimeout(() => setMessage(null), 3000);
                                } catch (err: any) {
                                  setMessage({
                                    type: "error",
                                    text:
                                      "Password change failed: " +
                                      (err.response?.data || err.message),
                                  });
                                }
                              }
                            }}
                          >
                            Password
                          </AnimatedButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {editingId ? "✏️ Edit User" : "➕ Add New User"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        placeholder="First name"
                        value={newUser.first_name}
                        onChange={handleInput}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        name="last_name"
                        placeholder="Last name"
                        value={newUser.last_name}
                        onChange={handleInput}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        name="username"
                        placeholder="Enter username"
                        value={newUser.username}
                        onChange={handleInput}
                        required
                        disabled={!!editingId}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password {editingId && "(leave blank to keep current)"}
                      </label>
                      <input
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        value={newUser.password}
                        onChange={handleInput}
                        required={!editingId}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        name="role"
                        value={newUser.role}
                        onChange={handleInput}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                      >
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {newUser.role === "instructor" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Instructor Type
                        </label>
                        <select
                          name="instructor_type"
                          value={newUser.instructor_type}
                          onChange={handleInput}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                        >
                          <option value="">Select Type</option>
                          <option value="subject">Subject Instructor</option>
                          <option value="class">Class Instructor</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department
                      </label>
                      <select
                        name="department"
                        value={newUser.department}
                        onChange={handleInput}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                      >
                        <option value="western">Western School</option>
                        <option value="arabic">Arabic School</option>
                        <option value="programming">Programming School</option>
                      </select>
                    </div>

                    {newUser.role === "student" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Class
                        </label>
                        <select
                          name="student_class"
                          value={newUser.student_class}
                          onChange={handleInput}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                        >
                          {classChoices.map((cls) => (
                            <option key={cls.value} value={cls.value}>
                              {cls.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <AnimatedButton
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton variant="success" type="submit" icon="✨">
                      {editingId ? "Update User" : "Create User"}
                    </AnimatedButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ManageUsers;
