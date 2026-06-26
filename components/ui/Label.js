import React from "react";

export function Label({ className = "", children, ...props }) {
  return (
    <label
      className={`text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
