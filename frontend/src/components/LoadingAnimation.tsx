import React from "react";
import { motion } from "framer-motion";

interface LoadingAnimationProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Loading...",
  fullScreen = false,
}) => {
  // Animation variants for the bouncing dots
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -10, 0],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        delay: i * 0.2,
      },
    }),
  };

  // Robot with pen animation
  const robotVariants = {
    animate: {
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  // Pen animation
  const penVariants = {
    animate: {
      y: [0, 8, 0],
      x: [0, 3, -3, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-6">
        {/* Robot with Pen Animation */}
        <div className="relative w-20 h-20">
          {/* Robot body */}
          <motion.div
            variants={robotVariants}
            animate="animate"
            className="w-full h-full"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* LED eyes */}
              <div className="absolute top-3 left-2 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="absolute top-3 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>

              {/* Smile */}
              <svg
                className="absolute bottom-2 w-3 h-2"
                viewBox="0 0 10 5"
                fill="none"
              >
                <path
                  d="M 2 1 Q 5 3 8 1"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          </motion.div>

          {/* Pen with writing animation */}
          <motion.div
            variants={penVariants}
            animate="animate"
            className="absolute -right-2 -bottom-2 w-6 h-12 bg-yellow-400 dark:bg-yellow-500 rounded-r-full transform rotate-45"
          >
            <div className="w-1 h-3 bg-yellow-700 absolute bottom-0 left-2.5"></div>
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
            {message}
          </p>

          {/* Animated dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                custom={i}
                variants={dotVariants}
                animate="animate"
                className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
