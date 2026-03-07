import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    email: "",
    role: "student",
    department: "western",
    student_class: "JSS1",
    bio: "",
    phone: "",
    parent_email: "",
  });
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [classChoices, setClassChoices] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchClassChoices = async () => {
      try {
        const response = await api.get(
          `/class-choices/?department=${formData.department}`,
        );
        setClassChoices(response.data.classes);
        if (
          response.data.classes.length > 0 &&
          !response.data.classes.find(
            (c: { value: string; label: string }) =>
              c.value === formData.student_class,
          )
        ) {
          setFormData((prev) => ({
            ...prev,
            student_class: response.data.classes[0].value,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch class choices:", err);
      }
    };
    fetchClassChoices();
  }, [formData.department]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        // ── Name fields — now sent to the API ──────────────────────────
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "student" && {
          department: formData.department,
          student_class: formData.student_class,
          bio: formData.bio,
          phone: formData.phone,
          parent_email: formData.parent_email,
        }),
      };
      await api.post("/register/", payload);
      setMessage("✅ Registration successful! Please login.");
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        email: "",
        role: "student",
        department: "western",
        student_class: "JSS1",
        bio: "",
        phone: "",
        parent_email: "",
      });
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data?.error || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
        dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 w-full max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-white">
          Join Muwata Academy
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Create your account to start learning
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Full name — NEW ───────────────────────────────────────────── */}
          <div>
            <h3
              className="text-sm font-semibold text-gray-500 dark:text-gray-400
              uppercase tracking-wide mb-3"
            >
              Your Name
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Fatima"
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-400"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Al-Rashid"
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ── Account credentials ───────────────────────────────────────── */}
          <div>
            <h3
              className="text-sm font-semibold text-gray-500 dark:text-gray-400
              uppercase tracking-wide mb-3"
            >
              Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. fatima123"
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-400"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-400"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700
                  dark:text-gray-300 mb-1"
                >
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600
                    dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Student-specific fields ───────────────────────────────────── */}
          {formData.role === "student" && (
            <>
              <div className="border-t dark:border-gray-700 pt-4">
                <h3
                  className="text-sm font-semibold text-gray-500 dark:text-gray-400
                  uppercase tracking-wide mb-3"
                >
                  📚 School Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700
                      dark:text-gray-300 mb-2"
                    >
                      Department *
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "western", label: "🌍 Western School" },
                        { value: "arabic", label: "🕌 Arabic School" },
                        { value: "programming", label: "💻 Programming" },
                      ].map((dept) => (
                        <label
                          key={dept.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="department"
                            value={dept.value}
                            checked={formData.department === dept.value}
                            onChange={handleInputChange}
                            className="accent-blue-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {dept.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700
                      dark:text-gray-300 mb-1"
                    >
                      Class Level *
                    </label>
                    <select
                      name="student_class"
                      value={formData.student_class}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 dark:border-gray-600
                        dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {classChoices.map((cls) => (
                        <option key={cls.value} value={cls.value}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h3
                  className="text-sm font-semibold text-gray-500 dark:text-gray-400
                  uppercase tracking-wide mb-3"
                >
                  👤 Personal Information
                </h3>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700
                    dark:text-gray-300 mb-1"
                  >
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full border border-gray-300 dark:border-gray-600
                      dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      placeholder:text-gray-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700
                      dark:text-gray-300 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234..."
                      className="w-full border border-gray-300 dark:border-gray-600
                        dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700
                      dark:text-gray-300 mb-1"
                    >
                      Parent's Email
                    </label>
                    <input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleInputChange}
                      placeholder="parent@email.com"
                      className="w-full border border-gray-300 dark:border-gray-600
                        dark:bg-gray-700 dark:text-white rounded-lg p-2.5 text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Message */}
          {message && (
            <p
              className={`p-3 rounded-lg text-sm font-medium
              ${
                message.includes("✅")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}
            >
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600
              hover:from-blue-600 hover:to-indigo-700
              text-white px-4 py-3 rounded-lg font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </motion.div>
  );
};

export default Signup;
