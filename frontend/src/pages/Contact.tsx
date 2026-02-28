import React from "react";
import { WHATSAPP_NUMBER, formatWhatsAppLink } from "../config/contact";
import { motion } from "framer-motion";

const Contact: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Contact Us
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          For quick support reach us on WhatsApp:
        </p>
        <a
          href={formatWhatsAppLink(WHATSAPP_NUMBER)}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          💬 Chat on WhatsApp
        </a>
        <div className="mt-6 text-gray-700 dark:text-gray-300">
          <p>
            Or email: <strong>support@muwataacademy.example</strong>
          </p>
          <p className="mt-2">Office hours: Mon–Fri, 9:00–17:00</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
