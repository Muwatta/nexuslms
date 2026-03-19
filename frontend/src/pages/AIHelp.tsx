import React, { useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

const AIHelp: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await api.post("/ai/", { prompt });
      setResponse(res.data.response);
    } catch (err: any) {
      setResponse(
        "Error: could not reach AI endpoint. Make sure you're logged in.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="p-6">
      <h1 className="text-3xl font-bold mb-4">AI Assistant</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Ask a question or describe what you need help with and our AI will
        respond. (Powered by OpenAI or a simple echo if not configured.)
      </p>
      <form onSubmit={submitPrompt} className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border rounded p-2 h-32 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Type your question here..."
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-cool text-white rounded hover:bg-cool-dark disabled:opacity-50"
          disabled={loading || !prompt}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </form>
      {response && (
        <div className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded">
          {response}
        </div>
      )}
    </motion.div>
  );
};

export default AIHelp;
