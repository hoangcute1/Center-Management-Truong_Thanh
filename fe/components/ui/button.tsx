import * as React from "react";
import clsx from "clsx";

type Variant = "solid" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className,
  variant = "solid",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    solid: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props} />
  );
}
