import * as React from "react";
import clsx from "clsx";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "solid",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    solid: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
  };
  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
