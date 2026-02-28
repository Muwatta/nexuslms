import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const heroVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const Landing: React.FC = () => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={heroVariants}
      className="min-h-screen bg-gradient-to-r from-primary to-secondary dark:from-cool-dark dark:to-indigo-900"
    >
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
        <motion.div
          className="text-white text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            variants={cardVariants}
            className="text-5xl font-bold mb-6 leading-tight"
          >
            Welcome to Muwata Academy — where your path to excellence begins
          </motion.h2>
          <motion.p variants={cardVariants} className="text-xl mb-8 opacity-90">
            Arabic • English • Modern ICT Skills
          </motion.p>
          <motion.p
            variants={cardVariants}
            className="text-lg mb-8 opacity-80 max-w-2xl mx-auto leading-relaxed"
          >
            A friendly, comprehensive platform for learners from Basic 1 to
            Thanawi. Explore Arabic, English, and Programming with inspiring
            instructors and AI-powered support.
          </motion.p>
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            className="flex justify-center gap-4"
          >
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition"
            >
              Already a Student?
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Programs Section */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Our Programs
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Western School */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260 }}
              className="border rounded-lg p-6 hover:shadow-lg transition bg-white dark:bg-gray-800"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Western School</h4>
              <p className="text-gray-600 mb-4">
                English language and Western curriculum
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Basic 1-5</li>
                <li>✓ JSS 1-3</li>
                <li>✓ SS 1-3</li>
              </ul>
            </motion.div>

            {/* Arabic School */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260 }}
              className="border rounded-lg p-6 hover:shadow-lg transition bg-white dark:bg-gray-800"
            >
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🕌</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Arabic School</h4>
              <p className="text-gray-600 mb-4">
                Arabic language and Islamic studies
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Idaady Program</li>
                <li>✓ Thanawi Program</li>
                <li>✓ Advanced Arabic</li>
              </ul>
            </motion.div>

            {/* Programming */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260 }}
              className="border rounded-lg p-6 hover:shadow-lg transition bg-white dark:bg-gray-800"
            >
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Programming</h4>
              <p className="text-gray-600 mb-4">Modern ICT and coding skills</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Web Development</li>
                <li>✓ Mobile Apps</li>
                <li>✓ Data Science</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why Choose Muwata Academy?
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🎯",
                title: "Expert Instructors",
                desc: "Experienced teachers in each discipline",
              },
              {
                icon: "📚",
                title: "Comprehensive Curriculum",
                desc: "Up-to-date courses for all levels",
              },
              {
                icon: "🏆",
                title: "Track Achievements",
                desc: "Earn certificates and badges",
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                desc: "Monitor progress and performance",
              },
              {
                icon: "🤖",
                title: "AI Tutor",
                desc: "Get instant help and study tips",
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>
            &copy; 2026 Muwata Academy. All rights reserved. Excellence in
            Education.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Landing;
