import React from "react";

export function Avatar({ src, alt = "User", name = "", className = "" }) {
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.split(" ");
    return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-850/50 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
