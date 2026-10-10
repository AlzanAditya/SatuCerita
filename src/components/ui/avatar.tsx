import React, { useState, useEffect } from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  status?: "online" | "offline";
  contrastBorder?: boolean;
  border?: boolean; // Konfigurasi border bawaan Untitled UI (<Avatar border ... />)
  bordered?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "size-6 text-xs",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-14 text-lg",
  "2xl": "size-16 text-xl",
};

const statusSizeClasses = {
  xs: "size-1.5 ring-1",
  sm: "size-2 ring-1.5",
  md: "size-2.5 ring-2",
  lg: "size-3 ring-2",
  xl: "size-3.5 ring-2",
  "2xl": "size-4 ring-2",
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Olivia Rhye",
  initials,
  size = "md",
  status,
  contrastBorder = true,
  border = true, // Default aktif jika dipanggil <Avatar border ... />
  bordered,
  className = "",
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const hasBorder = border !== undefined ? Boolean(border) : Boolean(bordered);
  const showImage = Boolean(src && !imageError);

  // Border bawaan Untitled UI:
  // - ring-2 ring-white: ring putih tebal 2px
  // - shadow-xs / subtle shadow: membuat ring putih terlihat jelas dan kontras di latar belakang mana pun
  const borderStyles = hasBorder
    ? "ring-2 ring-white shadow-xs"
    : contrastBorder
    ? "ring-1 ring-black/[0.08]"
    : "";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        sizeClasses[size]
      } ${borderStyles} ${className}`}
      {...props}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-100 text-neutral-700 font-semibold">
        {showImage ? (
          <img
            key={src}
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
            loading="eager"
            decoding="async"
          />
        ) : initials ? (
          <span className="uppercase tracking-wider font-semibold">
            {initials}
          </span>
        ) : (
          <svg
            className="w-3/5 h-3/5 text-neutral-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white ${
            statusSizeClasses[size]
          } ${status === "online" ? "bg-emerald-500" : "bg-neutral-300"}`}
        />
      )}
    </div>
  );
};

export default Avatar;
