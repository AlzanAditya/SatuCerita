import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "white";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6aee]/30";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#7d6aee] hover:bg-[#6c59dc] text-white border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc] shadow-sm hover:shadow-md active:scale-[0.98] active:border-b-[2px]",
      secondary:
        "bg-purple-50 hover:bg-purple-100 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs hover:shadow-xs active:scale-[0.98]",
      outline:
        "bg-white hover:bg-neutral-50 text-neutral-800 border border-purple-200 border-b-[3px] border-b-purple-300 shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px]",
      ghost:
        "bg-transparent hover:bg-neutral-100 text-neutral-700 active:scale-[0.98]",
      danger:
        "bg-red-600 hover:bg-red-700 text-white border border-red-500 border-b-[3px] border-b-red-900 shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px]",
      white:
        "bg-white hover:bg-purple-50 text-[#7d6aee] border border-white/40 shadow-sm active:scale-[0.98]",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      xs: "py-1 px-2.5 text-xs rounded-lg gap-1.5",
      sm: "py-1.5 px-3.5 text-xs sm:text-sm rounded-xl gap-2",
      md: "py-2.5 sm:py-3 px-5 sm:px-6 text-sm sm:text-base rounded-xl gap-2",
      lg: "py-3.5 px-6 sm:px-8 text-base rounded-2xl gap-2.5",
      icon: "p-2 rounded-xl",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
          isDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
        } ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
