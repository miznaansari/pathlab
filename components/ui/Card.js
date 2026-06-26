import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/50 bg-white/70 backdrop-blur-xl shadow-xl dark:border-gray-800/50 dark:bg-gray-950/70 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3
      className={`text-2xl font-bold tracking-tight text-gray-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }) {
  return (
    <p
      className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}
