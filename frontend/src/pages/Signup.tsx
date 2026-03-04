import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
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

  // Fetch class choices based on selected department
  useEffect(() => {
    const fetchClassChoices = async () => {
      try {
        const response = await api.get(
          `/class-choices/?department=${formData.department}`,
        );
        setClassChoices(response.data.classes);
        // Set first class as default if current selection is invalid
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">
          Join Muwata Academy
        </h2>
        <p className="text-gray-600 mb-6">
          Create your account to start learning
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Student-specific fields */}
          {formData.role === "student" && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📚 School Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          value: "western",
                          label: "🌍 Western School",
                        },
                        { value: "arabic", label: "🕌 Arabic School" },
                        {
                          value: "programming",
                          label: "💻 Programming",
                        },
                      ].map((dept) => (
                        <label key={dept.value} className="flex items-center">
                          <input
                            type="radio"
                            name="department"
                            value={dept.value}
                            checked={formData.department === dept.value}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {dept.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Level *
                    </label>
                    <select
                      name="student_class"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.student_class}
                      onChange={handleInputChange}
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

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  👤 Personal Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent's Email
                    </label>
                    <input
                      type="email"
                      name="parent_email"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.parent_email}
                      onChange={handleInputChange}
                      placeholder="parent@email.com"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Message */}
          {message && (
            <p
              className={`p-3 rounded-lg text-sm font-medium ${
                message.includes("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Log in
            </a>
          </p>
        </form>
      </div>
    </motion.div>
  );
};

export default Signup;
