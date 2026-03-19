import React from "react";
import { motion } from "framer-motion";

const Programs: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          Our Programs
        </h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">Western School</h3>
            <p className="text-gray-700 dark:text-gray-300">
              English-language curriculum with progressive classes from Basic to
              Thanawi.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">Arabic School</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Arabic language and Islamic studies across foundational and
              advanced programs.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">Programming</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Hands-on ICT courses: Web, Mobile, and Data Science.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Programs;
