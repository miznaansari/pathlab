import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}) {
  // Prevent scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative z-10 w-full max-w-md transform rounded-2xl border border-gray-200/50 bg-white p-6 shadow-2xl transition-all duration-300 dark:border-gray-800/50 dark:bg-gray-950 ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}

        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
