import React from "react";

export interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  social: "google" | "facebook" | "apple" | "twitter" | "github";
  theme?: "brand" | "gray" | "color";
  size?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.05-.51 2.67-1.26z" />
  </svg>
);

export const SocialButton: React.FC<SocialButtonProps> = ({
  social,
  theme = "brand",
  size = "md",
  children,
  className = "",
  type = "button",
  ...props
}) => {
  const isIconOnly = !children;

  // Untitled UI sizing and styling tokens
  const sizeClasses = {
    sm: isIconOnly ? "p-2 rounded-lg" : "py-2 px-3 text-xs gap-2 rounded-lg",
    md: isIconOnly ? "py-3 px-4 rounded-xl" : "py-2.5 px-3.5 text-sm gap-2.5 rounded-lg",
    lg: isIconOnly ? "py-3.5 px-4 rounded-xl" : "py-3 px-4 text-sm gap-3 rounded-xl",
    xl: isIconOnly ? "py-3.5 px-5 rounded-2xl" : "py-3.5 px-4.5 text-base gap-3 rounded-xl",
  }[size];

  // Untitled UI Signature Outline and Shadow
  // - Border: 1px subtle neutral gray border (border-[#d0d5dd] / border-neutral-300)
  // - Shadow: Untitled UI shadow-xs [0px 1px 2px rgba(16,24,40,0.05)]
  // - Focus ring: 4px focus ring focus-visible:ring-4 focus-visible:ring-neutral-100
  const baseClasses =
    "inline-flex items-center justify-center font-semibold border border-[#d0d5dd] bg-white text-[#344054] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-[#f9fafb] hover:border-[#d0d5dd] hover:text-[#182230] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-100 transition-all duration-150 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:bg-[#f2f4f7]";

  // Icon sizing: if icon-only, use 30% enlarged size (w-7 h-7 sm:w-8 sm:h-8)
  const iconClass = isIconOnly
    ? "w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform"
    : size === "sm"
    ? "w-4 h-4 shrink-0"
    : size === "xl"
    ? "w-6 h-6 shrink-0"
    : "w-5 h-5 shrink-0";

  const renderIcon = () => {
    switch (social) {
      case "google":
        return <GoogleIcon className={iconClass} />;
      case "facebook":
        return <FacebookIcon className={iconClass} />;
      case "apple":
        return <AppleIcon className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {renderIcon()}
      {children &&
        (typeof children === "string" ? <span>{children}</span> : children)}
    </button>
  );
};

export default SocialButton;
