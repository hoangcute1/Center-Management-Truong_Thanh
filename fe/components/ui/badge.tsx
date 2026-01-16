import * as React from "react";
import clsx from "clsx";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "info" | "success" | "warning" | "destructive" | "outline";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const styles: Record<string, string> = {
    default: "bg-gray-100 text-gray-800",
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-700",
    outline: "border border-gray-200 text-gray-800 bg-transparent",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
