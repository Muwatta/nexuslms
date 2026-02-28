import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";

interface PQ {
  id: number;
  text: string;
  course: number;
}

const PracticeQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<PQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/practice-questions/")
      .then((res) => setQuestions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 bg-white dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Practice Questions
        </h1>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <motion.div
                key={q.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <p className="text-gray-800 dark:text-gray-200">{q.text}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No questions yet.</p>
        )}
      </div>
    </motion.div>
  );
};

export default PracticeQuestions;
