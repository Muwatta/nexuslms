import React, { useState } from "react";
import api from "../api";

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
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
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
      <p className="mt-4">
        Don't have an account?{" "}
        <a href="/signup" className="text-blue-500">
          Sign up
        </a>
      </p>
    </div>
  );
};

export default Login;
