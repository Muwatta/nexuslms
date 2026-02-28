import React from "react";
import { Link } from "react-router-dom";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600"> 

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
        <div className="text-white text-center">
          <h2 className="text-5xl font-bold mb-6">
            Muwata Academy for Excellence
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Arabic • English • Modern ICT Skills
          </p>
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Comprehensive learning management system for students from Basic 1
            through Thanawi programs. Learn Arabic, English, and Programming
            with world-class instructors.
          </p>
          <div className="flex justify-center gap-4">
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
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Our Programs
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Western School */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
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
            </div>

            {/* Arabic School */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
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
            </div>

            {/* Programming */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
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
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
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
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.desc}</p>
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
    </div>
  );
};

export default Landing;
