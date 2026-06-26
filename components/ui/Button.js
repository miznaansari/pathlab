import React from "react";
import { Loader } from "./Loader";

export function Button({
  className = "",
  variant = "default",
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    default:
      "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10 focus:ring-indigo-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500",
    destructive:
      "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/10 focus:ring-red-500",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-indigo-500",
    ghost:
      "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-indigo-500",
    link: "text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 focus:ring-indigo-500 p-0",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
