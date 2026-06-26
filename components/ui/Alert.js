import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export function Alert({ className = "", variant = "info", title, children, ...props }) {
  const icons = {
    info: <Info className="h-5 w-5 text-indigo-500 shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    danger: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
  };

  const variants = {
    info: "bg-indigo-50/50 border-indigo-200/50 text-indigo-800 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-300",
    success: "bg-emerald-50/50 border-emerald-200/50 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-50/50 border-amber-200/50 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300",
    danger: "bg-red-50/50 border-red-200/50 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300",
  };

  return (
    <div
      className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${variants[variant]} ${className}`}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-bold mb-1 tracking-wide">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
