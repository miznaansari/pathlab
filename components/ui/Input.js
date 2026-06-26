import React, { forwardRef } from "react";

export const Input = forwardRef(({ className = "", error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100 disabled:pointer-events-none dark:bg-gray-900/50 dark:disabled:bg-gray-850
          ${
            error
              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-200 dark:border-gray-800 focus:ring-indigo-500/20 focus:border-indigo-500"
          } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
