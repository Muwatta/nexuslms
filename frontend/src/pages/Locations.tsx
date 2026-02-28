import React from "react";
import { motion } from "framer-motion";

const Locations: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen p-6 bg-white dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          Locations
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We offer both virtual and onsite learning:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">Virtual Campus</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Live online classes, recorded sessions, and remote tutoring
              available worldwide.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">Onsite Campus</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Our physical campus hosts select programs and workshops. Contact
              us for schedules and locations.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Locations;
