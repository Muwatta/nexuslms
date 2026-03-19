import React from "react";

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  color = "cool",
}) => {
  // color refers to our extended tailwind colors
  return (
    <div
      className={`bg-${color}-50 dark:bg-${color}-800 border-l-4 border-${color}-500 p-4 rounded-lg shadow`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default StatsCard;
