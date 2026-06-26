import React from "react";

export function Badge({ className = "", variant = "default", children, ...props }) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider transition-colors uppercase";

  const variants = {
    default: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
