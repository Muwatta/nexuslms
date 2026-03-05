import React from "react";
import { motion } from "framer-motion";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: string;
  fullWidth?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      fullWidth = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800",
      secondary:
        "bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700",
      danger:
        "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800",
      success:
        "bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
        whileTap={{
          scale: 0.98,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
        className={`inline-flex items-center space-x-2 rounded-lg font-medium transition-all ${
          variantClasses[variant]
        } ${sizeClasses[size]} ${fullWidth ? "w-full justify-center" : ""} ${className}`}
        {...props}
      >
        {icon && <span className="text-lg">{icon}</span>}
        <span>{children}</span>
      </motion.button>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
