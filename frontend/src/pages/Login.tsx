import React, { useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await api.post("/token/", { username, password });
      localStorage.setItem("access_token", resp.data.access);
      localStorage.setItem("refresh_token", resp.data.refresh);
      window.location.href = "/";
    } catch (err: any) {
      setError("Login failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-md mx-auto mt-20 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Username</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
          />
        </div>
        <div>
          <label className="block">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 dark:text-gray-300">
        Don't have an account?{" "}
        <a href="/signup" className="text-blue-500">
          Sign up
        </a>
      </p>
    </motion.div>
  );
};

export default Login;
